/**
 * Cache Operations
 * Core caching logic for search results and embeddings
 */

import { Redis } from 'ioredis';
import crypto from 'crypto';
import { getVersionedCacheKey } from '../cache-versioning';
import type { CachedSearchResult } from './types';

/**
 * Cache Operations Handler
 * Handles search result and embedding caching with versioning
 */
export class CacheOperations {
  private redis: Redis | any;
  private readonly CACHE_TTL = 3600; // 1 hour for search results
  private readonly EMBEDDING_CACHE_TTL = 86400; // 24 hours for embeddings

  constructor(redis: Redis | any) {
    this.redis = redis;
  }

  /**
   * Generate cache key for a search query
   */
  getCacheKey(query: string, domain?: string, limit?: number): string {
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

      return JSON.parse(cached);
    } catch (error) {
      console.error('[SearchCache] Error getting cached embedding:', error);
      return null;
    }
  }
}
