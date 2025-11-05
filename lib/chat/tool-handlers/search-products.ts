/**
 * Search for products using commerce provider or semantic search fallback
 * Includes exact-match SKU search optimization for improved accuracy
 */

import { SearchResult } from '@/types';
import { formatProviderProducts } from '../product-formatters';
import { normalizeDomain } from './domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import type { ToolDependencies, ToolResult } from './types';

export async function executeSearchProducts(
  query: string,
  limit: number = 100,
  domain: string,
  deps: ToolDependencies
): Promise<ToolResult> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = deps;

  // Adaptive limit: reduce for targeted queries to improve speed
  const queryWords = query.trim().split(/\s+/).length;
  const adaptiveLimit = queryWords > 3 ? Math.min(50, limit) : limit;
  console.log(`[Function Call] search_products: "${query}" (limit: ${adaptiveLimit}, original: ${limit}, words: ${queryWords})`);

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // NEW: If query looks like a SKU, try exact match first
    if (isSkuPattern(query)) {
      console.log(`[Function Call] Detected SKU pattern "${query}", trying exact match first`);

      const exactResults = await exactMatchSearch(query, browseDomain, 10);

      if (exactResults.length > 0) {
        console.log(`[Function Call] Exact match found ${exactResults.length} results for SKU "${query}"`);
        return {
          success: true,
          results: exactResults,
          source: 'exact-match'
        };
      }

      console.log(`[Function Call] No exact match found for SKU "${query}", falling back to provider/semantic search`);
    }

    const provider = await getProviderFn(browseDomain);

    // Track error context for surfacing to AI
    let errorContext: { providerFailed: boolean; providerPlatform?: string; errorMessage?: string } | undefined;

    if (provider) {
      console.log(`[Function Call] Resolved commerce provider "${provider.platform}" for ${browseDomain}`);
      console.log(`[Function Call] Provider search started { provider: "${provider.platform}", domain: "${browseDomain}", query: "${query}" }`);

      const providerSearchStart = Date.now();

      try {
        const providerResults = await provider.searchProducts(query, adaptiveLimit);
        const providerSearchDuration = Date.now() - providerSearchStart;

        console.log(`[Function Call] Provider search completed { provider: "${provider.platform}", duration: ${providerSearchDuration}ms, resultsCount: ${providerResults?.length || 0} }`);

        if (providerResults && providerResults.length > 0) {
          const results = formatProviderProducts(provider.platform, providerResults, browseDomain);

          if (results.length > 0) {
            console.log(`[Function Call] Provider search successful { provider: "${provider.platform}", formattedResults: ${results.length}, source: "${provider.platform}" }`);
            return { success: true, results, source: provider.platform };
          } else {
            console.warn(`[Function Call] Provider returned results but formatting yielded 0 products { provider: "${provider.platform}", rawResults: ${providerResults.length} }`);
          }
        } else {
          console.warn(`[Function Call] Provider search returned no results { provider: "${provider.platform}", duration: ${providerSearchDuration}ms }`);
        }
      } catch (providerError) {
        const providerSearchDuration = Date.now() - providerSearchStart;
        const errorMessage = providerError instanceof Error ? providerError.message : String(providerError);

        console.error(`[Function Call] Provider search failed { provider: "${provider.platform}", error: "${errorMessage}", duration: ${providerSearchDuration}ms }`);
        console.error(`[Function Call] Provider error details:`, providerError);

        // Create error context to surface to AI
        errorContext = {
          providerFailed: true,
          providerPlatform: provider.platform,
          errorMessage: errorMessage
        };

        console.log(`[Function Call] Error context created for semantic fallback:`, errorContext);
      }
    } else {
      console.log(`[Function Call] No commerce provider available for domain "${browseDomain}"`);
    }

    // Fallback to semantic search
    console.log(`[Function Call] Falling back to semantic search { query: "${query}", errorContext: ${errorContext ? JSON.stringify(errorContext) : 'none'} }`);

    const semanticSearchStart = Date.now();
    const searchResults = await searchFn(query, browseDomain, adaptiveLimit, 0.2);
    const semanticSearchDuration = Date.now() - semanticSearchStart;

    console.log(`[Function Call] Semantic search returned ${searchResults.length} results { source: "semantic", duration: ${semanticSearchDuration}ms, fallbackUsed: ${!!errorContext} }`);

    return {
      success: true,
      results: searchResults,
      source: 'semantic',
      errorMessage: errorContext ? `Provider ${errorContext.providerPlatform} failed: ${errorContext.errorMessage}. Showing semantic search results instead.` : undefined
    };

  } catch (error) {
    console.error('[Function Call] search_products error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}
