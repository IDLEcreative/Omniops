/**
 * Result Consolidator
 *
 * Matches and enriches WooCommerce/Shopify products with scraped website pages
 * to provide comprehensive product information from multiple sources.
 */

import type { SearchResult } from '@/lib/embeddings-functions';

/**
 * WooCommerce/Shopify product (minimal interface)
 */
export interface CommerceProduct {
  id: number | string;
  name: string;
  slug?: string;
  permalink?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_status?: string;
  short_description?: string;
  description?: string;
  images?: Array<{ src: string; alt?: string }>;
  categories?: Array<{ name: string; slug: string }>;
  sku?: string;
  similarity?: number;
  relevanceReason?: string;
}

/**
 * Recommended product (from recommender system)
 */
export interface RecommendedProduct extends CommerceProduct {
  similarity: number;
  recommendationReason: string;
}

/**
 * Enriched product with matched scraped content and recommendations
 */
export interface EnrichedProduct extends CommerceProduct {
  // Matched scraped page
  scrapedPage?: SearchResult;

  // Related pages by semantic similarity
  relatedPages: SearchResult[];

  // Product recommendations (similar products)
  recommendations: RecommendedProduct[];

  // Enhanced description (product + scraped content)
  enrichedDescription: string;

  // Final similarity score (product or page)
  finalSimilarity: number;

  // Source of information
  sources: {
    liveData: boolean; // Has live WooCommerce/Shopify data
    scrapedContent: boolean; // Has scraped page content
    relatedContent: boolean; // Has related pages
  };
}

/**
 * Match a commerce product with its scraped page by URL/slug/name
 *
 * @param product - Commerce product to match
 * @param scrapedResults - Available scraped pages
 * @returns Matched scraped page or undefined
 */
function matchProductWithPage(
  product: CommerceProduct,
  scrapedResults: SearchResult[]
): SearchResult | undefined {
  // Try matching by URL/slug (most reliable)
  if (product.slug) {
    const slugMatch = scrapedResults.find(scraped =>
      scraped.url.toLowerCase().includes(product.slug!.toLowerCase())
    );
    if (slugMatch) {
      console.log(`[Consolidator] Matched product "${product.name}" by slug: ${product.slug}`);
      return slugMatch;
    }
  }

  // Try matching by permalink
  if (product.permalink) {
    const permalinkMatch = scrapedResults.find(scraped =>
      scraped.url === product.permalink ||
      scraped.url.endsWith(product.permalink)
    );
    if (permalinkMatch) {
      console.log(`[Consolidator] Matched product "${product.name}" by permalink`);
      return permalinkMatch;
    }
  }

  // Try matching by name similarity (fuzzy match)
  const normalizedProductName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const nameMatch = scrapedResults.find(scraped => {
    const normalizedTitle = scraped.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedUrl = scraped.url.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if product name appears in title or URL
    return normalizedTitle.includes(normalizedProductName) ||
           normalizedProductName.includes(normalizedTitle) ||
           normalizedUrl.includes(normalizedProductName);
  });

  if (nameMatch) {
    console.log(`[Consolidator] Matched product "${product.name}" by name similarity`);
    return nameMatch;
  }

  return undefined;
}

/**
 * Find related pages by semantic similarity threshold
 *
 * @param scrapedResults - All scraped pages
 * @param minSimilarity - Minimum similarity threshold (default 0.7)
 * @param limit - Maximum related pages to return (default 3)
 * @returns Related pages sorted by similarity
 */
function findRelatedPages(
  scrapedResults: SearchResult[],
  minSimilarity: number = 0.7,
  limit: number = 3
): SearchResult[] {
  return scrapedResults
    .filter(page => page.similarity && page.similarity >= minSimilarity)
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, limit);
}

/**
 * Consolidate commerce products with scraped pages
 *
 * Matches products with their pages, enriches descriptions, and finds related content.
 *
 * @param products - Commerce products (WooCommerce/Shopify)
 * @param scrapedResults - Scraped website pages with similarity scores
 * @returns Enriched products with matched and related content
 */
export function consolidateResults(
  products: CommerceProduct[],
  scrapedResults: SearchResult[]
): EnrichedProduct[] {
  console.log(`[Consolidator] Consolidating ${products.length} products with ${scrapedResults.length} scraped pages`);

  return products.map((product) => {
    // Match product with its scraped page
    const matchedPage = matchProductWithPage(product, scrapedResults);

    // Find related pages (excluding the matched page)
    const relatedPages = findRelatedPages(
      scrapedResults.filter(page => page !== matchedPage),
      0.7, // Minimum 70% similarity
      3    // Max 3 related pages
    );

    // Enrich description with scraped content
    let enrichedDescription = product.short_description || product.description || '';

    if (matchedPage) {
      // Add scraped content to description
      enrichedDescription = `${enrichedDescription}\n\n${matchedPage.content || ''}`.trim();
    }

    // Calculate final similarity (prefer product similarity, fallback to page)
    const finalSimilarity = product.similarity ?? matchedPage?.similarity ?? 0;

    // Determine sources
    const sources = {
      liveData: true, // Always have live product data
      scrapedContent: !!matchedPage,
      relatedContent: relatedPages.length > 0
    };

    const enriched: EnrichedProduct = {
      ...product,
      scrapedPage: matchedPage,
      relatedPages,
      recommendations: [], // Populated later in cross-referencing
      enrichedDescription,
      finalSimilarity,
      sources
    };

    // Log consolidation result
    if (matchedPage) {
      console.log(`[Consolidator] ✅ Product "${product.name}" enriched with scraped page: ${matchedPage.url}`);
    } else {
      console.log(`[Consolidator] ⚠️  Product "${product.name}" has no matching scraped page`);
    }

    if (relatedPages.length > 0) {
      console.log(`[Consolidator]    → ${relatedPages.length} related pages found`);
    }

    return enriched;
  });
}

/**
 * Merge and deduplicate results from multiple sources
 *
 * When we have both WooCommerce products and scraped pages, some might be duplicates.
 * This function identifies duplicates and merges them into enriched products.
 *
 * @param products - Commerce products
 * @param scrapedResults - Scraped pages
 * @returns Enriched products + unique scraped pages (no duplicates)
 */
export function mergeAndDeduplicateResults(
  products: CommerceProduct[],
  scrapedResults: SearchResult[]
): {
  enrichedProducts: EnrichedProduct[];
  uniqueScrapedPages: SearchResult[];
} {
  // Consolidate products with their matched pages
  const enrichedProducts = consolidateResults(products, scrapedResults);

  // Find scraped pages that weren't matched to any product
  const matchedPageUrls = new Set(
    enrichedProducts
      .filter(p => p.scrapedPage)
      .map(p => p.scrapedPage!.url)
  );

  const uniqueScrapedPages = scrapedResults.filter(
    page => !matchedPageUrls.has(page.url)
  );

  console.log(`[Consolidator] Final results: ${enrichedProducts.length} products, ${uniqueScrapedPages.length} unique pages`);

  return {
    enrichedProducts,
    uniqueScrapedPages
  };
}
