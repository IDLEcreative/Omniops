/**
 * Cache Manager
 *
 * Manages in-memory cache for storage values with TTL support.
 */

import type { CacheEntry } from './types';

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL: number;

  constructor(cacheTTL: number = 5000) {
    this.cacheTTL = cacheTTL;
  }

  /**
   * Get cached value if valid
   */
  get(key: string): string | null | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: string | null): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
