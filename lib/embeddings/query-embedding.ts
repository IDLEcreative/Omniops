/**
 * Query embedding generation with caching
 */

import { embeddingCache } from '@/lib/embedding-cache';
import { getOpenAIClient } from './openai-client';

export async function generateQueryEmbedding(
  query: string,
  enrichWithIntent: boolean = true,
  domain?: string
): Promise<number[]> {
  // Check cache first
  const cached = embeddingCache.get(query);
  if (cached) {
    console.log('[Performance] Query embedding from cache');
    return cached;
  }

  try {
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embeddingData = response.data[0];
    if (!embeddingData || !embeddingData.embedding) {
      throw new Error('No embedding returned from OpenAI API');
    }

    const embedding = embeddingData.embedding;

    // Cache the query embedding
    embeddingCache.set(query, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}
