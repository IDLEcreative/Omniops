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

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const orConditions = keywords.map((k) => `content.ilike.%${k}%`).join(',');

  const { data: fallbackResults } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .or(orConditions)
    .limit(limit)
    .abortSignal(AbortSignal.timeout(TIMEOUTS.FALLBACK_SEARCH));

  fallbackTimer.end();

  return (fallbackResults || []).map((row: any) => ({
    content: row.content?.substring(0, 500) || '',
    url: row.url || '',
    title: row.title || 'Untitled',
    similarity: 0.5,
  }));
}
