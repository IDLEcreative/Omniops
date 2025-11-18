/**
 * Search for products using commerce provider or semantic search fallback
 * Includes exact-match SKU search optimization and zero-results recovery
 */

import { SearchResult } from '@/types';
import { formatProviderProducts } from '../product-formatters';
import { normalizeDomain } from './domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { handleZeroResults } from '@/lib/embeddings';
import type { ToolDependencies, ToolResult } from './types';

export async function executeSearchProducts(
  query: string,
  limit: number = 100,
  domain: string,
  deps: ToolDependencies
): Promise<ToolResult> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = deps;

  // Adaptive limit: slightly reduce for very targeted queries
  // Note: Increased from 50 to 100 to ensure we don't miss results
  const queryWords = query.trim().split(/\s+/).length;
  const adaptiveLimit = queryWords > 5 ? Math.min(100, limit) : limit;
  console.log(`[Function Call] search_products: "${query}" (limit: ${adaptiveLimit}, original: ${limit}, words: ${queryWords})`);

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // NEW: If query looks like a SKU, try exact match first
    if (isSkuPattern(query)) {

      const exactResults = await exactMatchSearch(query, browseDomain, 10);

      if (exactResults.length > 0) {
        return {
          success: true,
          results: exactResults,
          source: 'exact-match'
        };
      }

    }

    const provider = await getProviderFn(browseDomain);

    // Track error context for surfacing to AI
    let errorContext: { providerFailed: boolean; providerPlatform?: string; errorMessage?: string } | undefined;

    if (provider) {

      const providerSearchStart = Date.now();

      try {
        const providerResults = await provider.searchProducts(query, adaptiveLimit);
        const providerSearchDuration = Date.now() - providerSearchStart;


        if (providerResults && providerResults.length > 0) {
          const results = formatProviderProducts(provider.platform, providerResults, browseDomain);

          if (results.length > 0) {
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

      }
    } else {
    }

    // Fallback to semantic search
    console.log(`[Function Call] Falling back to semantic search { query: "${query}", errorContext: ${errorContext ? JSON.stringify(errorContext) : 'none'} }`);

    const semanticSearchStart = Date.now();
    const searchResults = await searchFn(query, browseDomain, adaptiveLimit, 0.2);
    const semanticSearchDuration = Date.now() - semanticSearchStart;


    // ZERO-RESULTS RECOVERY: If semantic search returns nothing, try recovery strategies
    if (searchResults.length === 0) {

      const recoveryStart = Date.now();
      const { results: recoveryResults, strategy, suggestion } = await handleZeroResults(
        query,
        browseDomain,
        adaptiveLimit
      );
      const recoveryDuration = Date.now() - recoveryStart;

      if (recoveryResults.length > 0) {

        return {
          success: true,
          results: recoveryResults,
          source: `recovery_${strategy}`,
          errorMessage: suggestion
        };
      } else {

        return {
          success: false,
          results: [],
          source: 'recovery_exhausted',
          errorMessage: suggestion || 'No results found. Try different search terms or contact support for assistance.'
        };
      }
    }

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
