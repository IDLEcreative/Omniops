/**
 * Search for products using commerce provider or semantic search fallback
 */

import { SearchResult } from '@/types';
import { formatProviderProducts } from '../product-formatters';
import { normalizeDomain } from './domain-utils';
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

    const provider = await getProviderFn(browseDomain);

    if (provider) {
      console.log(`[Function Call] Resolved commerce provider "${provider.platform}" for ${browseDomain}`);

      try {
        const providerResults = await provider.searchProducts(query, adaptiveLimit);

        if (providerResults && providerResults.length > 0) {
          const results = formatProviderProducts(provider.platform, providerResults, browseDomain);

          if (results.length > 0) {
            return { success: true, results, source: provider.platform };
          }
        }
      } catch (providerError) {
        console.error(`[Function Call] ${provider.platform} search error:`, providerError);
      }
    }

    // Fallback to semantic search
    const searchResults = await searchFn(query, browseDomain, adaptiveLimit, 0.2);
    console.log(`[Function Call] Semantic search returned ${searchResults.length} results`);

    return {
      success: true,
      results: searchResults,
      source: 'semantic'
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
