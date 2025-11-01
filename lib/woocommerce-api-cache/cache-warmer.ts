/**
 * Cache Warming Functionality
 */

import type { CommonQuery } from './types';
import { CACHE_TTL } from './constants';
import type { CacheStorage } from './cache-storage';

export async function warmCache(
  storage: CacheStorage,
  commonQueries: CommonQuery[],
  domain: string,
  fetchFn: (operation: string, params: any) => Promise<any>,
  generateCacheKey: (operation: string, params: any, domain: string) => string
): Promise<void> {
  console.log(`[WC API Cache] 🔥 Warming cache with ${commonQueries.length} common queries...`);

  const results = await Promise.allSettled(
    commonQueries.map(async ({ operation, params }) => {
      const cacheKey = generateCacheKey(operation, params, domain);
      const cached = await storage.get(cacheKey);

      if (!cached) {
        try {
          console.log(`[WC API Cache] Warming: ${operation}`);
          const data = await fetchFn(operation, params);
          const ttl = CACHE_TTL[operation as keyof typeof CACHE_TTL] || CACHE_TTL.default;
          await storage.set(cacheKey, data, ttl * 2); // Longer TTL for warmed cache
          return { operation, status: 'warmed' };
        } catch (error) {
          console.error(`[WC API Cache] Failed to warm ${operation}:`, error);
          return { operation, status: 'failed', error };
        }
      }
      return { operation, status: 'already_cached' };
    })
  );

  const warmed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'warmed').length;
  const cached = results.filter(r => r.status === 'fulfilled' && r.value.status === 'already_cached').length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;

  console.log(`[WC API Cache] ✅ Warming complete: ${warmed} warmed, ${cached} already cached, ${failed} failed`);
}
