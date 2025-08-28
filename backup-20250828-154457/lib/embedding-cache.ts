/**
 * Embedding Cache Layer
 * Implements an LRU cache for frequently accessed embeddings to reduce API calls
 */

import { createHash } from 'crypto';

interface CacheEntry {
  embedding: number[];
  timestamp: number;
  hits: number;
}

class EmbeddingCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSize: number = 1000, ttlMinutes: number = 60) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate a cache key from text content
   */
  private generateKey(text: string): string {
    return createHash('md5').update(text).digest('hex');
  }

  /**
   * Get embedding from cache
   */
  get(text: string): number[] | null {
    const key = this.generateKey(text);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.embedding;
  }

  /**
   * Set embedding in cache
   */
  set(text: string, embedding: number[]): void {
    const key = this.generateKey(text);

    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Get multiple embeddings from cache
   */
  getMultiple(texts: string[]): { cached: Map<number, number[]>, missing: number[] } {
    const cached = new Map<number, number[]>();
    const missing: number[] = [];

    texts.forEach((text, index) => {
      const embedding = this.get(text);
      if (embedding) {
        cached.set(index, embedding);
      } else {
        missing.push(index);
      }
    });

    return { cached, missing };
  }

  /**
   * Set multiple embeddings in cache
   */
  setMultiple(texts: string[], embeddings: number[][]): void {
    texts.forEach((text, index) => {
      if (embeddings[index]) {
        this.set(text, embeddings[index]);
      }
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
    };
  }

  /**
   * Preload cache with frequently used embeddings
   */
  async preload(commonTexts: string[], generateFunc: (texts: string[]) => Promise<number[][]>): Promise<void> {
    const batchSize = 20;
    
    for (let i = 0; i < commonTexts.length; i += batchSize) {
      const batch = commonTexts.slice(i, i + batchSize);
      const embeddings = await generateFunc(batch);
      this.setMultiple(batch, embeddings);
    }
    
    console.log(`[EmbeddingCache] Preloaded ${commonTexts.length} embeddings`);
  }
}

// Singleton instance
export const embeddingCache = new EmbeddingCache();

// Content deduplication helper
export class ContentDeduplicator {
  private contentHashes: Set<string>;

  constructor() {
    this.contentHashes = new Set();
  }

  /**
   * Check if content is duplicate based on hash
   */
  isDuplicate(content: string): boolean {
    const hash = createHash('md5').update(content).digest('hex');
    if (this.contentHashes.has(hash)) {
      return true;
    }
    this.contentHashes.add(hash);
    return false;
  }

  /**
   * Filter out duplicate content from array
   */
  filterDuplicates(contents: string[]): { unique: string[], duplicateIndices: number[] } {
    const unique: string[] = [];
    const duplicateIndices: number[] = [];

    contents.forEach((content, index) => {
      if (!this.isDuplicate(content)) {
        unique.push(content);
      } else {
        duplicateIndices.push(index);
      }
    });

    return { unique, duplicateIndices };
  }

  /**
   * Clear the deduplicator
   */
  clear(): void {
    this.contentHashes.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      uniqueContentCount: this.contentHashes.size,
    };
  }
}

export const contentDeduplicator = new ContentDeduplicator();