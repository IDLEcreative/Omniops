/**
 * Redis with In-Memory Fallback
 * 
 * Provides a Redis-compatible interface that falls back to in-memory storage
 * when Redis is not available. This allows the application to work without Redis
 * in production environments where Redis might not be configured.
 */

import Redis from 'ioredis';
import { logger } from './logger';

// In-memory storage for fallback
class InMemoryStore {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  private lists: Map<string, string[]> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, { 
      value, 
      expiry: Date.now() + (seconds * 1000) 
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key) || this.lists.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }
    
    return 1;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = (parseInt(current || '0') || 0) + 1;
    await this.set(key, value.toString());
    return value;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    item.expiry = Date.now() + (seconds * 1000);
    return 1;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    list.push(...values);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    // Handle negative indices like Redis
    const actualStart = start < 0 ? Math.max(0, list.length + start) : start;
    const actualStop = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(actualStart, actualStop);
  }

  // Clean up expired items periodically
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
      }
    }
  }
}

// Redis client wrapper with fallback
export class RedisClientWithFallback {
  private client: Redis | null = null;
  private fallback: InMemoryStore | null = null;
  private isRedisAvailable = false;
  private connectionAttempted = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.info('[Redis] No REDIS_URL configured, using in-memory fallback');
      this.initializeFallback();
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('[Redis] Max retries reached, switching to in-memory fallback');
            this.initializeFallback();
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false, // Don't queue commands when offline
        connectTimeout: 5000, // 5 second connection timeout
      });

      this.client.on('error', (err) => {
        logger.error('[Redis] Connection error:', err);
        if (!this.fallback) {
          this.initializeFallback();
        }
      });

      this.client.on('connect', () => {
        logger.info('[Redis] Connected successfully');
        this.isRedisAvailable = true;
      });

      this.client.on('close', () => {
        logger.warn('[Redis] Connection closed');
        this.isRedisAvailable = false;
        if (!this.fallback) {
          this.initializeFallback();
        }
      });

      // Test connection
      await this.client.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      logger.warn('[Redis] Failed to connect, using in-memory fallback:', error as Error);
      this.initializeFallback();
    }
  }

  private initializeFallback() {
    if (!this.fallback) {
      this.fallback = new InMemoryStore();
      // Clean up expired items every minute
      this.cleanupInterval = setInterval(() => {
        this.fallback?.cleanup();
      }, 60000);
    }
  }

  // Redis-compatible methods
  async get(key: string): Promise<string | null> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        logger.warn('[Redis] Get operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.get(key) : null;
  }

  async set(key: string, value: string): Promise<'OK' | null> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.set(key, value);
      } catch (error) {
        logger.warn('[Redis] Set operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.set(key, value) : null;
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.setex(key, seconds, value);
      } catch (error) {
        logger.warn('[Redis] Setex operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.setex(key, seconds, value) : null;
  }

  async del(...keys: string[]): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.del(...keys);
      } catch (error) {
        logger.warn('[Redis] Del operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.del(...keys) : 0;
  }

  async exists(key: string): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.exists(key);
      } catch (error) {
        logger.warn('[Redis] Exists operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.exists(key) : 0;
  }

  async incr(key: string): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.incr(key);
      } catch (error) {
        logger.warn('[Redis] Incr operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.incr(key) : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.expire(key, seconds);
      } catch (error) {
        logger.warn('[Redis] Expire operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.expire(key, seconds) : 0;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.rpush(key, ...values);
      } catch (error) {
        logger.warn('[Redis] Rpush operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.rpush(key, ...values) : 0;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.lrange(key, start, stop);
      } catch (error) {
        logger.warn('[Redis] Lrange operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.lrange(key, start, stop) : [];
  }

  // Status check
  isUsingFallback(): boolean {
    return !this.isRedisAvailable && !!this.fallback;
  }

  getStatus(): { type: 'redis' | 'memory' | 'unavailable'; available: boolean } {
    if (this.isRedisAvailable) {
      return { type: 'redis', available: true };
    } else if (this.fallback) {
      return { type: 'memory', available: true };
    } else {
      return { type: 'unavailable', available: false };
    }
  }

  // Cleanup
  disconnect() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    
    if (this.fallback) {
      this.fallback = null;
    }
  }
}

// Singleton instance
let redisClientInstance: RedisClientWithFallback | null = null;

export function getRedisClientWithFallback(): RedisClientWithFallback {
  if (!redisClientInstance) {
    redisClientInstance = new RedisClientWithFallback();
  }
  return redisClientInstance;
}

// Export a Redis-compatible interface for backward compatibility
export const redis = getRedisClientWithFallback();