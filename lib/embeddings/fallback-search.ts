/**
 * Fallback search when vector search fails
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { QueryTimer } from './timer';
import { TIMEOUTS } from './constants';
import type { SearchResult } from './types';

export async function performFallbackSearch(
  supabase: SupabaseClient,
  domainId: string,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  console.log('[OPTIMIZATION] Falling back to keyword search');

  const fallbackTimer = new QueryTimer('Fallback Search', TIMEOUTS.FALLBACK_SEARCH);

  // Get the most significant keyword from the query
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);

  // Use the first significant keyword for the search
  const searchKeyword = keywords[0] || query.split(/\s+/)[0];

  // Use the search_pages_by_keyword function that handles domain mappings
  const { data: fallbackResults, error } = await supabase
    .rpc('search_pages_by_keyword', {
      p_domain_id: domainId,
      p_keyword: searchKeyword,
      p_limit: limit
    });

  fallbackTimer.end();

  if (error) {
    console.error('[Fallback Search] Error:', error);
    return [];
  }

  return (fallbackResults || []).map((row: any) => ({
    content: row.content?.substring(0, 500) || '',
    url: row.url || '',
    title: row.title || 'Untitled',
    similarity: 0.5,
  }));
}
