/**
 * WooCommerce API Response Cache for Chat System
 * Eliminates 20-60 second API response times
 * Caches product searches, stock checks, and other WooCommerce operations
 */

import { getRedisClient } from './redis-unified';
import type { ResilientRedisClient } from './redis-unified';
import crypto from 'crypto';

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  avgTimeSaved: number;
  totalTimeSaved: number;
}

export class WooCommerceAPICache {
  private redis: ResilientRedisClient;
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    avgTimeSaved: 0,
    totalTimeSaved: 0
  };
  
  // Cache TTLs for different operation types (in seconds)
  private readonly TTL = {
    search_products: 300,      // 5 minutes - products don't change often
    get_product_details: 600,  // 10 minutes - detailed info is stable
    check_stock: 60,          // 1 minute - stock levels more dynamic
    get_categories: 1800,      // 30 minutes - categories rarely change
    get_shipping_options: 3600, // 1 hour - shipping rates are stable
    default: 300              // 5 minutes default
  };

  constructor() {
    this.redis = getRedisClient();
    this.startMemoryCacheCleanup();
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
  ): Promise<{ data: T; fromCache: boolean; responseTime: number }> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(operation, params, domain);
    const ttl = this.TTL[operation as keyof typeof this.TTL] || this.TTL.default;

    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      const timeSaved = Date.now() - startTime;
      this.recordHit(timeSaved);
      
      console.log(`[WC API Cache] ✅ HIT: ${operation} (saved ~20-60s, actual: ${timeSaved}ms)`);
      return {
        data: cached as T,
        fromCache: true,
        responseTime: timeSaved
      };
    }

    // Cache miss - make expensive API call
    this.recordMiss();
    console.log(`[WC API Cache] ❌ MISS: ${operation} (fetching from API...)`);
    
    try {
      const apiStartTime = Date.now();
      const data = await fetchFn();
      const apiTime = Date.now() - apiStartTime;
      
      // Cache the result to avoid future slow API calls
      await this.setInCache(cacheKey, data, ttl);
      
      console.log(`[WC API Cache] Fetched in ${apiTime}ms, cached for ${ttl}s`);
      
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
   * Generate deterministic cache key
   */
  private generateCacheKey(operation: string, params: any, domain: string): string {
    // Sort params for consistent key generation
    const sortedParams = JSON.stringify(this.sortObject(params));
    const hash = crypto
      .createHash('md5')
      .update(`${operation}:${sortedParams}:${domain}`)
      .digest('hex')
      .substring(0, 12);
    
    return `wc_api:${domain}:${operation}:${hash}`;
  }

  /**
   * Sort object keys recursively for consistent hashing
   */
  private sortObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sortObject(item));
    
    return Object.keys(obj)
      .sort()
      .reduce((sorted: any, key) => {
        sorted[key] = this.sortObject(obj[key]);
        return sorted;
      }, {});
  }

  /**
   * Get from cache (Redis with memory fallback)
   */
  private async getFromCache(key: string): Promise<any | null> {
    // Try Redis first
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        return JSON.parse(redisValue);
      }
    } catch (error) {
      console.error('[WC API Cache] Redis read error:', error);
    }

    // Fallback to memory cache
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && memoryCached.expires > Date.now()) {
      console.log('[WC API Cache] Using memory cache fallback');
      return memoryCached.data;
    }

    return null;
  }

  /**
   * Set in cache (Redis and memory)
   */
  private async setInCache(key: string, data: any, ttl: number): Promise<void> {
    const serialized = JSON.stringify(data);
    
    // Set in Redis
    try {
      await this.redis.set(key, serialized, ttl);
    } catch (error) {
      console.error('[WC API Cache] Redis write error:', error);
    }

    // Always set in memory cache as backup
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    });
  }

  /**
   * Record cache hit
   */
  private recordHit(timeSaved: number): void {
    this.stats.hits++;
    // Assume API would have taken 20-60 seconds
    const estimatedApiTime = 30000; // 30 seconds average
    this.stats.totalTimeSaved += estimatedApiTime;
    this.stats.avgTimeSaved = this.stats.totalTimeSaved / this.stats.hits;
    this.updateHitRate();
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<number> {
    let invalidated = 0;
    
    // Clear from Redis
    try {
      const keys = await this.redis.keys(`wc_api:*${pattern}*`);
      for (const key of keys) {
        await this.redis.del(key);
        invalidated++;
      }
    } catch (error) {
      console.error('[WC API Cache] Redis invalidation error:', error);
    }

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }

    console.log(`[WC API Cache] Invalidated ${invalidated} entries matching "${pattern}"`);
    return invalidated;
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      const keys = await this.redis.keys('wc_api:*');
      for (const key of keys) {
        await this.redis.del(key);
      }
    } catch (error) {
      console.error('[WC API Cache] Redis flush error:', error);
    }
    
    this.memoryCache.clear();
    console.log('[WC API Cache] Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { 
    memoryCacheSize: number; 
    estimatedTimeSavedMinutes: number;
    successRate: string;
  } {
    return {
      ...this.stats,
      memoryCacheSize: this.memoryCache.size,
      estimatedTimeSavedMinutes: Math.round(this.stats.totalTimeSaved / 60000),
      successRate: `${(this.stats.hitRate * 100).toFixed(1)}%`
    };
  }

  /**
   * Warm cache with common queries
   */
  async warmCache(
    commonQueries: Array<{ operation: string; params: any }>,
    domain: string,
    fetchFn: (operation: string, params: any) => Promise<any>
  ): Promise<void> {
    console.log(`[WC API Cache] 🔥 Warming cache with ${commonQueries.length} common queries...`);
    
    const results = await Promise.allSettled(
      commonQueries.map(async ({ operation, params }) => {
        const cacheKey = this.generateCacheKey(operation, params, domain);
        const cached = await this.getFromCache(cacheKey);
        
        if (!cached) {
          try {
            console.log(`[WC API Cache] Warming: ${operation}`);
            const data = await fetchFn(operation, params);
            const ttl = this.TTL[operation as keyof typeof this.TTL] || this.TTL.default;
            await this.setInCache(cacheKey, data, ttl * 2); // Longer TTL for warmed cache
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

  /**
   * Start periodic cleanup of expired memory cache entries
   */
  private startMemoryCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expires <= now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`[WC API Cache] Cleaned ${cleaned} expired memory cache entries`);
      }
    }, 60000); // Clean every minute
  }
}

// Singleton instance
let cacheInstance: WooCommerceAPICache | null = null;

export function getWooCommerceAPICache(): WooCommerceAPICache {
  if (!cacheInstance) {
    cacheInstance = new WooCommerceAPICache();
    
    // Log cache initialization
    console.log('[WC API Cache] 🚀 Initialized - Ready to eliminate 20-60s API delays');
  }
  return cacheInstance;
}

// Export common queries for cache warming
export const COMMON_WC_QUERIES = [
  { operation: 'search_products', params: { query: 'pump', limit: 20 } },
  { operation: 'search_products', params: { query: 'brake', limit: 20 } },
  { operation: 'search_products', params: { query: 'hydraulic', limit: 20 } },
  { operation: 'search_products', params: { query: 'filter', limit: 20 } },
  { operation: 'get_categories', params: {} },
  { operation: 'get_shipping_options', params: {} }
];