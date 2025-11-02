/**
 * Search Strategies for Chat Context Enhancement
 * Handles hybrid, embedding, and smart search execution
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`[Context Enhancer] Trying hybrid search for maximum accuracy...`);

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
    console.log(`[Context Enhancer] Hybrid search found ${hybridResults.length} results`);

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
  console.log(`[Context Enhancer] Need more chunks, adding embedding search...`);

  const embeddingResults = await searchSimilarContentEnhanced(
    searchQuery,
    domain,
    neededChunks,
    0.15
  );

  if (embeddingResults && embeddingResults.length > 0) {
    console.log(`[Context Enhancer] Found ${embeddingResults.length} additional embedding chunks`);
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
  console.log(`[Context Enhancer] Need more chunks, trying smart search...`);

  const smartResults = await smartSearch(
    searchQuery,
    domain,
    neededChunks,
    0.2,
    { boostRecent: true }
  );

  if (smartResults && smartResults.length > 0) {
    console.log(`[Context Enhancer] Found ${smartResults.length} additional smart search chunks`);
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: classification } = await supabase
    .from('business_classifications')
    .select('business_type, entity_terminology')
    .eq('domain_id', domainId)
    .single();

  return classification;
}
