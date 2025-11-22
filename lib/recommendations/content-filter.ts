/**
 * Content-Based Filtering Recommendations
 *
 * Recommends products based on product attributes, categories,
 * tags, and metadata similarity.
 *
 * @module recommendations/content-filter
 */

import { createClient } from '@/lib/supabase/server';
import { ProductRecommendation } from './engine';

export interface ContentFilterRequest {
  domainId: string;
  productIds?: string[]; // Reference products
  categories?: string[];
  tags?: string[];
  limit: number;
  excludeProductIds?: string[];
  context?: any;
}

/**
 * Get recommendations using content-based filtering
 */
export async function contentBasedRecommendations(
  request: ContentFilterRequest
): Promise<ProductRecommendation[]> {
  try {
    // Get reference product metadata
    const referenceProducts = await getProductMetadata(
      request.productIds || [],
      request.domainId
    );

    // Extract categories and tags from reference products
    const categories = new Set<string>(request.categories || []);
    const tags = new Set<string>(request.tags || []);

    referenceProducts.forEach((product) => {
      product.categories?.forEach((cat: string) => categories.add(cat));
      product.tags?.forEach((tag: string) => tags.add(tag));
    });

    // Find similar products based on content
    const recommendations = await findSimilarByContent(
      Array.from(categories),
      Array.from(tags),
      request.domainId,
      request.limit,
      request.excludeProductIds
    );

    return recommendations;
  } catch (error) {
    console.error('[ContentFilter] Error:', error);
    return [];
  }
}

/**
 * Get product metadata from embeddings table
 */
async function getProductMetadata(
  productIds: string[],
  domainId: string
): Promise<any[]> {
  if (!productIds.length) return [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('product_embeddings')
      .select('product_id, metadata')
      .eq('domain_id', domainId)
      .in('product_id', productIds);

    if (error || !data) return [];

    return data.map((row) => ({
      productId: row.product_id,
      ...(row.metadata || {}),
    }));
  } catch (error) {
    console.error('[ContentFilter] Get metadata error:', error);
    return [];
  }
}

/**
 * Find similar products by content attributes
 */
async function findSimilarByContent(
  categories: string[],
  tags: string[],
  domainId: string,
  limit: number,
  excludeIds?: string[]
): Promise<ProductRecommendation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  try {
    // Get all products with metadata
    const { data: products, error } = await supabase
      .from('product_embeddings')
      .select('product_id, metadata')
      .eq('domain_id', domainId);

    if (error || !products) return [];

    // Score each product based on content similarity
    const scored = products
      .map((product) => {
        const metadata = product.metadata || {};
        const score = calculateContentSimilarity(
          metadata,
          categories,
          tags
        );

        return {
          productId: product.product_id,
          score,
          metadata,
        };
      })
      .filter((item) => {
        // Filter out excluded products and low scores
        if (excludeIds?.includes(item.productId)) return false;
        if (item.score < 0.2) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Format as recommendations
    return scored.map((item) => ({
      productId: item.productId,
      score: item.score,
      algorithm: 'content_based',
      reason: buildReasonFromMetadata(item.metadata, categories, tags),
      metadata: {
        matchedCategories: findMatches(
          item.metadata.categories || [],
          categories
        ),
        matchedTags: findMatches(item.metadata.tags || [], tags),
      },
    }));
  } catch (error) {
    console.error('[ContentFilter] Find similar error:', error);
    return [];
  }
}

/**
 * Calculate content similarity score
 */
function calculateContentSimilarity(
  productMetadata: any,
  referenceCategories: string[],
  referenceTags: string[]
): number {
  const productCategories = productMetadata.categories || [];
  const productTags = productMetadata.tags || [];

  // Calculate Jaccard similarity for categories
  const categoryScore = jaccardSimilarity(
    productCategories,
    referenceCategories
  );

  // Calculate Jaccard similarity for tags
  const tagScore = jaccardSimilarity(productTags, referenceTags);

  // Weighted average (categories more important than tags)
  const score = categoryScore * 0.7 + tagScore * 0.3;

  return score;
}

/**
 * Jaccard similarity: intersection over union
 */
function jaccardSimilarity(set1: string[], set2: string[]): number {
  if (!set1.length && !set2.length) return 0;
  if (!set1.length || !set2.length) return 0;

  const s1 = new Set(set1.map((s) => s.toLowerCase()));
  const s2 = new Set(set2.map((s) => s.toLowerCase()));

  const intersection = new Set([...s1].filter((x) => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return intersection.size / union.size;
}

/**
 * Find matching elements between two arrays
 */
function findMatches(arr1: string[], arr2: string[]): string[] {
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase()));

  return [...set1].filter((x) => set2.has(x));
}

/**
 * Build human-readable reason from metadata
 */
function buildReasonFromMetadata(
  metadata: any,
  categories: string[],
  tags: string[]
): string {
  const matchedCats = findMatches(metadata.categories || [], categories);
  const matchedTags = findMatches(metadata.tags || [], tags);

  if (matchedCats.length && matchedTags.length) {
    return `Similar category (${matchedCats[0]}) and tags`;
  } else if (matchedCats.length) {
    return `Same category: ${matchedCats[0]}`;
  } else if (matchedTags.length) {
    return `Similar tags: ${matchedTags.slice(0, 2).join(', ')}`;
  }

  return 'Similar product attributes';
}
