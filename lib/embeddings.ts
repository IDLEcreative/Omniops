/**
 * Embeddings module - proxy file for backward compatibility
 *
 * This file re-exports all functions from the modular embeddings directory
 * to maintain backward compatibility with existing imports.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

export {
  searchSimilarContent,
  searchSimilarContentOptimized,
  generateQueryEmbedding,
  QueryTimer,
  getOpenAIClient,
  generateEmbeddings,
  splitIntoChunks,
  handleZeroResults,
  shouldTriggerRecovery,
} from './embeddings/index';

export type { SearchResult, CachedSearchResult, RecoveryResult } from './embeddings/index';

// Lazy load OpenAI client for backward compatibility functions
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey,
    timeout: 20 * 1000,    // 20 seconds (embeddings need 1-5s normally)
    maxRetries: 2,          // Retry failed requests twice
  });
}

/**
 * Generate embedding vectors for multiple text chunks (without caching)
 * Backward compatibility version for tests - uses simple batching
 */
export async function generateEmbeddingVectors(chunks: string[]): Promise<number[][]> {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  const BATCH_SIZE = 20;
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const response = await getClient().embeddings.create({
      model: 'text-embedding-ada-002',
      input: batch,
    });
    embeddings.push(...response.data.map(item => item.embedding));
  }

  return embeddings;
}

/**
 * Generate a single embedding for text
 * Backward compatibility wrapper for tests
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  const embeddingData = response.data[0];
  if (!embeddingData) {
    throw new Error('No embedding data returned from OpenAI API');
  }
  return embeddingData.embedding;
}

/**
 * Store embeddings in the database
 * Backward compatibility wrapper for tests
 */
export async function storeEmbeddings(
  pageId: string,
  chunks: string[],
  embeddings: number[][]
): Promise<void> {
  if (chunks.length !== embeddings.length) {
    throw new Error('Chunks and embeddings length mismatch');
  }

  const supabase = await createServiceRoleClient();

  const embeddingRecords = chunks.map((chunk, index) => ({
    page_id: pageId,
    chunk_text: chunk,
    embedding: embeddings[index],
    chunk_index: index,
  }));

  const { error } = await supabase
    .from('embeddings')
    .insert(embeddingRecords);

  if (error) {
    throw new Error('Failed to store embeddings: ' + error.message);
  }
}

/**
 * Search for similar content using embeddings
 * Backward compatibility wrapper for tests
 */
export async function searchSimilar(
  queryEmbedding: number[],
  limit: number = 10,
  threshold: number = 0.5
): Promise<Array<{
  id: string;
  chunk_text: string;
  page_id: string;
  similarity: number;
}>> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error('Failed to search embeddings: ' + error.message);
  }

  return data || [];
}
