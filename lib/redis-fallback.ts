/**
 * Redis with In-Memory Fallback
 *
 * Provides a Redis-compatible interface that falls back to in-memory storage
 * when Redis is not available. This allows the application to work without Redis
 * in production environments where Redis might not be configured.
 */

import Redis from 'ioredis';
import { logger } from './logger';
import { InMemoryStore } from './redis-fallback-memory';
import { RedisCacheOperations } from './redis-fallback-cache';
import { RedisStatus, RedisOperations } from './redis-fallback-types';

export class RedisClientWithFallback implements RedisOperations {
  private client: Redis | null = null;
  private fallback: InMemoryStore | null = null;
  private isRedisAvailable = false;
  private connectionAttempted = false;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cacheOps: RedisCacheOperations | null = null;
  private isBuildTime = false;

  constructor() {
    // Detect build time to suppress connection errors
    this.isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                       process.env.NEXT_PHASE === 'phase-export' ||
                       process.argv.includes('build');
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      if (!this.isBuildTime) {
        logger.info('[Redis] No REDIS_URL configured, using in-memory fallback');
      }
      this.initializeFallback();
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            if (!this.isBuildTime) {
              logger.warn('[Redis] Max retries reached, switching to in-memory fallback');
            }
            this.initializeFallback();
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        reconnectOnError: (err) => err.message.includes('READONLY'),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        // Suppress ioredis internal logging during build
        lazyConnect: this.isBuildTime,
      });

      this.setupEventHandlers();

      // Skip ping during build time
      if (!this.isBuildTime) {
        await this.client.ping();
      }
      this.isRedisAvailable = !this.isBuildTime;
    } catch (error) {
      if (!this.isBuildTime) {
        logger.warn('[Redis] Failed to connect, using in-memory fallback:', error as Error);
      }
      this.initializeFallback();
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('error', (err) => {
      // Suppress error logs during build time
      if (!this.isBuildTime) {
        logger.error('[Redis] Connection error:', err);
      }
      if (!this.fallback) {
        this.initializeFallback();
      }
    });

    this.client.on('connect', () => {
      if (!this.isBuildTime) {
        logger.info('[Redis] Connected successfully');
      }
      this.isRedisAvailable = true;
    });

    this.client.on('close', () => {
      if (!this.isBuildTime) {
        logger.warn('[Redis] Connection closed');
      }
      this.isRedisAvailable = false;
      if (!this.fallback) {
        this.initializeFallback();
      }
    });
  }

  private initializeFallback(): void {
    if (!this.fallback) {
      this.fallback = new InMemoryStore();
      this.cleanupInterval = setInterval(() => {
        this.fallback?.cleanup();
      }, 60000);
    }
    this.updateCacheOps();
  }

  private updateCacheOps(): void {
    this.cacheOps = new RedisCacheOperations(
      this.client,
      this.fallback,
      this.isRedisAvailable
    );
  }

  private ensureCacheOps(): RedisCacheOperations {
    if (!this.cacheOps) {
      this.updateCacheOps();
    }
    return this.cacheOps!;
  }

  async get(key: string): Promise<string | null> {
    return this.ensureCacheOps().get(key);
  }

  async set(key: string, value: string): Promise<'OK' | null> {
    return this.ensureCacheOps().set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    return this.ensureCacheOps().setex(key, seconds, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.ensureCacheOps().del(...keys);
  }

  async exists(key: string): Promise<number> {
    return this.ensureCacheOps().exists(key);
  }

  async incr(key: string): Promise<number> {
    return this.ensureCacheOps().incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.ensureCacheOps().expire(key, seconds);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.ensureCacheOps().rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.ensureCacheOps().lrange(key, start, stop);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.ensureCacheOps().zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]> {
    return this.ensureCacheOps().zrange(key, start, stop, withScores);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.ensureCacheOps().zrem(key, ...members);
  }

  async zcard(key: string): Promise<number> {
    return this.ensureCacheOps().zcard(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.ensureCacheOps().keys(pattern);
  }

  async quit(): Promise<'OK'> {
    return this.ensureCacheOps().quit();
  }

  isUsingFallback(): boolean {
    return !this.isRedisAvailable && !!this.fallback;
  }

  getStatus(): RedisStatus {
    if (this.isRedisAvailable) {
      return { type: 'redis', available: true };
    } else if (this.fallback) {
      return { type: 'memory', available: true };
    } else {
      return { type: 'unavailable', available: false };
    }
  }

  disconnect(): void {
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

let redisClientInstance: RedisClientWithFallback | null = null;

export function getRedisClientWithFallback(): RedisClientWithFallback {
  if (!redisClientInstance) {
    redisClientInstance = new RedisClientWithFallback();
  }
  return redisClientInstance;
}

export const redis = getRedisClientWithFallback();
