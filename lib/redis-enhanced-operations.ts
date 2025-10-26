/**
 * Redis operation wrappers with fallback support
 * Extracted from redis-enhanced.ts for better modularity
 */

import type Redis from 'ioredis';

export class RedisOperations {
  constructor(
    private redis: Redis | null,
    private fallbackStorage: Map<string, any>,
    private isAvailableCheck: () => boolean
  ) {}

  async get(key: string): Promise<string | null> {
    if (!this.isAvailableCheck()) {
      return this.fallbackStorage.get(key) || null;
    }

    try {
      return await this.redis!.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return this.fallbackStorage.get(key) || null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    this.fallbackStorage.set(key, value);

    if (!this.isAvailableCheck()) {
      return true;
    }

    try {
      if (ttl) {
        await this.redis!.setex(key, ttl, value);
      } else {
        await this.redis!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return true;
    }
  }

  async del(key: string): Promise<boolean> {
    this.fallbackStorage.delete(key);

    if (!this.isAvailableCheck()) {
      return true;
    }

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return true;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailableCheck()) {
      return this.fallbackStorage.has(key);
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return this.fallbackStorage.has(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailableCheck()) {
      const current = this.fallbackStorage.get(key) || 0;
      const newValue = parseInt(current) + 1;
      this.fallbackStorage.set(key, newValue.toString());
      return newValue;
    }

    try {
      return await this.redis!.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      const current = this.fallbackStorage.get(key) || 0;
      const newValue = parseInt(current) + 1;
      this.fallbackStorage.set(key, newValue.toString());
      return newValue;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailableCheck()) {
      return true;
    }

    try {
      const result = await this.redis!.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return true;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isAvailableCheck()) {
      const list = this.fallbackStorage.get(key) || [];
      return list.slice(start, stop === -1 ? undefined : stop + 1);
    }

    try {
      return await this.redis!.lrange(key, start, stop);
    } catch (error) {
      console.error(`Redis LRANGE error for key ${key}:`, error);
      const list = this.fallbackStorage.get(key) || [];
      return list.slice(start, stop === -1 ? undefined : stop + 1);
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.isAvailableCheck()) {
      const list = this.fallbackStorage.get(key) || [];
      list.push(...values);
      this.fallbackStorage.set(key, list);
      return list.length;
    }

    try {
      const list = this.fallbackStorage.get(key) || [];
      list.push(...values);
      this.fallbackStorage.set(key, list);

      return await this.redis!.rpush(key, ...values);
    } catch (error) {
      console.error(`Redis RPUSH error for key ${key}:`, error);
      const list = this.fallbackStorage.get(key) || [];
      return list.length;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.isAvailableCheck()) {
      return false;
    }

    try {
      const result = await this.redis!.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailableCheck()) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(this.fallbackStorage.keys()).filter(key => regex.test(key));
    }

    try {
      return await this.redis!.keys(pattern);
    } catch (error) {
      console.warn('Redis keys error:', error);
      return [];
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isAvailableCheck()) {
      const value = this.fallbackStorage.get(key);
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      return {};
    }

    try {
      return await this.redis!.hgetall(key) || {};
    } catch (error) {
      console.warn('Redis hgetall error:', error);
      return {};
    }
  }
}
