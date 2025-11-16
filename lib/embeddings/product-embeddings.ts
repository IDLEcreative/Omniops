/**
 * Product Embeddings Utility
 *
 * Generates and caches embeddings for WooCommerce products to enable
 * semantic similarity scoring in product search results.
 */

import { generateQueryEmbedding } from './query-embedding';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Supabase client for caching (using service role for background operations)
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Calculate MD5 hash of product text for cache validation
 *
 * @param text - Product text to hash
 * @returns MD5 hash string
 */
function calculateHash(text: string): string {
  return createHash('md5').update(text).digest('hex');
}

/**
 * Get cached embedding from database
 *
 * @param domain - Customer domain
 * @param productId - Product ID
 * @param productText - Current product text
 * @returns Cached embedding if valid, null otherwise
 */
async function getCachedEmbedding(
  domain: string,
  productId: string,
  productText: string
): Promise<number[] | null> {
  try {
    const supabase = getSupabaseClient();
    const textHash = calculateHash(productText);

    const { data, error } = await supabase
      .from('product_embeddings')
      .select('embedding, product_text_hash')
      .eq('domain', domain)
      .eq('product_id', productId)
      .single();

    if (error || !data) {
      return null;
    }

    // Validate cache: if product text changed, cache is invalid
    if (data.product_text_hash !== textHash) {
      console.log(`[Product Embeddings] Cache miss: product ${productId} text changed`);
      return null;
    }

    // Update access tracking
    await supabase
      .from('product_embeddings')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.raw('access_count + 1')
      })
      .eq('domain', domain)
      .eq('product_id', productId);

    console.log(`[Product Embeddings] Cache hit: product ${productId}`);
    return data.embedding as number[];
  } catch (error) {
    console.error('[Product Embeddings] Cache retrieval error:', error);
    return null;
  }
}

/**
 * Save embedding to cache
 *
 * @param domain - Customer domain
 * @param productId - Product ID
 * @param productText - Product text
 * @param embedding - Generated embedding
 * @param productSku - Optional product SKU
 */
async function saveEmbeddingToCache(
  domain: string,
  productId: string,
  productText: string,
  embedding: number[],
  productSku?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const textHash = calculateHash(productText);

    await supabase
      .from('product_embeddings')
      .upsert({
        domain,
        product_id: productId,
        product_sku: productSku,
        product_text: productText,
        product_text_hash: textHash,
        embedding,
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'domain,product_id'
      });

    console.log(`[Product Embeddings] Cached: product ${productId}`);
  } catch (error) {
    console.error('[Product Embeddings] Cache save error:', error);
    // Don't throw - caching is optional optimization
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 *
 * @param vectorA - First embedding vector
 * @param vectorB - Second embedding vector
 * @returns Similarity score between 0 and 1 (1 = identical, 0 = completely different)
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  // Calculate magnitudes
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Cosine similarity = dot product / (magnitude A * magnitude B)
  const similarity = dotProduct / (magnitudeA * magnitudeB);

  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Generate embedding for product text (name + description)
 * Uses the same embedding model as content search for consistency
 *
 * @param productText - Product name and description combined
 * @returns Embedding vector
 */
export async function generateProductEmbedding(productText: string): Promise<number[]> {
  return await generateQueryEmbedding(productText, false);
}

/**
 * Score products by semantic similarity to a search query
 *
 * @param products - Array of products with name, description, and id
 * @param queryEmbedding - Pre-generated embedding for the search query
 * @param domain - Customer domain (for caching)
 * @returns Products with added similarity scores, sorted by relevance
 */
export async function scoreProductsBySimilarity<T extends { id: number | string; name: string; short_description?: string; description?: string; sku?: string }>(
  products: T[],
  queryEmbedding: number[],
  domain?: string
): Promise<Array<T & { similarity: number; relevanceReason: string }>> {
  const scoredProducts = await Promise.all(
    products.map(async (product) => {
      // Combine name and description for embedding
      const productText = `${product.name} ${product.short_description || product.description || ''}`.trim();
      const productId = String(product.id);

      let productEmbedding: number[];

      // Try to get from cache if domain provided
      if (domain) {
        const cached = await getCachedEmbedding(domain, productId, productText);
        if (cached) {
          productEmbedding = cached;
        } else {
          // Cache miss - generate and save
          productEmbedding = await generateProductEmbedding(productText);
          await saveEmbeddingToCache(domain, productId, productText, productEmbedding, product.sku);
        }
      } else {
        // No domain - skip caching
        productEmbedding = await generateProductEmbedding(productText);
      }

      // Calculate similarity score
      const similarity = calculateCosineSimilarity(queryEmbedding, productEmbedding);

      // Determine relevance reason based on similarity threshold
      const relevanceReason =
        similarity > 0.8 ? 'Highly relevant' :
        similarity > 0.6 ? 'Moderately relevant' :
        'Loosely related';

      return {
        ...product,
        similarity,
        relevanceReason
      };
    })
  );

  // Sort by similarity (highest first)
  return scoredProducts.sort((a, b) => b.similarity - a.similarity);
}
