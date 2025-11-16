/**
 * Tool Executor - Cross-Reference Logic
 *
 * Handles cross-referencing WooCommerce/Shopify products with scraped website pages.
 * Matches products with their pages to provide enriched information.
 */

import { mergeAndDeduplicateResults, type CommerceProduct } from '@/lib/search/result-consolidator';
import { findSimilarProducts, type RecommendedProduct } from '@/lib/recommendations/product-recommender';
import { generateProductEmbedding } from '@/lib/embeddings/product-embeddings';
import type { ToolExecutionResult } from './ai-processor-types';

/**
 * Cross-reference WooCommerce/Shopify products with scraped website pages
 *
 * Matches products with their pages to provide enriched information:
 * - Links products to their website pages
 * - Enriches descriptions with scraped content
 * - Identifies related pages
 */
export async function crossReferenceResults(
  toolExecutionResults: ToolExecutionResult[]
): Promise<ToolExecutionResult[]> {
  // Find WooCommerce/Shopify tool results (has product metadata)
  const commerceResult = toolExecutionResults.find(r =>
    r.toolName === 'woocommerce_operations' &&
    r.toolArgs.operation === 'search_products' &&
    r.result.success &&
    r.result.results.some(res => res.metadata)
  );

  // Find scraped content results
  const scrapedResult = toolExecutionResults.find(r =>
    r.toolName === 'search_website_content' &&
    r.result.success
  );

  // Only consolidate if we have BOTH product data AND scraped pages
  if (!commerceResult || !scrapedResult) {
    console.log('[Cross-Reference] Skipping: need both commerce products and scraped pages');
    return toolExecutionResults;
  }

  console.log('[Cross-Reference] Starting consolidation...');

  // Extract products from commerce result metadata
  const products: CommerceProduct[] = commerceResult.result.results
    .filter(r => r.metadata)
    .map(r => r.metadata as CommerceProduct);

  const scrapedPages = scrapedResult.result.results;

  // Consolidate and deduplicate
  const { enrichedProducts, uniqueScrapedPages } = mergeAndDeduplicateResults(
    products,
    scrapedPages
  );

  console.log(`[Cross-Reference] Enriched ${enrichedProducts.length} products, ${uniqueScrapedPages.length} unique pages`);

  // Add product recommendations (top 3 products get recommendations)
  const topProducts = enrichedProducts.slice(0, 3);
  const allProducts = products; // All available products for recommendations

  console.log(`[Cross-Reference] Finding recommendations for top ${topProducts.length} products...`);

  for (const enrichedProduct of topProducts) {
    try {
      // Generate embedding for current product
      const productText = `${enrichedProduct.name} ${enrichedProduct.short_description || enrichedProduct.description || ''}`;
      const productEmbedding = await generateProductEmbedding(productText);

      // Find similar products (excluding only the current product and top 3 already shown)
      // This allows recommending products from the search results that aren't in top 3
      const excludeIds = new Set(topProducts.map(p => p.id));
      const recommendations = await findSimilarProducts(
        enrichedProduct,
        allProducts,
        productEmbedding,
        {
          limit: 3,
          minSimilarity: 0.6, // Slightly lower threshold to get more recommendations
          excludeIds
        }
      );

      enrichedProduct.recommendations = recommendations;

      console.log(`[Cross-Reference] Found ${recommendations.length} recommendations for "${enrichedProduct.name}"`);
    } catch (error) {
      console.error(`[Cross-Reference] Failed to find recommendations for product ${enrichedProduct.id}:`, error);
      enrichedProduct.recommendations = [];
    }
  }

  // Update commerce result with enriched products
  commerceResult.result.results = enrichedProducts.map(enriched => ({
    url: enriched.scrapedPage?.url || enriched.permalink || `product-${enriched.id}`,
    title: enriched.name,
    content: enriched.enrichedDescription || enriched.short_description || enriched.description || '',
    similarity: enriched.finalSimilarity,
    metadata: {
      ...enriched,
      // Include matched page URL for "Learn more" links
      matchedPageUrl: enriched.scrapedPage?.url,
      // Include related pages for recommendations
      relatedPages: enriched.relatedPages.map(p => ({
        title: p.title,
        url: p.url,
        similarity: p.similarity
      })),
      // Include product recommendations
      recommendations: enriched.recommendations.map(rec => ({
        id: rec.id,
        name: rec.name,
        price: rec.price,
        permalink: rec.permalink,
        similarity: rec.similarity,
        recommendationReason: rec.recommendationReason
      })),
      // Flag sources
      sources: enriched.sources
    }
  }));

  // Update scraped result with only unique pages (no duplicates)
  scrapedResult.result.results = uniqueScrapedPages;

  console.log(`[Cross-Reference] ✅ Complete: ${enrichedProducts.length} enriched products, ${uniqueScrapedPages.length} unique pages`);

  return toolExecutionResults;
}
