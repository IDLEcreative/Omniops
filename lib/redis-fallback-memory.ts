/**
 * Redis Fallback - In-Memory Storage
 *
 * In-memory implementation of Redis operations for fallback when Redis is unavailable
 */

import { StoredItem, RedisOperations } from './redis-fallback-types';

export class InMemoryStore implements RedisOperations {
  private store: Map<string, StoredItem> = new Map();
  private lists: Map<string, string[]> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

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
    const actualStart = start < 0 ? Math.max(0, list.length + start) : start;
    const actualStop = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(actualStart, actualStop);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    let set = this.sortedSets.get(key);
    if (!set) {
      set = new Map();
      this.sortedSets.set(key, set);
    }
    const existed = set.has(member);
    set.set(member, score);
    return existed ? 0 : 1;
  }

  async zrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];

    const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
    const actualStart = start < 0 ? Math.max(0, entries.length + start) : start;
    const actualStop = stop < 0 ? entries.length + stop : stop;
    const slice = entries.slice(actualStart, actualStop + 1);

    if (withScores === 'WITHSCORES') {
      const result: string[] = [];
      slice.forEach(([member, score]) => {
        result.push(member, score.toString());
      });
      return result;
    }

    return slice.map(([member]) => member);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;

    let removed = 0;
    for (const member of members) {
      if (set.delete(member)) removed++;
    }

    if (set.size === 0) this.sortedSets.delete(key);
    return removed;
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set ? set.size : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const results: string[] = [];
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) results.push(key);
    }

    for (const key of Array.from(this.lists.keys())) {
      if (regex.test(key) && !results.includes(key)) results.push(key);
    }

    for (const key of Array.from(this.sortedSets.keys())) {
      if (regex.test(key) && !results.includes(key)) results.push(key);
    }

    return results;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.store.entries())) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
      }
    }
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    this.lists.clear();
    this.sortedSets.clear();
    return 'OK';
  }
}
