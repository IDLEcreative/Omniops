/**
 * Core search functionality for Enhanced Embeddings
 * Handles embedding search and context retrieval
 */

import { createClient } from '@supabase/supabase-js';
import type { EnhancedSearchOptions, EnhancedSearchResult } from './enhanced-embeddings-types';
import { MIN_CHUNKS, MAX_CHUNKS } from './enhanced-embeddings-types';
import { processChunks } from './enhanced-embeddings-strategies';

/**
 * Generate embedding for a query (placeholder - uses actual implementation)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  // Import the actual embedding generation
  const { generateQueryEmbedding: actualGenerate } = await import('./embeddings');
  return actualGenerate(query);
}

/**
 * Enhanced search that retrieves more context and prioritizes chunks intelligently
 */
export async function searchWithEnhancedContext(
  query: string,
  domain: string,
  options: EnhancedSearchOptions = {}
): Promise<EnhancedSearchResult> {
  const {
    minChunks = MIN_CHUNKS,
    maxChunks = MAX_CHUNKS,
    similarityThreshold = 0.15, // Lowered from 0.45 to 0.15 for maximum recall
    prioritizeFirst = true,
    includeMetadata = true,
    groupByPage = true
  } = options;

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // First, generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Get domain_id for filtering from domains table
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domain?.replace('www.', '') || '')
      .single();

    if (!domainData) {
      console.warn(`[Enhanced Embeddings] No domain found for ${domain}`);
      return {
        chunks: [],
        groupedContext: new Map(),
        totalRetrieved: 0,
        averageSimilarity: 0
      };
    }

    // Try the extended RPC function first, fall back to standard if it doesn't exist
    let embeddings = null;
    let rpcError = null;

    // First try the extended function
    const { data: extendedData, error: extendedError } = await supabase.rpc(
      'match_page_embeddings_extended',
      {
        query_embedding: queryEmbedding,
        p_domain_id: domainData.id,
        match_threshold: similarityThreshold,
        match_count: maxChunks // Get maximum chunks
      }
    );

    if (!extendedError) {
      embeddings = extendedData;
    } else if (extendedError.message?.includes('function') || extendedError.message?.includes('does not exist')) {
      // Function doesn't exist, try the standard search_embeddings function
      console.log('[Enhanced Embeddings] Extended function not found, falling back to search_embeddings');

      const { data: standardData, error: standardError } = await supabase.rpc(
        'search_embeddings',
        {
          query_embedding: queryEmbedding,
          p_domain_id: domainData.id,
          match_threshold: similarityThreshold,
          match_count: maxChunks
        }
      );

      if (!standardError) {
        embeddings = standardData;
      } else {
        rpcError = standardError;
      }
    } else {
      rpcError = extendedError;
    }

    if (rpcError) {
      console.error('[Enhanced Embeddings] Search error:', rpcError);
      return {
        chunks: [],
        groupedContext: new Map(),
        totalRetrieved: 0,
        averageSimilarity: 0
      };
    }

    if (!embeddings || embeddings.length === 0) {
      console.log('[Enhanced Embeddings] No matching embeddings found');
      return {
        chunks: [],
        groupedContext: new Map(),
        totalRetrieved: 0,
        averageSimilarity: 0
      };
    }

    return processChunks(embeddings, minChunks, prioritizeFirst, groupByPage);

  } catch (error) {
    console.error('[Enhanced Embeddings] Error in search:', error);
    return {
      chunks: [],
      groupedContext: new Map(),
      totalRetrieved: 0,
      averageSimilarity: 0
    };
  }
}
