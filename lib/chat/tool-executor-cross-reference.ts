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
import { rankProducts, extractBudgetFromQuery } from '@/lib/search/result-ranker';

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

  // Extract user query for budget-based ranking
  const userQuery = commerceResult.toolArgs.query || '';
  const userBudget = extractBudgetFromQuery(userQuery);

  if (userBudget) {
    console.log(`[Cross-Reference] Extracted budget from query: £${userBudget}`);
  }

  // Apply multi-signal ranking to enriched products
  const rankedProducts = rankProducts(enrichedProducts, { userBudget });

  console.log(`[Cross-Reference] Ranked ${rankedProducts.length} products using multi-signal algorithm`);

  // Add product recommendations (top 3 ranked products get recommendations)
  const topProducts = rankedProducts.slice(0, 3);
  const allProducts = products; // All available products for recommendations

  console.log(`[Cross-Reference] Finding recommendations for top ${topProducts.length} products...`);

  for (const rankedProduct of topProducts) {
    try {
      // Generate embedding for current product
      const productText = `${rankedProduct.name} ${rankedProduct.short_description || rankedProduct.description || ''}`;
      const productEmbedding = await generateProductEmbedding(productText);

      // Find similar products (excluding only the current product and top 3 already shown)
      // This allows recommending products from the search results that aren't in top 3
      const excludeIds = new Set(topProducts.map(p => p.id));
      const recommendations = await findSimilarProducts(
        rankedProduct,
        allProducts,
        productEmbedding,
        {
          limit: 3,
          minSimilarity: 0.6, // Slightly lower threshold to get more recommendations
          excludeIds
        }
      );

      rankedProduct.recommendations = recommendations;

      console.log(`[Cross-Reference] Found ${recommendations.length} recommendations for "${rankedProduct.name}"`);
    } catch (error) {
      console.error(`[Cross-Reference] Failed to find recommendations for product ${rankedProduct.id}:`, error);
      rankedProduct.recommendations = [];
    }
  }

  // Update commerce result with ranked products
  commerceResult.result.results = rankedProducts.map(ranked => ({
    url: ranked.scrapedPage?.url || ranked.permalink || `product-${ranked.id}`,
    title: ranked.name,
    content: ranked.enrichedDescription || ranked.short_description || ranked.description || '',
    similarity: ranked.finalScore, // Use ranking score instead of just similarity
    metadata: {
      ...ranked,
      // Include matched page URL for "Learn more" links
      matchedPageUrl: ranked.scrapedPage?.url,
      // Include related pages for recommendations
      relatedPages: ranked.relatedPages?.map((p: any) => ({
        title: p.title,
        url: p.url,
        similarity: p.similarity
      })) || [],
      // Include product recommendations
      recommendations: ranked.recommendations?.map((rec: any) => ({
        id: rec.id,
        name: rec.name,
        price: rec.price,
        permalink: rec.permalink,
        similarity: rec.similarity,
        recommendationReason: rec.recommendationReason
      })) || [],
      // Include ranking signals for transparency
      rankingScore: ranked.finalScore,
      rankingSignals: ranked.rankingSignals,
      rankingExplanation: ranked.rankingExplanation,
      // Flag sources
      sources: ranked.sources
    }
  }));

  // Update scraped result with only unique pages (no duplicates)
  scrapedResult.result.results = uniqueScrapedPages;

  console.log(`[Cross-Reference] ✅ Complete: ${rankedProducts.length} ranked products, ${uniqueScrapedPages.length} unique pages`);

  return toolExecutionResults;
}
