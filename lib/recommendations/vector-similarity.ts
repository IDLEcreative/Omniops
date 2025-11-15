/**
 * Vector Similarity Recommendations
 *
 * Uses product embeddings and cosine similarity to find
 * similar products based on semantic meaning and attributes.
 *
 * @module recommendations/vector-similarity
 */

import { createClient } from '@/lib/supabase/server';
import { ProductRecommendation } from './engine';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20 * 1000,    // 20 seconds (embeddings need 1-5s normally)
  maxRetries: 2,          // Retry failed requests twice
});

export interface VectorSimilarityRequest {
  domainId: string;
  productIds?: string[]; // Products to find similar items for
  context?: {
    detectedIntent?: string;
    mentionedProducts?: string[];
    categories?: string[];
  };
  limit: number;
  excludeProductIds?: string[];
}

/**
 * Get product recommendations using vector similarity
 */
export async function vectorSimilarityRecommendations(
  request: VectorSimilarityRequest
): Promise<ProductRecommendation[]> {
  try {
    const supabase = await createClient();

    // If we have product IDs, find similar products
    if (request.productIds?.length) {
      return await findSimilarProducts(
        request.productIds,
        request.domainId,
        request.limit,
        request.excludeProductIds
      );
    }

    // If we have context, search by semantic similarity
    if (request.context?.detectedIntent) {
      return await searchByIntent(
        request.context.detectedIntent,
        request.domainId,
        request.limit,
        request.excludeProductIds
      );
    }

    // Fallback: Return popular products
    return await getPopularProducts(
      request.domainId,
      request.limit,
      request.excludeProductIds
    );
  } catch (error) {
    console.error('[VectorSimilarity] Error:', error);
    return [];
  }
}

/**
 * Find similar products using vector embeddings
 */
async function findSimilarProducts(
  productIds: string[],
  domainId: string,
  limit: number,
  excludeIds?: string[]
): Promise<ProductRecommendation[]> {
  const supabase = await createClient();

  try {
    // Get embeddings for reference products
    const { data: refEmbeddings, error: refError } = await supabase
      .from('product_embeddings')
      .select('embedding')
      .eq('domain_id', domainId)
      .in('product_id', productIds);

    if (refError || !refEmbeddings?.length) {
      console.warn('[VectorSimilarity] No reference embeddings found');
      return [];
    }

    // Average the reference embeddings
    const avgEmbedding = averageEmbeddings(
      refEmbeddings.map((e) => e.embedding)
    );

    // Find similar products using cosine similarity
    const { data: similar, error: similarError } = await supabase.rpc(
      'match_products',
      {
        query_embedding: avgEmbedding,
        match_threshold: 0.7,
        match_count: limit + (excludeIds?.length || 0),
        p_domain_id: domainId,
      }
    );

    if (similarError) {
      console.error('[VectorSimilarity] Match error:', similarError);
      return [];
    }

    // Filter and format results
    const recommendations = similar
      .filter(
        (item: any) =>
          !productIds.includes(item.product_id) &&
          (!excludeIds || !excludeIds.includes(item.product_id))
      )
      .slice(0, limit)
      .map((item: any) => ({
        productId: item.product_id,
        score: item.similarity,
        algorithm: 'vector_similarity',
        reason: 'Similar to viewed products',
        metadata: {
          similarity: item.similarity,
        },
      }));

    return recommendations;
  } catch (error) {
    console.error('[VectorSimilarity] Find similar error:', error);
    return [];
  }
}

/**
 * Search products by semantic intent
 */
async function searchByIntent(
  intent: string,
  domainId: string,
  limit: number,
  excludeIds?: string[]
): Promise<ProductRecommendation[]> {
  try {
    // Generate embedding for the intent
    const embedding = await generateEmbedding(intent);

    const supabase = await createClient();

    // Search for matching products
    const { data: matches, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: 0.65,
      match_count: limit + (excludeIds?.length || 0),
      p_domain_id: domainId,
    });

    if (error) {
      console.error('[VectorSimilarity] Search error:', error);
      return [];
    }

    // Filter and format
    const recommendations = matches
      .filter(
        (item: any) =>
          !excludeIds || !excludeIds.includes(item.product_id)
      )
      .slice(0, limit)
      .map((item: any) => ({
        productId: item.product_id,
        score: item.similarity,
        algorithm: 'vector_similarity',
        reason: `Matches your query: "${intent.substring(0, 50)}..."`,
        metadata: {
          similarity: item.similarity,
          intent,
        },
      }));

    return recommendations;
  } catch (error) {
    console.error('[VectorSimilarity] Intent search error:', error);
    return [];
  }
}

/**
 * Get popular products as fallback
 */
async function getPopularProducts(
  domainId: string,
  limit: number,
  excludeIds?: string[]
): Promise<ProductRecommendation[]> {
  const supabase = await createClient();

  try {
    // Get products with most recommendations/clicks
    const { data, error } = await supabase
      .from('recommendation_events')
      .select('product_id, clicked, purchased')
      .eq('shown', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !data) return [];

    // Count clicks per product
    const productScores = new Map<string, number>();
    data.forEach((event) => {
      const current = productScores.get(event.product_id) || 0;
      const score = event.purchased ? 3 : event.clicked ? 2 : 1;
      productScores.set(event.product_id, current + score);
    });

    // Sort by score
    const sorted = Array.from(productScores.entries())
      .filter(([id]) => !excludeIds || !excludeIds.includes(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([productId, score]) => ({
      productId,
      score: score / 10, // Normalize to 0-1
      algorithm: 'vector_similarity',
      reason: 'Popular product',
      metadata: { popularity: score },
    }));
  } catch (error) {
    console.error('[VectorSimilarity] Popular products error:', error);
    return [];
  }
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Average multiple embeddings
 */
function averageEmbeddings(embeddings: number[][]): number[] {
  if (!embeddings.length) return [];

  const dimension = embeddings[0].length;
  const avg = new Array(dimension).fill(0);

  embeddings.forEach((emb) => {
    emb.forEach((val, i) => {
      avg[i] += val;
    });
  });

  return avg.map((val) => val / embeddings.length);
}
