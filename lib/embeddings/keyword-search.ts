/**
 * Keyword-based search operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
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
  const keywordResults: any[] = [];

  try {
    // Search in titles
    const { data: titleResults } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .ilike('title', `%${searchKeyword}%`)
      .limit(Math.max(limit * 2, 200));

    if (titleResults) keywordResults.push(...titleResults);

    // Search in URLs
    const { data: urlResults } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .ilike('url', `%${searchKeyword!.toLowerCase()}%`)
      .limit(Math.max(limit * 2, 200));

    if (urlResults) {
      const existingUrls = new Set(keywordResults.map((r) => r.url));
      const newResults = urlResults.filter((r) => !existingUrls.has(r.url));
      keywordResults.push(...newResults);
    }

    keywordTimer.end();
    console.log(`[HYBRID] Keyword search found ${keywordResults.length} results`);

    // Check if we have enough good results
    if (keywordResults.length >= MIN_KEYWORD_RESULTS) {
      // Sort results
      keywordResults.sort((a, b) => {
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

    console.log(`[HYBRID] Only ${keywordResults.length} keyword results, falling back to vector search`);
    return null;
  } catch (error) {
    console.log(`[HYBRID] Keyword search error, falling back to vector: ${error}`);
    return null;
  }
}
