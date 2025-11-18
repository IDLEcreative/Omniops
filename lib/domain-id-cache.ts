/**
 * Domain ID Cache Layer
 *
 * Purpose: Cache domain → domain_id mappings to eliminate repeated database lookups
 * Performance Impact: Reduces search latency by 10-40ms per request
 *
 * This cache prevents the need to query the `domains` table on every search operation,
 * which is a significant bottleneck in the embeddings search pipeline.
 */

import { createHash } from 'crypto';

interface DomainCacheEntry {
  domainId: string;
  timestamp: number;
  hits: number;
}

class DomainIdCache {
  private cache: Map<string, DomainCacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private enabled: boolean;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSize?: number, ttlMinutes?: number) {
    this.cache = new Map();
    // Read from environment variables with defaults
    this.enabled = process.env.DOMAIN_CACHE_ENABLED !== 'false'; // Default: true
    this.maxSize = maxSize || parseInt(process.env.DOMAIN_CACHE_MAX_SIZE || '1000');
    this.ttl = (ttlMinutes || parseInt(process.env.DOMAIN_CACHE_TTL_MINUTES || '240')) * 60 * 1000; // 4 hours default

    if (!this.enabled) {
    } else {
    }
  }

  /**
   * Normalize domain for consistent caching
   */
  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace('www.', '');
  }

  /**
   * Get domain_id from cache
   */
  get(domain: string): string | null {
    if (!this.enabled) {
      return null;
    }

    const normalizedDomain = this.normalizeDomain(domain);
    const entry = this.cache.get(normalizedDomain);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(normalizedDomain);
      this.stats.misses++;
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(normalizedDomain);
    entry.hits++;
    this.cache.set(normalizedDomain, entry);

    this.stats.hits++;
    return entry.domainId;
  }

  /**
   * Set domain_id in cache
   */
  set(domain: string, domainId: string): void {
    if (!this.enabled) {
      return;
    }

    const normalizedDomain = this.normalizeDomain(domain);

    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(normalizedDomain)) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(normalizedDomain, {
      domainId,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      ttlMinutes: this.ttl / 60000,
      enabled: this.enabled,
    };
  }

  /**
   * Invalidate a specific domain's cache entry
   */
  invalidate(domain: string): void {
    const normalizedDomain = this.normalizeDomain(domain);
    this.cache.delete(normalizedDomain);
  }

  /**
   * Preload cache with known domain mappings
   */
  async preload(domainMappings: Array<{ domain: string; domainId: string }>): Promise<void> {
    domainMappings.forEach(({ domain, domainId }) => {
      this.set(domain, domainId);
    });

  }
}

// Singleton instance
export const domainIdCache = new DomainIdCache();
