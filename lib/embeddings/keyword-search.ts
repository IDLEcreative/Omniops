/**
 * Keyword-based search operations
 * Updated: 2025-11-02 - Uses search_pages_by_keyword RPC to support domain mappings
 */

import type { SupabaseClient } from '@/types/supabase';
import { COMMON_WORDS, MIN_KEYWORD_RESULTS } from './constants';
import { QueryTimer } from './timer';
import type { SearchResult } from './types';

export async function performKeywordSearch(
  supabase: SupabaseClient,
  domainId: string,
  query: string,
  limit: number
): Promise<SearchResult[] | null> {
  const queryWords = query.trim().split(/\s+/);
  const isShortQuery = queryWords.length <= 2;

  if (!isShortQuery) {
    return null; // Not applicable for long queries
  }

  // Identify the most important keyword
  const significantWords = queryWords.filter((w) => !COMMON_WORDS.includes(w.toLowerCase()));
  const searchKeyword = significantWords[0] || queryWords[0];

  console.log(
    `[HYBRID] Short query (${queryWords.length} words): "${query}" - trying keyword search first`
  );

  const keywordTimer = new QueryTimer('Keyword Search', 3000);

  try {
    // Use the search_pages_by_keyword function that handles domain mappings
    const { data: keywordResults, error } = await supabase
      .rpc('search_pages_by_keyword', {
        p_domain_id: domainId,
        p_keyword: searchKeyword,
        p_limit: Math.max(limit * 2, 200)
      });

    if (error) {
      return null;
    }

    keywordTimer.end();

    // Check if we have enough good results
    if (keywordResults && keywordResults.length >= MIN_KEYWORD_RESULTS) {
      // Sort results
      keywordResults.sort((a: any, b: any) => {
        const aIsProduct = a.url?.includes('/product/');
        const bIsProduct = b.url?.includes('/product/');
        if (aIsProduct && !bIsProduct) return -1;
        if (!aIsProduct && bIsProduct) return 1;

        const aInTitle = a.title?.toLowerCase().includes(query.toLowerCase());
        const bInTitle = b.title?.toLowerCase().includes(query.toLowerCase());
        if (aInTitle && !bInTitle) return -1;
        if (!aInTitle && bInTitle) return 1;

        return 0;
      });

      return keywordResults.slice(0, Math.min(limit, keywordResults.length)).map((row: any) => ({
        content: row.content?.substring(0, 500) || '',
        url: row.url || '',
        title: row.title || 'Untitled',
        similarity: row.url?.includes('/product/') ? 0.95 : 0.85,
        searchMethod: 'keyword' as const,
      }));
    }

    return null;
  } catch (error) {
    return null;
  }
}
