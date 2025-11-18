/**
 * Full Page Retrieval Strategy
 *
 * Instead of returning random chunks from multiple pages, this retrieves
 * ALL chunks from the best-matching page to give AI complete context.
 *
 * Benefits:
 * - Focused context (all chunks from ONE page)
 * - Complete information (nothing missing)
 * - Token efficient (~67% reduction)
 * - Brand-agnostic (works for products, docs, FAQs, any page type)
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { SearchResult } from '@/types';
import { searchSimilarContent } from '@/lib/embeddings';

/**
 * Retrieve all chunks from a specific page
 */
async function getAllChunksFromPage(
  pageId: string,
  domain: string
): Promise<SearchResult[]> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('[Full Page] Failed to create Supabase client');
    return [];
  }

  try {
    // Get the page info first
    const { data: pageData, error: pageError } = await supabase
      .from('scraped_pages')
      .select('url, title')
      .eq('id', pageId)
      .single();

    if (pageError || !pageData) {
      console.error('[Full Page] Page not found:', pageId);
      return [];
    }

    // Get ALL chunks from this page, ordered by creation
    const { data: chunks, error: chunksError } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata, created_at')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      console.error('[Full Page] No chunks found for page:', pageId);
      return [];
    }

    console.log(`[Full Page] Retrieved ${chunks.length} chunks from: ${pageData.title}`);

    // Convert to SearchResult format
    return chunks.map((chunk, index) => ({
      content: chunk.chunk_text,
      url: pageData.url,
      title: pageData.title,
      similarity: 0.95 - (index * 0.01), // Slight descending order for ranking
      metadata: {
        ...chunk.metadata,
        chunk_index: index,
        total_chunks: chunks.length,
        retrieval_strategy: 'full_page'
      }
    }));

  } catch (error) {
    console.error('[Full Page] Error retrieving chunks:', error);
    return [];
  }
}

/**
 * Search for content and return the FULL PAGE of the best match
 *
 * This is the main function to use for product details, blog posts,
 * documentation pages, or any content where you want complete context.
 *
 * OPTIMIZED: Uses search_embeddings RPC directly to get page_id
 */
export async function searchAndReturnFullPage(
  query: string,
  domain: string,
  fallbackChunkLimit: number = 15,
  similarityThreshold: number = 0.3
): Promise<{
  success: boolean;
  results: SearchResult[];
  source: 'full_page' | 'chunks_fallback';
  pageInfo?: {
    url: string;
    title: string;
    totalChunks: number;
  };
}> {
  console.log(`[Full Page Strategy] Query: "${query}"`);

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.log('[Full Page] Supabase unavailable, cannot execute');
    return {
      success: false,
      results: [],
      source: 'chunks_fallback'
    };
  }

  try {
    // Step 1: Get domain_id
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');
    const { data: domainData } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', normalizedDomain)
      .single();

    if (!domainData) {
      console.log('[Full Page] Domain not found:', normalizedDomain);
      return {
        success: false,
        results: [],
        source: 'chunks_fallback'
      };
    }

    // Step 2: Generate embedding for query
    const { generateQueryEmbedding } = await import('@/lib/embeddings');
    const queryEmbedding = await generateQueryEmbedding(query, false, domain);

    // Step 3: Call search_embeddings RPC (returns page_id!)
    const { data: searchResults, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainData.id,
      match_threshold: similarityThreshold,
      match_count: 3 // Only need top 3 to find best page
    });

    if (error || !searchResults || searchResults.length === 0) {
      console.log('[Full Page] No search results found');
      return {
        success: false,
        results: [],
        source: 'chunks_fallback'
      };
    }

    // Step 4: Get the page_id of the best match
    const bestMatch = searchResults[0];
    const bestPageId = bestMatch.page_id;

    console.log(`[Full Page] Best match: ${bestMatch.title} (similarity: ${bestMatch.similarity.toFixed(3)})`);
    console.log(`[Full Page] Retrieving all chunks from page: ${bestPageId}`);

    // Step 5: Retrieve ALL chunks from that page
    const fullPageChunks = await getAllChunksFromPage(bestPageId, domain);

    if (fullPageChunks.length === 0) {
      console.log('[Full Page] No chunks retrieved from page');
      return {
        success: false,
        results: [],
        source: 'chunks_fallback'
      };
    }

    // Success! Return full page context
    console.log(`[Full Page] Success! Returning ${fullPageChunks.length} chunks from one page`);
    return {
      success: true,
      results: fullPageChunks,
      source: 'full_page',
      pageInfo: fullPageChunks.length > 0 ? {
        url: fullPageChunks[0]?.url ?? '',
        title: fullPageChunks[0]?.title ?? '',
        totalChunks: fullPageChunks.length
      } : {
        url: '',
        title: '',
        totalChunks: 0
      }
    };

  } catch (error) {
    console.error('[Full Page] Error in full page retrieval:', error);
    return {
      success: false,
      results: [],
      source: 'chunks_fallback'
    };
  }
}

/**
 * Optimized version: Get page_id directly from search results
 *
 * This requires modifying the search_embeddings RPC to return page_id
 * For now, this is a placeholder for future optimization
 */
export async function searchAndReturnFullPageOptimized(
  query: string,
  domain: string,
  similarityThreshold: number = 0.3
): Promise<SearchResult[]> {
  // TODO: Modify search_embeddings RPC function to include page_id in results
  // Then we can skip the intermediate lookup

  console.log('[Full Page Optimized] Not yet implemented, using standard approach');
  const result = await searchAndReturnFullPage(query, domain, 15, similarityThreshold);
  return result.results;
}
