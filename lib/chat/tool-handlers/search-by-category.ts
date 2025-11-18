/**
 * Search by category using semantic search
 */

import { SearchResult } from '@/types';
import { normalizeDomain } from './domain-utils';
import type { ToolDependencies, ToolResult } from './types';

export async function executeSearchByCategory(
  category: string,
  limit: number = 100,
  domain: string,
  deps: Pick<ToolDependencies, 'searchSimilarContent'>
): Promise<ToolResult> {
  const { searchSimilarContent: searchFn } = deps;
  console.log(`[Function Call] search_by_category: "${category}" (limit: ${limit})`);

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use semantic search for category-based queries
    const searchResults = await searchFn(category, browseDomain, limit, 0.15);

    return {
      success: true,
      results: searchResults,
      source: 'semantic'
    };

  } catch (error) {
    console.error('[Function Call] search_by_category error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}
