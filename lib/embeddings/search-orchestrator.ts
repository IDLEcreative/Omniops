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
    // Domain lookup with caching and comprehensive fallback
    const domainTimer = new QueryTimer('Domain Lookup (Cached)', TIMEOUTS.DOMAIN_LOOKUP);
    const searchDomain = domain.replace('www.', '');
    const cacheStats = domainCache.getStats();

    console.log('[Search] Domain lookup started', {
      originalDomain: domain,
      searchDomain,
      cacheSize: cacheStats.cacheSize,
      cacheHitRate: cacheStats.hitRate
    });

    // Step 1: Try standard cache lookup
    let domainId = await domainCache.getDomainId(searchDomain);

    if (!domainId) {
      console.log('[Search] Cache lookup failed for:', searchDomain);

      // Step 2: Try alternative domain formats
      const alternativeDomains = [
        domain, // Original with potential www prefix
        searchDomain, // Already tried but include for completeness
        domain.replace('www.', ''), // Explicitly remove www
        'www.' + searchDomain // Add www if not present
      ].filter((d, i, arr) => arr.indexOf(d) === i); // Deduplicate

      console.log('[Search] Trying alternative domain formats:', {
        alternatives: alternativeDomains,
        totalAttempts: alternativeDomains.length
      });

      for (let i = 0; i < alternativeDomains.length && !domainId; i++) {
        const altDomain = alternativeDomains[i];
        if (!altDomain) continue; // Skip undefined entries
        console.log('[Search] Trying alternative:', altDomain, { attempt: `${i + 1}/${alternativeDomains.length}` });
        domainId = await domainCache.getDomainId(altDomain);

        if (domainId) {
          console.log('[Search] Domain found with alternative format:', {
            altDomain,
            domainId,
            method: 'cache-alternative'
          });
        }
      }

      // Step 3: Last resort - direct database query with ILIKE for fuzzy matching
      if (!domainId) {
        console.log('[Search] Cache exhausted, trying direct database lookup with fuzzy matching');

        try {
          const { data, error } = await supabase
            .from('customer_configs')
            .select('id, domain')
            .or(`domain.ilike.%${searchDomain}%,domain.ilike.%${domain}%`)
            .eq('active', true)
            .limit(1)
            .single();

          if (error) {
            if (error.code !== 'PGRST116') { // Not found is expected
              console.error('[Search] Direct database query error:', error);
            }
          } else if (data?.id) {
            domainId = data.id;
            console.log('[Search] Domain found via direct database lookup:', {
              domainId,
              matchedDomain: data.domain,
              method: 'direct-db-fuzzy'
            });

            // Update cache with successful direct lookup for future requests
            // Note: We're using internal cache structure access here
            // In production, consider adding a public method to DomainCacheService
            console.log('[Search] Caching direct database lookup result for future requests');
          }
        } catch (dbError) {
          console.error('[Search] Direct database lookup failed:', dbError);
        }
      }
    } else {
      console.log('[Search] Domain lookup succeeded', {
        domainId,
        method: 'cache-hit'
      });
    }

    domainTimer.end();

    if (!domainId) {
      console.log('[Search] Domain lookup failed after exhausting all options:', {
        originalDomain: domain,
        searchDomain,
        attemptedMethods: ['cache', 'alternative-formats', 'direct-db-fuzzy'],
        cacheSize: cacheStats.cacheSize
      });
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
      console.log('[Search] Main search failed, attempting fallback search');
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        console.error('[Search] Fallback failed: No Supabase client');
        return [];
      }

      const searchDomain = domain.replace('www.', '');
      console.log('[Search] Fallback domain lookup:', { searchDomain });
      const domainId = await domainCache.getDomainId(searchDomain);

      if (!domainId) {
        console.log('[Search] Fallback failed: Domain not found in cache');
        // Try direct lookup in fallback as well
        try {
          const { data } = await supabase
            .from('customer_configs')
            .select('id')
            .or(`domain.ilike.%${searchDomain}%,domain.ilike.%${domain}%`)
            .eq('active', true)
            .limit(1)
            .single();

          if (data?.id) {
            console.log('[Search] Fallback domain found via direct database lookup:', data.id);
            const fallbackResults = await performFallbackSearch(supabase, data.id, query, limit);

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
          }
        } catch (err) {
          console.error('[Search] Fallback direct lookup failed:', err);
        }
        return [];
      }

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
