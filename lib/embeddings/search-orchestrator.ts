/**
 * Main search orchestrator - coordinates keyword, vector, and fallback searches
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { getSearchCacheManager } from '@/lib/search-cache';
import { domainCache } from '@/lib/domain-cache';
import { QueryTimer } from './timer';
import { performKeywordSearch } from './keyword-search';
import { performVectorSearch } from './vector-search';
import { performFallbackSearch } from './fallback-search';
import { DEFAULT_SEARCH_LIMIT, DEFAULT_SIMILARITY_THRESHOLD, DEFAULT_TIMEOUT_MS, TIMEOUTS } from './constants';
import type { SearchResult } from './types';

export async function searchSimilarContentOptimized(
  query: string,
  domain: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
  similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SearchResult[]> {
  const overallTimer = new QueryTimer('Total Search', timeoutMs);

  // Check cache first
  const cacheManager = getSearchCacheManager();
  const cachedResult = await cacheManager.getCachedResult(query, domain, limit);

  if (cachedResult && cachedResult.chunks) {
    console.log('[Cache] HIT - Returning cached search results');
    await cacheManager.trackCacheAccess(true);
    return cachedResult.chunks;
  }

  console.log('[Cache] MISS - Performing optimized search');
  await cacheManager.trackCacheAccess(false);

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('Failed to create Supabase client');
    return [];
  }

  try {
    // Domain lookup with caching
    const domainTimer = new QueryTimer('Domain Lookup (Cached)', TIMEOUTS.DOMAIN_LOOKUP);
    const searchDomain = domain.replace('www.', '');

    const domainId = await domainCache.getDomainId(searchDomain);
    domainTimer.end();

    if (!domainId) {
      console.log(`No domain found for "${searchDomain}" (original: "${domain}")`);
      return [];
    }

    // Try keyword search for short queries
    const keywordResults = await performKeywordSearch(supabase, domainId, query, limit);

    if (keywordResults) {
      console.log(`[HYBRID] Returning ${keywordResults.length} keyword results`);

      await cacheManager.cacheResult(
        query,
        {
          response: '',
          chunks: keywordResults,
        },
        domain,
        limit
      );

      return keywordResults;
    }

    // Vector search
    const vectorResults = await performVectorSearch(
      supabase,
      domainId,
      query,
      limit,
      similarityThreshold,
      domain
    );

    console.log(`[OPTIMIZATION] Returning ${vectorResults.length} results without chunk enhancement`);

    // Cache successful results
    await cacheManager.cacheResult(
      query,
      {
        response: '',
        chunks: vectorResults,
        metadata: {
          searchMethod: 'vector',
          chunksRetrieved: vectorResults.length,
        },
      },
      domain,
      limit
    );

    overallTimer.end();

    return vectorResults;
  } catch (error: any) {
    console.error('Search error:', error);

    // Try fallback search
    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) return [];

      const searchDomain = domain.replace('www.', '');
      const domainId = await domainCache.getDomainId(searchDomain);

      if (!domainId) return [];

      const fallbackResults = await performFallbackSearch(supabase, domainId, query, limit);

      await cacheManager.cacheResult(
        query,
        {
          response: '',
          chunks: fallbackResults,
        },
        domain,
        limit
      );

      return fallbackResults;
    } catch (fallbackError) {
      console.error('Fallback search failed:', fallbackError);

      // Check for partial results in cache
      if (error.message?.includes('timeout')) {
        console.error('[TIMEOUT] Search operation timed out');
        const partialCache = await cacheManager.getCachedResult(query, domain, limit);
        if (partialCache?.chunks) {
          return partialCache.chunks;
        }
      }

      return [];
    }
  }
}
