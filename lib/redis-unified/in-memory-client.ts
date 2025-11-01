/**
 * Redis Unified - In-Memory Fallback Client
 * Minimal in-memory Redis replacement used when REDIS_URL is not set
 */

import { EventEmitter } from 'events';

export class InMemoryRedisClient extends EventEmitter {
  private store = new Map<string, any>();
  private lists = new Map<string, string[]>();

  // Compatibility with ResilientRedisClient API (subset)
  async ping(): Promise<boolean> {
    return false; // Not a real Redis connection
  }

  async get(key: string): Promise<string | null> {
    const v = this.store.get(key);
    if (v === undefined) return null;
    return typeof v === 'string' ? v : JSON.stringify(v);
  }

  async set(key: string, value: string, _ttl?: number): Promise<boolean> {
    this.store.set(key, value);
    return true;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key) || this.lists.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10) || 0;
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(_key: string, _seconds: number): Promise<boolean> {
    // TTL not implemented for in-memory fallback
    return true;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key) || this.lists.has(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    const end = stop === -1 ? list.length : Math.min(stop + 1, list.length);
    return list.slice(start, end);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    list.push(...values);
    this.lists.set(key, list);
    return list.length;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/[-\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$'
    );
    const keys = new Set<string>([...this.store.keys(), ...this.lists.keys()]);
    return [...keys].filter((k) => regex.test(k));
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const v = this.store.get(key);
    if (v && typeof v === 'object') return v;
    return {};
  }

  async disconnect(): Promise<void> {
    // no-op for in-memory
  }

  getStatus(): {
    connected: boolean;
    circuitBreakerOpen: boolean;
    fallbackSize: number;
  } {
    return {
      connected: false,
      circuitBreakerOpen: true, // mark as degraded
      fallbackSize: this.store.size + this.lists.size,
    };
  }
}
