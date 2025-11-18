/**
 * Cache Storage Layer (Redis + Memory Fallback)
 */

import type { ResilientRedisClient } from '../redis-unified';

export class CacheStorage {
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();

  constructor(private redis: ResilientRedisClient) {
    this.startMemoryCacheCleanup();
  }

  async get(key: string): Promise<any | null> {
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
      return memoryCached.data;
    }

    return null;
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
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

    return invalidated;
  }

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
  }

  get memoryCacheSize(): number {
    return this.memoryCache.size;
  }

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
      }
    }, 60000); // Clean every minute
  }
}
