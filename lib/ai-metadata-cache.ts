/**
 * AI Metadata Cache Operations
 *
 * Handles caching of AI-generated metadata to reduce API calls
 */

import { createHash } from 'crypto';
import type { AIMetadata, CacheEntry } from './ai-metadata-generator-types';

/**
 * AI Metadata Cache Manager
 */
export class MetadataCache {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate content hash for cache key
   */
  generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if metadata is cached and not expired
   */
  isCached(hash: string): boolean {
    const entry = this.cache.get(hash);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(hash);
      return false;
    }

    return true;
  }

  /**
   * Get metadata from cache
   */
  getFromCache(hash: string): AIMetadata | null {
    const entry = this.cache.get(hash);
    return entry ? entry.metadata : null;
  }

  /**
   * Cache metadata with TTL
   */
  cacheMetadata(hash: string, metadata: AIMetadata, ttl: number): void {
    this.cache.set(hash, {
      hash,
      metadata,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear all cached metadata
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
