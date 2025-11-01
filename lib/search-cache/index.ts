/**
 * Search Cache Manager - Main Export
 * Provides backward-compatible exports from modular structure
 *
 * Original file: lib/search-cache.ts (422 LOC)
 * Refactored into 3 focused modules:
 * - types.ts (29 LOC) - Type definitions
 * - cache-operations.ts (137 LOC) - Core caching logic
 * - cache-management.ts (260 LOC) - Management, stats, metrics
 */

import { Redis } from 'ioredis';
import { getRedisClient } from '../redis';
import { CacheOperations } from './cache-operations';
import { CacheManagement } from './cache-management';

// Re-export types
export type { CachedSearchResult, CacheStats } from './types';

// Re-export classes for direct use
export { CacheOperations } from './cache-operations';
export { CacheManagement } from './cache-management';

/**
 * Search Cache Manager
 * Main class that composes cache operations and management
 * Maintains backward compatibility with original implementation
 */
export class SearchCacheManager {
  private redis: Redis | any;
  private cacheOps: CacheOperations;
  private cacheManagement: CacheManagement;

  constructor(redis?: Redis | any) {
    this.redis = redis || getRedisClient();
    this.cacheOps = new CacheOperations(this.redis);
    this.cacheManagement = new CacheManagement(this.redis, this.cacheOps);
  }

  // ========================================
  // Cache Operations (delegate to CacheOperations)
  // ========================================

  async getCachedResult(query: string, domain?: string, limit?: number) {
    const result = await this.cacheOps.getCachedResult(query, domain, limit);
    if (result) {
      await this.cacheManagement.trackCacheAccess(true);
    } else {
      await this.cacheManagement.trackCacheAccess(false);
    }
    return result;
  }

  async cacheResult(
    query: string,
    result: Omit<import('./types').CachedSearchResult, 'cachedAt'>,
    domain?: string,
    limit?: number
  ): Promise<void> {
    await this.cacheOps.cacheResult(query, result, domain, limit);
    await this.cacheManagement.enforceCacheLimit();
    await this.cacheManagement.incrementMetric('cache:writes');
  }

  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    await this.cacheOps.cacheEmbedding(text, embedding);
    await this.cacheManagement.incrementMetric('embedding:cache:writes');
  }

  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const result = await this.cacheOps.getCachedEmbedding(text);
    if (result) {
      await this.cacheManagement.incrementMetric('embedding:cache:hits');
    }
    return result;
  }

  // ========================================
  // Cache Management (delegate to CacheManagement)
  // ========================================

  async invalidateDomainCache(domain: string): Promise<void> {
    return this.cacheManagement.invalidateDomainCache(domain);
  }

  async invalidateQuery(query: string, domain?: string, limit?: number): Promise<void> {
    return this.cacheManagement.invalidateQuery(query, domain, limit);
  }

  async clearOldVersionCaches(): Promise<void> {
    return this.cacheManagement.clearOldVersionCaches();
  }

  async clearAllCache(): Promise<void> {
    return this.cacheManagement.clearAllCache();
  }

  async getCacheStats() {
    return this.cacheManagement.getCacheStats();
  }

  async warmupCache(commonQueries: string[], generateResult: (query: string) => Promise<any>): Promise<void> {
    return this.cacheManagement.warmupCache(commonQueries, generateResult);
  }

  async incrementMetric(metric: string): Promise<void> {
    return this.cacheManagement.incrementMetric(metric);
  }

  async trackCacheAccess(hit: boolean): Promise<void> {
    return this.cacheManagement.trackCacheAccess(hit);
  }
}

// Singleton instance
let cacheManager: SearchCacheManager | null = null;

export function getSearchCacheManager(): SearchCacheManager {
  if (!cacheManager) {
    cacheManager = new SearchCacheManager();
  }
  return cacheManager;
}
