/**
 * Vector-based semantic search operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateQueryEmbedding } from './query-embedding';
import { QueryTimer } from './timer';
import { TIMEOUTS } from './constants';
import type { SearchResult } from './types';

export async function performVectorSearch(
  supabase: SupabaseClient,
  domainId: string,
  query: string,
  limit: number,
  similarityThreshold: number,
  domain?: string
): Promise<SearchResult[]> {
  console.log(`[HYBRID] Using vector search for: "${query}"`);

  // Generate embedding with timeout
  const embeddingTimer = new QueryTimer('Generate Embedding', TIMEOUTS.EMBEDDING_GENERATION);
  const queryEmbedding = await Promise.race([
    generateQueryEmbedding(query, false, domain),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Embedding generation timeout')), TIMEOUTS.EMBEDDING_GENERATION)
    ),
  ]);
  embeddingTimer.end();

  // Execute vector search with timeout
  const vectorTimer = new QueryTimer('Vector Search', TIMEOUTS.VECTOR_SEARCH);

  const { data, error } = await supabase
    .rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: similarityThreshold,
      match_count: limit,
    })
    .abortSignal(AbortSignal.timeout(TIMEOUTS.VECTOR_SEARCH));

  vectorTimer.end();

  if (error) {
    console.error('Vector search error:', error);
    throw error;
  }

  // Process vector search results
  return (data || []).map((result: any) => ({
    content: result.content?.substring(0, 500) || result.chunk_text?.substring(0, 500) || '',
    url: result.url || result.metadata?.url || '',
    title: result.title || result.metadata?.title || 'Untitled',
    similarity: result.similarity || 0,
  }));
}
