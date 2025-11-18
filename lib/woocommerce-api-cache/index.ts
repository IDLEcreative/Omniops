/**
 * WooCommerce API Response Cache for Chat System
 * Eliminates 20-60 second API response times
 * Caches product searches, stock checks, and other WooCommerce operations
 */

import { getRedisClient } from '../redis-unified';
import type { ResilientRedisClient } from '../redis-unified';
import type { CacheStats, CacheResult, CommonQuery } from './types';
import { CACHE_TTL, COMMON_WC_QUERIES } from './constants';
import { generateCacheKey } from './cache-key';
import { CacheStorage } from './cache-storage';
import { StatsTracker } from './stats-tracker';
import { warmCache } from './cache-warmer';

export class WooCommerceAPICache {
  private redis: ResilientRedisClient;
  private storage: CacheStorage;
  private stats: StatsTracker;

  constructor() {
    this.redis = getRedisClient();
    this.storage = new CacheStorage(this.redis);
    this.stats = new StatsTracker();
  }

  /**
   * Get cached response or execute WooCommerce API call
   * This is the main method that eliminates 20-60s response times
   */
  async getOrFetch<T>(
    operation: string,
    params: any,
    domain: string,
    fetchFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const startTime = Date.now();
    const cacheKey = generateCacheKey(operation, params, domain);
    const ttl = CACHE_TTL[operation as keyof typeof CACHE_TTL] || CACHE_TTL.default;

    // Try cache first
    const cached = await this.storage.get(cacheKey);
    if (cached) {
      const timeSaved = Date.now() - startTime;
      this.stats.recordHit(timeSaved);

      console.log(`[WC API Cache] ✅ HIT: ${operation} (saved ~20-60s, actual: ${timeSaved}ms)`);
      return {
        data: cached as T,
        fromCache: true,
        responseTime: timeSaved
      };
    }

    // Cache miss - make expensive API call
    this.stats.recordMiss();
    console.log(`[WC API Cache] ❌ MISS: ${operation} (fetching from API...)`);

    try {
      const apiStartTime = Date.now();
      const data = await fetchFn();
      const apiTime = Date.now() - apiStartTime;

      // Cache the result to avoid future slow API calls
      await this.storage.set(cacheKey, data, ttl);


      return {
        data,
        fromCache: false,
        responseTime: apiTime
      };
    } catch (error) {
      console.error(`[WC API Cache] API call failed for ${operation}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<number> {
    const invalidated = await this.storage.invalidate(pattern);
    return invalidated;
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    await this.storage.flush();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    memoryCacheSize: number;
    estimatedTimeSavedMinutes: number;
    successRate: string;
  } {
    return this.stats.getStats(this.storage.memoryCacheSize);
  }

  /**
   * Warm cache with common queries
   */
  async warmCache(
    commonQueries: CommonQuery[],
    domain: string,
    fetchFn: (operation: string, params: any) => Promise<any>
  ): Promise<void> {
    return warmCache(this.storage, commonQueries, domain, fetchFn, generateCacheKey);
  }
}

// Singleton instance
let cacheInstance: WooCommerceAPICache | null = null;

export function getWooCommerceAPICache(): WooCommerceAPICache {
  if (!cacheInstance) {
    cacheInstance = new WooCommerceAPICache();
  }
  return cacheInstance;
}

// Export types and common queries
export type { CacheStats, CacheResult, CommonQuery } from './types';
export { COMMON_WC_QUERIES } from './constants';
