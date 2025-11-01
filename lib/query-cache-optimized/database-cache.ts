/**
 * Query Cache - Database Cache Operations
 */

import type { SupabaseClient } from '@/types/supabase';

/**
 * Get value from database cache
 */
export async function getFromDb<T>(
  supabase: SupabaseClient,
  domainId: string,
  queryHash: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from('query_cache')
    .select('results, hit_count')
    .eq('domain_id', domainId)
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  // Increment hit count asynchronously
  supabase
    .from('query_cache')
    .update({ hit_count: data.hit_count + 1 })
    .eq('domain_id', domainId)
    .eq('query_hash', queryHash)
    .then(() => {});

  return data.results as T;
}

/**
 * Set value in database cache
 */
export async function setInDb<T>(
  supabase: SupabaseClient,
  domainId: string,
  queryHash: string,
  queryText: string | null,
  data: T,
  ttlSeconds?: number
): Promise<void> {
  const ttl = ttlSeconds || 3600;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await supabase
    .from('query_cache')
    .upsert(
      {
        domain_id: domainId,
        query_hash: queryHash,
        query_text: queryText,
        results: data,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: 'domain_id,query_hash',
      }
    );
}
