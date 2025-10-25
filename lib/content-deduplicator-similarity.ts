// Similarity detection and caching utilities

// MinHash implementation for similarity detection
export class MinHash {
  private hashes: number[];
  private numHashFunctions: number;

  constructor(numHashFunctions: number = 128) {
    this.numHashFunctions = numHashFunctions;
    this.hashes = new Array(numHashFunctions).fill(Infinity);
  }

  update(text: string): void {
    const shingles = this.generateShingles(text, 3);

    for (const shingle of shingles) {
      for (let i = 0; i < this.numHashFunctions; i++) {
        const hash = this.hash(shingle, i);
        if (hash < (this.hashes[i] || Infinity)) {
          this.hashes[i] = hash;
        }
      }
    }
  }

  private generateShingles(text: string, k: number): Set<string> {
    const shingles = new Set<string>();
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i <= words.length - k; i++) {
      shingles.add(words.slice(i, i + k).join(' '));
    }

    return shingles;
  }

  private hash(text: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  jaccardSimilarity(other: MinHash): number {
    if (this.hashes.length !== other.hashes.length) {
      throw new Error('MinHash objects must have the same number of hash functions');
    }

    let matches = 0;
    for (let i = 0; i < this.hashes.length; i++) {
      if (this.hashes[i] === other.hashes[i]) {
        matches++;
      }
    }

    return matches / this.hashes.length;
  }

  getSignature(): number[] {
    return [...this.hashes];
  }
}

// LRU Cache implementation for memory management
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private accessOrder: Map<K, number> = new Map();
  private accessCounter: number = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessOrder.set(key, this.accessCounter++);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, value);
    this.accessOrder.set(key, this.accessCounter++);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  get size(): number {
    return this.cache.size;
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: K | undefined;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }
}

// Utility functions for similarity detection
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) {
    const row = matrix[0];
    if (row !== undefined) {
      row[i] = i;
    }
  }
  for (let j = 0; j <= str2.length; j++) {
    const row = matrix[j];
    if (row !== undefined) {
      row[0] = j;
    }
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      const currentRow = matrix[j];
      const prevRow = matrix[j - 1];
      if (currentRow !== undefined && prevRow !== undefined) {
        const left = currentRow[i - 1];
        const top = prevRow[i];
        const diagonal = prevRow[i - 1];
        if (left !== undefined && top !== undefined && diagonal !== undefined) {
          currentRow[i] = Math.min(left + 1, top + 1, diagonal + indicator);
        }
      }
    }
  }

  const lastRow = matrix[str2.length];
  if (lastRow !== undefined) {
    const value = lastRow[str1.length];
    return value !== undefined ? value : 0;
  }
  return 0;
}

export function isVariable(word1: string, word2: string): boolean {
  const numberPattern = /^\d+$/;
  const datePattern = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    (numberPattern.test(word1) && numberPattern.test(word2)) ||
    (datePattern.test(word1) && datePattern.test(word2)) ||
    (emailPattern.test(word1) && emailPattern.test(word2)) ||
    (word1.length > 5 && word2.length > 5 && levenshteinDistance(word1, word2) / Math.max(word1.length, word2.length) < 0.3)
  );
}
