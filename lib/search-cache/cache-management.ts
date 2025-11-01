/**
 * Cache Management
 * Handles invalidation, clearing, statistics, warmup, and metrics
 */

import { Redis } from 'ioredis';
import { SEARCH_CACHE_VERSION, getPreviousVersions } from '../cache-versioning';
import type { CacheStats } from './types';
import type { CacheOperations } from './cache-operations';

/**
 * Cache Management Handler
 * Manages cache lifecycle, metrics, and statistics
 */
export class CacheManagement {
  private redis: Redis | any;
  private cacheOps: CacheOperations;
  private readonly MAX_CACHE_SIZE = 1000; // Max number of cached queries

  constructor(redis: Redis | any, cacheOps: CacheOperations) {
    this.redis = redis;
    this.cacheOps = cacheOps;
  }

  /**
   * Invalidate cache for a domain (when content is updated)
   */
  async invalidateDomainCache(domain: string): Promise<void> {
    try {
      // Get all cache keys for this domain
      const pattern = `search:cache:*`;
      const keys = await this.redis.keys(pattern);

      // Filter keys that belong to this domain
      const domainKeys: string[] = [];
      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached && cached.includes(domain)) {
          domainKeys.push(key);
        }
      }

      // Delete domain-specific cache entries
      if (domainKeys.length > 0) {
        await this.redis.del(...domainKeys);
        console.log(`[SearchCache] Invalidated ${domainKeys.length} cache entries for domain: ${domain}`);
      }
    } catch (error) {
      console.error('[SearchCache] Error invalidating domain cache:', error);
    }
  }

  /**
   * Invalidate specific query cache
   */
  async invalidateQuery(query: string, domain?: string, limit?: number): Promise<void> {
    try {
      const key = this.cacheOps.getCacheKey(query, domain, limit);
      await this.redis.del(key);
      await this.redis.zrem('search:cache:lru', key);
    } catch (error) {
      console.error('[SearchCache] Error invalidating query:', error);
    }
  }

  /**
   * Clear old version caches (cleanup after version bump)
   */
  async clearOldVersionCaches(): Promise<void> {
    try {
      const previousVersions = getPreviousVersions();
      let totalDeleted = 0;

      for (const version of previousVersions) {
        const searchPattern = `search:cache:*:v${version}`;
        const embeddingPattern = `embedding:cache:*:v${version}`;

        const searchKeys = await this.redis.keys(searchPattern);
        const embeddingKeys = await this.redis.keys(embeddingPattern);

        const versionKeys = [...searchKeys, ...embeddingKeys];

        if (versionKeys.length > 0) {
          await this.redis.del(...versionKeys);
          console.log(`[SearchCache] Cleared ${versionKeys.length} cache entries for version ${version}`);
          totalDeleted += versionKeys.length;
        }
      }

      if (totalDeleted > 0) {
        console.log(`[SearchCache] Total old version entries cleared: ${totalDeleted}`);
      }
    } catch (error) {
      console.error('[SearchCache] Error clearing old version caches:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      // Use versioned patterns to clear current version cache
      const currentVersion = SEARCH_CACHE_VERSION;
      const searchPattern = `search:cache:*:v${currentVersion}`;
      const embeddingPattern = `embedding:cache:*:v${currentVersion}`;

      const searchKeys = await this.redis.keys(searchPattern);
      const embeddingKeys = await this.redis.keys(embeddingPattern);

      // Also look for any unversioned keys (legacy)
      const legacySearchKeys = await this.redis.keys('search:cache:*');
      const legacyEmbeddingKeys = await this.redis.keys('embedding:cache:*');

      // Filter out versioned keys from legacy to avoid duplicates
      const filteredLegacySearch = legacySearchKeys.filter((k: string) => !k.includes(':v'));
      const filteredLegacyEmbedding = legacyEmbeddingKeys.filter((k: string) => !k.includes(':v'));

      const allKeys = [
        ...searchKeys,
        ...embeddingKeys,
        ...filteredLegacySearch,
        ...filteredLegacyEmbedding
      ];

      if (allKeys.length > 0) {
        await this.redis.del(...allKeys);
        console.log(`[SearchCache] Cleared ${allKeys.length} cache entries`);
      }

      // Clear LRU tracking
      await this.redis.del('search:cache:lru');

      // Clear metrics
      await this.redis.del(
        'metrics:cache:hits',
        'metrics:cache:misses',
        'metrics:cache:writes',
        'metrics:embedding:cache:hits',
        'metrics:embedding:cache:writes'
      );
    } catch (error) {
      console.error('[SearchCache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      // Get all cache keys and separate by version
      const allSearchKeys = await this.redis.keys('search:cache:*');
      const versionedKeys = allSearchKeys.filter((k: string) => k.includes(`:v${SEARCH_CACHE_VERSION}`));
      const legacyKeys = allSearchKeys.filter((k: string) => !k.includes(':v'));

      const hits = parseInt(await this.redis.get('metrics:cache:hits') || '0');
      const misses = parseInt(await this.redis.get('metrics:cache:misses') || '0');
      const writes = parseInt(await this.redis.get('metrics:cache:writes') || '0');
      const embHits = parseInt(await this.redis.get('metrics:embedding:cache:hits') || '0');

      // Get LRU timestamps
      const lruScores = await this.redis.zrange('search:cache:lru', 0, -1, 'WITHSCORES');
      const timestamps = [];
      for (let i = 1; i < lruScores.length; i += 2) {
        timestamps.push(parseInt(lruScores[i]));
      }

      const total = hits + misses;

      return {
        totalCached: allSearchKeys.length,
        cacheHits: hits,
        cacheMisses: misses,
        cacheWrites: writes,
        hitRate: total > 0 ? (hits / total) * 100 : 0,
        embeddingCacheHits: embHits,
        oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
        newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
        currentVersion: SEARCH_CACHE_VERSION,
        versionedEntries: versionedKeys.length,
        legacyEntries: legacyKeys.length
      };
    } catch (error) {
      console.error('[SearchCache] Error getting stats:', error);
      return {
        totalCached: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheWrites: 0,
        hitRate: 0,
        embeddingCacheHits: 0,
        oldestEntry: 0,
        newestEntry: 0,
        currentVersion: SEARCH_CACHE_VERSION,
        versionedEntries: 0,
        legacyEntries: 0
      };
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmupCache(commonQueries: string[], generateResult: (query: string) => Promise<any>): Promise<void> {
    console.log(`[SearchCache] Warming up cache with ${commonQueries.length} common queries...`);

    for (const query of commonQueries) {
      const cached = await this.cacheOps.getCachedResult(query);
      if (!cached) {
        try {
          const result = await generateResult(query);
          await this.cacheOps.cacheResult(query, result);
        } catch (error) {
          console.error(`[SearchCache] Error warming up query "${query}":`, error);
        }
      }
    }

    console.log('[SearchCache] Cache warmup complete');
  }

  /**
   * Track cache metrics
   */
  async incrementMetric(metric: string): Promise<void> {
    try {
      await this.redis.incr(`metrics:${metric}`);
    } catch (error) {
      // Ignore metric errors
    }
  }

  /**
   * Track cache hit/miss
   */
  async trackCacheAccess(hit: boolean): Promise<void> {
    const metric = hit ? 'cache:hits' : 'cache:misses';
    await this.incrementMetric(metric);
  }

  /**
   * Enforce cache size limit using LRU eviction
   */
  async enforceCacheLimit(): Promise<void> {
    try {
      const count = await this.redis.zcard('search:cache:lru');

      if (count > this.MAX_CACHE_SIZE) {
        // Get oldest entries to remove
        const toRemove = count - this.MAX_CACHE_SIZE;
        const oldestKeys = await this.redis.zrange('search:cache:lru', 0, toRemove - 1);

        if (oldestKeys.length > 0) {
          // Remove from cache
          await this.redis.del(...oldestKeys);
          // Remove from LRU tracking
          await this.redis.zrem('search:cache:lru', ...oldestKeys);

          console.log(`[SearchCache] Evicted ${oldestKeys.length} oldest cache entries`);
        }
      }
    } catch (error) {
      console.error('[SearchCache] Error enforcing cache limit:', error);
    }
  }
}
