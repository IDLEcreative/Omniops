/**
 * Enhanced Embeddings Service with Increased Context Window
 * Main orchestrator module that coordinates search strategies and chunk processing
 *
 * This module has been refactored into focused components:
 * - enhanced-embeddings-types.ts: Type definitions and constants
 * - enhanced-embeddings-core.ts: Core search and embedding logic
 * - enhanced-embeddings-strategies.ts: Chunk processing and prioritization
 * - enhanced-embeddings-utils.ts: Utility functions and stats
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import {
  DEFAULT_CHUNKS,
  MIN_CHUNKS,
  MAX_CHUNKS,
  DEFAULT_SIMILARITY_THRESHOLD,
  type ChunkResult,
  type EnhancedSearchOptions,
  type SearchResult,
  type ContextStats,
  type EnhancedSearchResult
} from './enhanced-embeddings-types';
import { searchWithEnhancedContext } from './enhanced-embeddings-core';
import {
  searchKeywordsInContent,
  searchTitleAndUrl,
  getContextStats,
  enhanceProductPages
} from './enhanced-embeddings-utils';

// Re-export types for backwards compatibility
export type {
  ChunkResult,
  EnhancedSearchOptions,
  SearchResult,
  ContextStats,
  EnhancedSearchResult
};

// Re-export constants
export {
  DEFAULT_CHUNKS,
  MIN_CHUNKS,
  MAX_CHUNKS,
  DEFAULT_SIMILARITY_THRESHOLD
};

// Re-export core functions
export { searchWithEnhancedContext, getContextStats };

/**
 * Enhanced search wrapper that can be dropped in to replace searchSimilarContent
 */
export async function searchSimilarContentEnhanced(
  query: string,
  domain: string,
  limit: number = DEFAULT_CHUNKS, // Now defaults to 20 instead of 10
  similarityThreshold: number = 0.15 // Lowered from 0.45 to 0.15 for maximum recall
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
}>> {
  console.log(`[Enhanced Search] Starting search for: "${query}" on domain: ${domain}`);
  
  const result = await searchWithEnhancedContext(query, domain, {
    minChunks: Math.max(MIN_CHUNKS, limit),
    maxChunks: MAX_CHUNKS,
    similarityThreshold,
    prioritizeFirst: true,
    includeMetadata: true,
    groupByPage: true
  });
  
  // Convert to the expected format
  let mapped = result.chunks.map((chunk: ChunkResult) => ({
    content: chunk.content || '',
    url: chunk.url || '',
    title: chunk.title || '',
    similarity: chunk.similarity || 0
  }));
  
  // PARALLEL SEARCH: Also run keyword and metadata searches for better coverage
  console.log(`[Enhanced Search] Running parallel keyword/metadata search for query: "${query}"`);
  
  // Get domain_id for filtering
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain?.replace('www.', '') || '')
    .single();
  
  if (domainData?.id) {
    // Run parallel searches
    const [keywordResults, metadataResults] = await Promise.all([
      // Keyword search in content
      searchKeywordsInContent(domainData.id, query, limit, supabase),
      // Search in title and URL patterns
      searchTitleAndUrl(domainData.id, query, limit, supabase)
    ]);
    
    console.log(`[Enhanced Search] Parallel results - Keywords: ${keywordResults.length}, Title/URL: ${metadataResults.length}`);

    // Merge results, deduplicating by URL
    const allResults = new Map<string, any>();
    
    // Add semantic results first
    console.log(`[Enhanced Search] Adding ${mapped.length} semantic results to merge...`);
    mapped.forEach((r: SearchResult) => {
      allResults.set(r.url, { ...r, source: 'semantic' });
    });

    // Add keyword matches
    console.log(`[Enhanced Search] Adding ${keywordResults.length} keyword results to merge...`);
    keywordResults.forEach((r: SearchResult) => {
      if (!allResults.has(r.url)) {
        allResults.set(r.url, { ...r, source: 'keyword' });
      } else {
        // Boost existing result if found via multiple methods
        const existing = allResults.get(r.url);
        if (existing) {
          existing.similarity = Math.max(existing.similarity, r.similarity);
          existing.source = existing.source + '+keyword';
        }
      }
    });

    // Add title/URL matches with boost
    console.log(`[Enhanced Search] Adding ${metadataResults.length} title/URL results to merge...`);
    metadataResults.forEach((r: SearchResult) => {
      if (!allResults.has(r.url)) {
        allResults.set(r.url, { ...r, source: 'title/url' });
      } else {
        // Boost existing result
        const existing = allResults.get(r.url);
        if (existing) {
          existing.similarity = Math.max(existing.similarity, r.similarity);
          existing.source = existing.source + '+title';
        }
      }
    });
    
    console.log(`[Enhanced Search] Total unique results before sorting: ${allResults.size}`);
    
    // Convert back to array and sort
    mapped = Array.from(allResults.values())
      .sort((a, b) => {
        // Prioritize multi-source matches
        const aMulti = a.source.includes('+');
        const bMulti = b.source.includes('+');
        if (aMulti && !bMulti) return -1;
        if (bMulti && !aMulti) return 1;
        return (b.similarity || 0) - (a.similarity || 0);
      });
    
    console.log(`[Enhanced Search] After sorting, have ${mapped.length} results (will slice to ${limit})`);

    mapped = mapped.slice(0, limit);
    
    console.log(`[Enhanced Search] Final merged results: ${mapped.length} items`);

    // Log top results for debugging
    if (mapped.length > 0) {
      console.log('[Enhanced Search] Top results:');
      mapped.slice(0, 5).forEach((r: SearchResult, i: number) => {
        const source = (r as any).source || 'semantic';
        console.log(`  ${i + 1}. [${source}] ${r.title} (${(r.similarity * 100).toFixed(0)}%)`);
      });
    }
  }

  // ENHANCEMENT: For product pages, retrieve ALL chunks and combine them intelligently
  const enhancedResults = await enhanceProductPages(mapped, supabase);

  return enhancedResults;
}