/**
 * Search Cache Manager
 * Provides high-performance caching for search queries and embeddings
 * Dramatically reduces response times from 3-26 seconds to <1 second
 */

import { Redis } from 'ioredis';
import { getRedisClient } from './redis';
import crypto from 'crypto';
import { 
  SEARCH_CACHE_VERSION, 
  getVersionedCacheKey, 
  isCurrentVersion,
  getPreviousVersions 
} from './cache-versioning';

export interface CachedSearchResult {
  response: string;
  chunks: any[];
  metadata?: {
    sourcesUsed?: string[];
    chunksRetrieved?: number;
    searchMethod?: string;
  };
  cachedAt: number;
}

export class SearchCacheManager {
  private redis: Redis | any;
  private readonly CACHE_TTL = 3600; // 1 hour for search results
  private readonly EMBEDDING_CACHE_TTL = 86400; // 24 hours for embeddings
  private readonly MAX_CACHE_SIZE = 1000; // Max number of cached queries
  
  constructor(redis?: Redis | any) {
    this.redis = redis || getRedisClient();
  }

  /**
   * Generate cache key for a search query
   */
  private getCacheKey(query: string, domain?: string, limit?: number): string {
    const normalized = query.toLowerCase().trim();
    const limitStr = limit ? `:${limit}` : '';
    const keyData = domain ? `${domain}:${normalized}${limitStr}` : `${normalized}${limitStr}`;
    const hash = crypto.createHash('md5').update(keyData).digest('hex');
    const baseKey = `search:cache:${hash}`;
    // Include version in key so changing version invalidates cache
    return getVersionedCacheKey(baseKey);
  }

  /**
   * Get cached search result
   */
  async getCachedResult(query: string, domain?: string, limit?: number): Promise<CachedSearchResult | null> {
    try {
      const key = this.getCacheKey(query, domain, limit);
      const cached = await this.redis.get(key);
      
      if (!cached) return null;
      
      const result = JSON.parse(cached) as CachedSearchResult;
      
      // Check if cache is still fresh (within TTL)
      const age = Date.now() - result.cachedAt;
      if (age > this.CACHE_TTL * 1000) {
        // Cache expired, delete it
        await this.redis.del(key);
        return null;
      }
      
      // Update access time for LRU tracking
      await this.redis.zadd('search:cache:lru', Date.now(), key);
      
      return result;
    } catch (error) {
      console.error('[SearchCache] Error getting cached result:', error);
      return null;
    }
  }

  /**
   * Cache a search result
   */
  async cacheResult(
    query: string, 
    result: Omit<CachedSearchResult, 'cachedAt'>,
    domain?: string,
    limit?: number
  ): Promise<void> {
    try {
      const key = this.getCacheKey(query, domain, limit);
      
      const cacheData: CachedSearchResult = {
        ...result,
        cachedAt: Date.now()
      };
      
      // Store with TTL
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(cacheData));
      
      // Track in LRU set
      await this.redis.zadd('search:cache:lru', Date.now(), key);
      
      // Enforce cache size limit (LRU eviction)
      await this.enforceCacheLimit();
      
      // Track cache metrics
      await this.incrementMetric('cache:writes');
      
    } catch (error) {
      console.error('[SearchCache] Error caching result:', error);
      // Don't throw - caching failure shouldn't break search
    }
  }

  /**
   * Cache embeddings for frequently searched terms
   */
  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
      const hash = crypto.createHash('md5').update(text).digest('hex');
      const baseKey = `embedding:cache:${hash}`;
      // Apply versioning to embedding cache as well
      const key = getVersionedCacheKey(baseKey);
      
      await this.redis.setex(
        key, 
        this.EMBEDDING_CACHE_TTL, 
        JSON.stringify(embedding)
      );
      
      await this.incrementMetric('embedding:cache:writes');
    } catch (error) {
      console.error('[SearchCache] Error caching embedding:', error);
    }
  }

  /**
   * Get cached embedding
   */
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
      const hash = crypto.createHash('md5').update(text).digest('hex');
      const baseKey = `embedding:cache:${hash}`;
      // Apply versioning to embedding cache as well
      const key = getVersionedCacheKey(baseKey);
      
      const cached = await this.redis.get(key);
      if (!cached) return null;
      
      await this.incrementMetric('embedding:cache:hits');
      return JSON.parse(cached);
    } catch (error) {
      console.error('[SearchCache] Error getting cached embedding:', error);
      return null;
    }
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
      const key = this.getCacheKey(query, domain, limit);
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
  async getCacheStats(): Promise<{
    totalCached: number;
    cacheHits: number;
    cacheMisses: number;
    cacheWrites: number;
    hitRate: number;
    embeddingCacheHits: number;
    oldestEntry: number;
    newestEntry: number;
    currentVersion: string;
    versionedEntries: number;
    legacyEntries: number;
  }> {
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
      const cached = await this.getCachedResult(query);
      if (!cached) {
        try {
          const result = await generateResult(query);
          await this.cacheResult(query, result);
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
  private async enforceCacheLimit(): Promise<void> {
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

// Singleton instance
let cacheManager: SearchCacheManager | null = null;

export function getSearchCacheManager(): SearchCacheManager {
  if (!cacheManager) {
    cacheManager = new SearchCacheManager();
  }
  return cacheManager;
}