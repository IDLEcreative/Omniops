/**
 * Organization Context - Cache Manager
 *
 * Generic TTL-based caching utility for organization data.
 * Reduces unnecessary API calls and improves performance.
 */

// Cache configuration
export const CACHE_CONFIG = {
  ORGANIZATIONS_TTL: 5 * 60 * 1000, // 5 minutes
  SEAT_USAGE_TTL: 60 * 1000, // 1 minute
  PERMISSIONS_TTL: 2 * 60 * 1000, // 2 minutes
};

// In-memory cache with TTL
export class CacheManager<T> {
  private cache: Map<string, { data: T; expires: number }> = new Map();

  set(key: string, data: T, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string) {
    if (pattern) {
      Array.from(this.cache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const data = this.get(key);
    return data !== null;
  }
}
