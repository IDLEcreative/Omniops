/**
 * Redis Fallback - Cache Operations
 *
 * Wrapper methods that handle Redis vs in-memory fallback for cache operations
 */

import Redis from 'ioredis';
import { InMemoryStore } from './redis-fallback-memory';
import { RedisOperations } from './redis-fallback-types';
import { logger } from './logger';

export class RedisCacheOperations implements RedisOperations {
  constructor(
    private client: Redis | null,
    private fallback: InMemoryStore | null,
    private isRedisAvailable: boolean
  ) {}

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

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.zadd(key, score, member);
      } catch (error) {
        logger.warn('[Redis] Zadd operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.zadd(key, score, member) : 0;
  }

  async zrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        if (withScores) {
          return await this.client.zrange(key, start, stop, 'WITHSCORES');
        }
        return await this.client.zrange(key, start, stop);
      } catch (error) {
        logger.warn('[Redis] Zrange operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.zrange(key, start, stop, withScores) : [];
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.zrem(key, ...members);
      } catch (error) {
        logger.warn('[Redis] Zrem operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.zrem(key, ...members) : 0;
  }

  async zcard(key: string): Promise<number> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.zcard(key);
      } catch (error) {
        logger.warn('[Redis] Zcard operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.zcard(key) : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.keys(pattern);
      } catch (error) {
        logger.warn('[Redis] Keys operation failed, using fallback:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.keys(pattern) : [];
  }

  async quit(): Promise<'OK'> {
    if (this.isRedisAvailable && this.client) {
      try {
        return await this.client.quit();
      } catch (error) {
        logger.warn('[Redis] Quit operation failed:', error as Error);
      }
    }
    return this.fallback ? await this.fallback.quit() : 'OK';
  }
}
