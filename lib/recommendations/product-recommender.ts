/**
 * Product Recommendation Engine
 *
 * Finds semantically similar products using embeddings to provide
 * intelligent "you might also like" recommendations.
 */

import { calculateCosineSimilarity } from '@/lib/embeddings/product-embeddings';
import type { CommerceProduct } from '@/lib/search/result-consolidator';

/**
 * Recommended product with similarity and reasoning
 */
export interface RecommendedProduct extends CommerceProduct {
  similarity: number;
  recommendationReason: string;
}

/**
 * Embedding provider function type (for dependency injection)
 */
export type EmbeddingProvider = (productText: string) => Promise<number[]>;

/**
 * Find products similar to a given product
 *
 * @param currentProduct - The product to find recommendations for
 * @param availableProducts - Pool of products to recommend from
 * @param currentProductEmbedding - Pre-generated embedding for current product
 * @param options - Configuration options
 * @returns Array of recommended products sorted by similarity
 */
export async function findSimilarProducts(
  currentProduct: CommerceProduct,
  availableProducts: CommerceProduct[],
  currentProductEmbedding: number[],
  options: {
    limit?: number;
    minSimilarity?: number;
    excludeIds?: Set<number | string>;
    embeddingProvider?: EmbeddingProvider;
  } = {}
): Promise<RecommendedProduct[]> {
  const {
    limit = 3,
    minSimilarity = 0.7,
    excludeIds = new Set(),
    embeddingProvider = defaultEmbeddingProvider
  } = options;

  // Filter out current product and any excluded IDs
  const candidateProducts = availableProducts.filter(
    p => p.id !== currentProduct.id && !excludeIds.has(p.id)
  );

  if (candidateProducts.length === 0) {
    return [];
  }

  // Calculate similarity for each candidate
  const similarities = await Promise.all(
    candidateProducts.map(async (product) => {
      try {
        // Generate embedding for candidate product
        const productText = buildProductText(product);
        const productEmbedding = await embeddingProvider(productText);

        // Calculate similarity
        const similarity = calculateCosineSimilarity(
          currentProductEmbedding,
          productEmbedding
        );

        // Determine recommendation reason based on similarity
        const recommendationReason = getRecommendationReason(similarity, currentProduct, product);

        return {
          ...product,
          similarity,
          recommendationReason
        } as RecommendedProduct;
      } catch (error) {
        console.error(`[Recommender] Failed to process product ${product.id}:`, error);
        return null;
      }
    })
  );

  // Filter out failures and low-similarity products
  const validRecommendations = similarities
    .filter((rec): rec is RecommendedProduct => rec !== null && rec.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return validRecommendations;
}

/**
 * Build product text for embedding generation
 *
 * @param product - Product to build text from
 * @returns Combined product text
 */
function buildProductText(product: CommerceProduct): string {
  const parts = [
    product.name,
    product.short_description || product.description || '',
    product.categories?.map(c => c.name).join(' ') || ''
  ];

  return parts.filter(Boolean).join(' ').trim();
}

/**
 * Determine recommendation reason based on similarity and product attributes
 *
 * @param similarity - Similarity score (0-1)
 * @param currentProduct - The product being viewed
 * @param recommendedProduct - The product being recommended
 * @returns Human-readable recommendation reason
 */
function getRecommendationReason(
  similarity: number,
  currentProduct: CommerceProduct,
  recommendedProduct: CommerceProduct
): string {
  // Check for category overlap
  const currentCategories = new Set(currentProduct.categories?.map(c => c.name) || []);
  const recommendedCategories = new Set(recommendedProduct.categories?.map(c => c.name) || []);
  const sharedCategories = [...currentCategories].filter(c => recommendedCategories.has(c));

  // Check for price similarity
  const currentPrice = parseFloat(currentProduct.price || '0');
  const recommendedPrice = parseFloat(recommendedProduct.price || '0');
  const priceDiff = Math.abs(currentPrice - recommendedPrice);
  const isPriceSimilar = currentPrice > 0 && priceDiff / currentPrice < 0.3; // Within 30%

  // Generate reason based on similarity and attributes
  if (similarity > 0.85) {
    if (sharedCategories.length > 0 && sharedCategories[0]) {
      return `Very similar ${sharedCategories[0].toLowerCase()}`;
    }
    return 'Very similar product';
  }

  if (similarity > 0.75) {
    if (isPriceSimilar) {
      return 'Similar product at comparable price';
    }
    if (sharedCategories.length > 0 && sharedCategories[0]) {
      return `Related ${sharedCategories[0].toLowerCase()}`;
    }
    return 'Related product';
  }

  // 0.7 - 0.75
  if (sharedCategories.length > 0 && sharedCategories[0]) {
    return `In same category (${sharedCategories[0]})`;
  }

  return 'Might also be useful';
}

/**
 * Default embedding provider (uses existing product embedding generator)
 *
 * @param productText - Product text to generate embedding for
 * @returns Embedding vector
 */
async function defaultEmbeddingProvider(productText: string): Promise<number[]> {
  // Import dynamically to avoid circular dependencies
  const { generateProductEmbedding } = await import('@/lib/embeddings/product-embeddings');
  return await generateProductEmbedding(productText);
}

/**
 * Batch find recommendations for multiple products
 *
 * Optimized to avoid re-generating embeddings for the same products.
 *
 * @param products - Products to find recommendations for
 * @param allProducts - Pool of all available products
 * @param options - Configuration options
 * @returns Map of product ID to recommendations
 */
export async function findRecommendationsForProducts(
  products: CommerceProduct[],
  allProducts: CommerceProduct[],
  options: {
    limit?: number;
    minSimilarity?: number;
    embeddingProvider?: EmbeddingProvider;
  } = {}
): Promise<Map<string | number, RecommendedProduct[]>> {
  const { embeddingProvider = defaultEmbeddingProvider } = options;

  // Pre-generate embeddings for all products (batch optimization)
  const embeddingCache = new Map<string | number, number[]>();

  console.log(`[Recommender] Generating embeddings for ${allProducts.length} products...`);

  await Promise.all(
    allProducts.map(async (product) => {
      try {
        const productText = buildProductText(product);
        const embedding = await embeddingProvider(productText);
        embeddingCache.set(product.id, embedding);
      } catch (error) {
        console.error(`[Recommender] Failed to generate embedding for product ${product.id}:`, error);
      }
    })
  );

  console.log(`[Recommender] Generated ${embeddingCache.size} embeddings`);

  // Pre-index products by text for O(1) lookup instead of O(n) Array.find
  const productByText = new Map<string, CommerceProduct>(
    allProducts.map(p => [buildProductText(p), p])
  );

  // Find recommendations for each product
  const recommendations = new Map<string | number, RecommendedProduct[]>();
  const processedIds = new Set<string | number>();

  for (const product of products) {
    const productEmbedding = embeddingCache.get(product.id);

    if (!productEmbedding) {
      console.warn(`[Recommender] No embedding for product ${product.id}, skipping recommendations`);
      recommendations.set(product.id, []);
      continue;
    }

    // Exclude products we've already shown recommendations for
    const excludeIds = new Set([...processedIds, product.id]);

    const recs = await findSimilarProducts(
      product,
      allProducts,
      productEmbedding,
      {
        ...options,
        excludeIds,
        embeddingProvider: async (text) => {
          // Use cached embeddings when available (O(1) Map lookup instead of O(n) Array.find)
          const matchingProduct = productByText.get(text);
          if (matchingProduct && embeddingCache.has(matchingProduct.id)) {
            return embeddingCache.get(matchingProduct.id)!;
          }
          return await embeddingProvider(text);
        }
      }
    );

    recommendations.set(product.id, recs);
    processedIds.add(product.id);

    // Also mark recommended products as processed (don't recommend them for other products)
    recs.forEach(rec => processedIds.add(rec.id));
  }

  return recommendations;
}
