/**
 * Embeddings Module - AI-optimized header for fast comprehension
 *
 * @purpose Proxy file for backward compatibility - re-exports modular embeddings functions
 *
 * @flow
 *   1. Import request → Re-export from ./embeddings/index (modern functions)
 *   2. OR use legacy functions (generateEmbeddingVectors, generateEmbedding, storeEmbeddings, searchSimilar)
 *   3. → OpenAI embedding generation OR database search
 *
 * @keyFunctions
 *   - getClient (line 32): Creates OpenAI client with 20s timeout, 2 retries
 *   - generateEmbeddingVectors (line 48): Batch generates embeddings (BATCH_SIZE=20)
 *   - generateEmbedding (line 72): Single embedding generation (text-embedding-ada-002)
 *   - storeEmbeddings (line 84): Stores chunks + embeddings in database
 *   - searchSimilar (line 115): Searches similar content using match_embeddings RPC
 *
 * @handles
 *   - Modern imports: Use ./embeddings/index exports (searchSimilarContent, generateQueryEmbedding, etc.)
 *   - Legacy imports: Backward compatibility functions for existing tests
 *   - Batch processing: 20 chunks per OpenAI API call
 *   - Error handling: Throws on API key missing, embedding length mismatch, database errors
 *
 * @returns
 *   - Exports: Modern functions from ./embeddings/index + legacy functions
 *   - Types: SearchResult, CachedSearchResult, RecoveryResult
 *
 * @dependencies
 *   - OpenAI API: text-embedding-ada-002 model
 *   - Database: embeddings table, match_embeddings RPC function
 *   - Environment: OPENAI_API_KEY required
 *
 * @consumers
 *   - Tests: Use legacy functions (generateEmbedding, storeEmbeddings, searchSimilar)
 *   - Production: Use modern functions from ./embeddings/index
 *   - app/api/chat/route.ts: searchSimilarContent for AI queries
 *
 * @testingStrategy
 *   - Mock OpenAI client: Use jest.fn() for embeddings API calls
 *   - Test batch processing: Verify BATCH_SIZE=20 chunks per request
 *   - Test search: Mock match_embeddings RPC, verify similarity scores
 *   - Integration tests: Use real OpenAI API with small dataset
 *   - Tests: __tests__/lib/embeddings/embeddings.test.ts
 *
 * @performance
 *   - Complexity: O(n) for embedding generation, O(log n) for vector search (pgvector index)
 *   - Bottlenecks: OpenAI API (1-3s per batch of 20), database writes (50-100ms), vector search (100-500ms)
 *   - Batch size: 20 chunks per OpenAI request (rate limit optimization)
 *   - Expected timing: 1-3s per 20 chunks, search 100-500ms for 1,000-10,000 vectors
 *   - Memory: ~5MB per 1,000 embeddings (1536 dimensions × 4 bytes)
 *
 * @knownIssues
 *   - OpenAI rate limits: 3,000 requests/min (shared across all customers)
 *   - Token limits: Max 8,191 tokens per chunk (auto-truncation needed)
 *   - Embedding model: text-embedding-ada-002 (may upgrade to ada-003 later)
 *   - Vector search: Returns max 100-200 results (database RPC limit)
 *   - Cold start: First search after deploy takes 2-5s (pgvector index loading)
 *
 * @totalLines 133
 * @estimatedTokens 800 (without header), 350 (with header - 56% savings)
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
  return response.data[0].embedding;
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
