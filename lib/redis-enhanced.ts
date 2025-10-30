/**
 * Enhanced Redis client with circuit breaker and fallback
 * Core client implementation - modularized for maintainability
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';
import type { RedisStatus } from './redis-enhanced-types';
import { MemoryAwareCrawlJobManager } from './redis-enhanced-jobs';
import { RedisCircuitBreaker } from './redis-enhanced-circuit-breaker';
import { RedisOperations } from './redis-enhanced-operations';

// Detect build time to suppress connection errors
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NEXT_PHASE === 'phase-export' ||
                    process.argv.includes('build');

const shouldBypassRedis =
  process.env.REDIS_DISABLE === 'true' ||
  process.env.NODE_ENV === 'test' ||
  !!process.env.JEST_WORKER_ID ||
  process.env.REDIS_URL === 'memory';

export class ResilientRedisClient extends EventEmitter {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private fallbackStorage: Map<string, any> = new Map();
  private circuitBreaker!: RedisCircuitBreaker;
  private operations!: RedisOperations;

  constructor(private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    super();

    this.circuitBreaker = new RedisCircuitBreaker(
      this.redis,
      this.isConnected,
      () => this.connect()
    );

    this.operations = new RedisOperations(
      this.redis,
      this.fallbackStorage,
      () => this.isAvailable()
    );

    // Skip Redis connection during build time or when bypassing Redis
    if (shouldBypassRedis || this.redisUrl.startsWith('memory://') || isBuildTime) {
      this.circuitBreaker.openCircuitBreaker();
      this.isConnected = false;
      if (!isBuildTime) {
        console.warn('[Redis] Using in-memory fallback storage');
      }
      return;
    }

    // Only connect at runtime when Redis is configured
    this.connect();
  }

  private connect() {
    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 10000);

          if (this.circuitBreaker.shouldStopRetrying(times)) {
            this.circuitBreaker.openCircuitBreaker();
            return null;
          }

          return delay;
        },
        reconnectOnError: (err) => {
          if (err.message.includes('READONLY')) {
            return true;
          }
          return false;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        disconnectTimeout: 2000,
        commandTimeout: 5000,
      });

      this.redis.on('connect', () => {
        if (!isBuildTime) {
          console.log('Redis connected successfully');
        }
        this.isConnected = true;
        this.circuitBreaker.resetAttempts();
        this.circuitBreaker.closeCircuitBreaker();
        this.emit('connected');
      });

      this.redis.on('error', (err) => {
        if (!isBuildTime) {
          console.error('Redis error:', err.message);
        }
        this.emit('error', err);
      });

      this.redis.on('close', () => {
        if (!isBuildTime) {
          console.log('Redis connection closed');
        }
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.redis.on('reconnecting', () => {
        this.circuitBreaker.incrementAttempts();
        if (!isBuildTime) {
          console.log(`Redis reconnecting... attempt ${this.circuitBreaker.getAttempts()}`);
        }
      });

      // Update operations with new redis instance
      this.operations = new RedisOperations(
        this.redis,
        this.fallbackStorage,
        () => this.isAvailable()
      );

    } catch (error) {
      if (!isBuildTime) {
        console.error('Failed to create Redis client:', error);
      }
      this.circuitBreaker.openCircuitBreaker();
    }
  }

  private isAvailable(): boolean {
    return this.isConnected && !this.circuitBreaker.isCircuitBreakerOpen() && this.redis !== null;
  }

  // Delegate operations to RedisOperations
  async get(key: string): Promise<string | null> {
    return this.operations.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    return this.operations.set(key, value, ttl);
  }

  async del(key: string): Promise<boolean> {
    return this.operations.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.operations.exists(key);
  }

  async incr(key: string): Promise<number> {
    return this.operations.incr(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return this.operations.expire(key, seconds);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.operations.lrange(key, start, stop);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.operations.rpush(key, ...values);
  }

  async ping(): Promise<boolean> {
    return this.operations.ping();
  }

  async keys(pattern: string): Promise<string[]> {
    return this.operations.keys(pattern);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.operations.hgetall(key);
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  getStatus(): RedisStatus {
    return {
      connected: this.isConnected,
      circuitBreakerOpen: this.circuitBreaker.isCircuitBreakerOpen(),
      fallbackSize: this.fallbackStorage.size,
    };
  }

  clearFallbackStorage(): void {
    this.fallbackStorage.clear();
  }
}

// Singleton instances
let redisClient: ResilientRedisClient | null = null;
let jobManager: MemoryAwareCrawlJobManager | null = null;

export function getResilientRedisClient(): ResilientRedisClient {
  if (!redisClient) {
    redisClient = new ResilientRedisClient();
  }
  return redisClient;
}

export function getMemoryAwareJobManager(): MemoryAwareCrawlJobManager {
  if (!jobManager) {
    jobManager = new MemoryAwareCrawlJobManager(getResilientRedisClient());
  }
  return jobManager;
}

// Re-export for backward compatibility
export { MemoryAwareCrawlJobManager } from './redis-enhanced-jobs';
