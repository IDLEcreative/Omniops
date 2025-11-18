/**
 * Search Strategies for Chat Context Enhancement
 * Handles hybrid, embedding, and smart search execution
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import { searchSimilarContentEnhanced } from './enhanced-embeddings';
import { smartSearch } from './search-wrapper';
import { ContextChunk, BusinessClassification } from './chat-context-enhancer-types';

/**
 * Execute hybrid search combining fulltext, fuzzy, metadata, and vector search
 */
export async function executeHybridSearch(
  searchQuery: string,
  expandedQuery: string,
  hasExpansion: boolean,
  domainId: string,
  maxChunks: number
): Promise<ContextChunk[]> {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for hybrid search');
    return [];
  }


  const { data: hybridResults, error: hybridError } = await supabase.rpc(
    'hybrid_product_search',
    {
      p_query: hasExpansion ? expandedQuery : searchQuery,
      p_domain_id: domainId,
      p_limit: maxChunks,
      p_enable_fuzzy: true,
      p_vector_embedding: null
    }
  );

  if (!hybridError && hybridResults && hybridResults.length > 0) {

    return hybridResults.map((r: any) => ({
      content: r.content || '',
      url: r.url || '',
      title: r.title || '',
      similarity: r.score || 0.8,
      source: 'hybrid' as const,
      metadata: r.metadata
    }));
  }

  return [];
}

/**
 * Execute embedding search for additional context
 */
export async function executeEmbeddingSearch(
  searchQuery: string,
  domain: string,
  neededChunks: number
): Promise<ContextChunk[]> {

  const embeddingResults = await searchSimilarContentEnhanced(
    searchQuery,
    domain,
    neededChunks,
    0.15
  );

  if (embeddingResults && embeddingResults.length > 0) {
    return embeddingResults.map(r => ({
      ...r,
      source: 'embedding' as const
    }));
  }

  return [];
}

/**
 * Execute smart search for fallback context
 */
export async function executeSmartSearch(
  searchQuery: string,
  domain: string,
  neededChunks: number
): Promise<ContextChunk[]> {

  const smartResults = await smartSearch(
    searchQuery,
    domain,
    neededChunks,
    0.2,
    { boostRecent: true }
  );

  if (smartResults && smartResults.length > 0) {
    return smartResults.map(r => ({
      ...r,
      source: 'smart' as const
    }));
  }

  return [];
}

/**
 * Get business classification for domain
 */
export async function getBusinessClassification(domainId: string): Promise<BusinessClassification | null> {
  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    console.error('[Context Enhancer] Failed to create Supabase client for business classification');
    return null;
  }

  const { data: classification } = await supabase
    .from('business_classifications')
    .select('business_type, entity_terminology')
    .eq('domain_id', domainId)
    .single();

  return classification;
}
