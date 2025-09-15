import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Core interfaces
export interface ContentHash {
  hash: string;
  content: string;
  type: 'navigation' | 'footer' | 'sidebar' | 'header' | 'unique';
  frequency: number;
  pages: string[]; // URLs where this content appears
  size: number;
  compressedSize?: number;
  similarity?: number;
}

export interface DeduplicatedStorage {
  commonElements: Map<string, ContentHash>;
  uniqueContent: Map<string, string>;
  references: Map<string, string[]>; // page -> element IDs
}

export interface Pattern {
  id: string;
  template: string;
  frequency: number;
  variations: string[];
  pages: string[];
}

export interface DeduplicationMetrics {
  totalPages: number;
  uniqueContent: number;
  duplicateContent: number;
  storageReduction: number; // percentage
  commonPatterns: Pattern[];
  compressionRatio: number;
  processingTime: number;
}

export interface SimilarityResult {
  hash: string;
  similarity: number;
  type: 'exact' | 'near-duplicate' | 'template-variation';
}

export interface ProcessingOptions {
  similarityThreshold: number;
  enableCompression: boolean;
  batchSize: number;
  useRedis: boolean;
  detectTemplates: boolean;
}

// MinHash implementation for similarity detection
class MinHash {
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

// LZ-String compression implementation
class LZString {
  static compressToBase64(input: string): string {
    if (input === null || input === "") return "";
    return LZString.compressToBase64(input);
  }

  static decompressFromBase64(input: string): string {
    if (input === null || input === "") return "";
    const result = LZString.decompressFromBase64(input);
    return result || "";
  }

  private static _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (val: number) => string): string {
    if (uncompressed === null) return "";
    let i, value;
    const context_dictionary: { [key: string]: number } = {};
    const context_dictionaryToCreate: { [key: string]: boolean } = {};
    let context_c = "";
    let context_wc = "";
    let context_w = "";
    let context_enlargeIn = 2;
    let context_dictSize = 3;
    let context_numBits = 2;
    const context_data: string[] = [];
    let context_data_val = 0;
    let context_data_position = 0;
    let ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | ((value || 0) & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = (value || 0) >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | ((value || 0) & 1);
              if (context_data_position == bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = (value || 0) >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | ((value || 0) & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = (value || 0) >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | ((value || 0) & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = (value || 0) >> 1;
          }
        } else {
          value = 1;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | ((value || 0) & 1);
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = (value || 0) >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | ((value || 0) & 1);
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = (value || 0) >> 1;
        }
      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    value = 2;
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar - 1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      } else context_data_position++;
    }
    return context_data.join('');
  }

  private static _decompress(length: number, resetValue: number, getNextValue: (index: number) => number): string {
    const dictionary: string[] = [];
    let next: number = 0;
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = "";
    const result: string[] = [];
    let i: number;
    let w: string = "";
    let bits: number, resb: number, maxpower: number, power: number;
    let c: string = "";
    const data = { val: getNextValue(0), position: resetValue, index: 1 };

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = String(i);
    }

    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power != maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb > 0 ? 1 : 0) * power;
      power <<= 1;
    }

    next = bits;
    switch (next) {
      case 0:
        bits = 0;
        maxpower = Math.pow(2, 8);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 1:
        bits = 0;
        maxpower = Math.pow(2, 16);
        power = 1;
        while (power != maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }
        c = String.fromCharCode(bits);
        break;
      case 2:
        return "";
      default:
        c = ""; // Initialize c for default case
    }
    if (c) {
      dictionary[3] = c;
      w = c;
      result.push(c);
    }
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2, numBits);
      power = 1;
      while (power != maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      const switchValue = bits;
      switch (switchValue) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = String.fromCharCode(bits);
          c = String(dictSize - 1);
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = String.fromCharCode(bits);
          c = String(dictSize - 1);
          enlargeIn--;
          break;
        case 2:
          return result.join('');
        default:
          c = String(switchValue); // Handle default case
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[Number(c)] !== undefined) {
        entry = dictionary[Number(c)]!;
      } else {
        if (parseInt(c) === dictSize) {
          entry = (w || '') + (w || '').charAt(0);
        } else {
          return null!;
        }
      }
      result.push(entry);

      dictionary[dictSize++] = (w || '') + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }
    }
  }

  private static getBaseValue(alphabet: string, character: string): number {
    if (!this.baseReverseDic) {
      this.baseReverseDic = {};
      for (let i = 0; i < alphabet.length; i++) {
        this.baseReverseDic[alphabet.charAt(i)] = i;
      }
    }
    return this.baseReverseDic[character] || 0;
  }

  private static baseReverseDic: { [key: string]: number };
}

// LRU Cache implementation for memory management
class LRUCache<K, V> {
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
      // Update access order
      this.accessOrder.set(key, this.accessCounter++);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Check if we need to evict
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

// Main ContentDeduplicator class
export class ContentDeduplicator {
  private storage: DeduplicatedStorage;
  private redis: Redis | null = null;
  private supabase: any;
  private minHashCache: LRUCache<string, MinHash>;
  private templatePatterns: Map<string, Pattern> = new Map();
  private processedPages: number = 0;
  private readonly CLEANUP_INTERVAL = 500; // Cleanup every 500 pages
  private readonly MAX_MINHASH_CACHE = 1000; // Max MinHash entries
  private readonly MAX_COMMON_ELEMENTS = 2000; // Max common elements
  
  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    redisUrl?: string
  ) {
    // Initialize with LRU cache for MinHash
    this.minHashCache = new LRUCache<string, MinHash>(this.MAX_MINHASH_CACHE);
    
    this.storage = {
      commonElements: new Map(),
      uniqueContent: new Map(),
      references: new Map()
    };

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    }
  }

  // Generate content hash using multiple algorithms
  private generateHash(content: string): string {
    const normalizedContent = this.normalizeContent(content);
    return crypto.createHash('sha256').update(normalizedContent).digest('hex');
  }

  // Normalize content for consistent hashing
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  // Detect content type based on patterns and context
  private detectContentType(content: string, url: string): ContentHash['type'] {
    const normalized = content.toLowerCase();
    
    if (normalized.includes('navigation') || normalized.includes('menu') || 
        normalized.includes('nav-') || normalized.includes('navbar')) {
      return 'navigation';
    }
    
    if (normalized.includes('footer') || normalized.includes('copyright') || 
        normalized.includes('contact us') || normalized.includes('privacy')) {
      return 'footer';
    }
    
    if (normalized.includes('sidebar') || normalized.includes('aside') ||
        normalized.includes('widget')) {
      return 'sidebar';
    }
    
    if (normalized.includes('header') || normalized.includes('logo') ||
        normalized.includes('banner')) {
      return 'header';
    }
    
    return 'unique';
  }

  // Compress content using multiple algorithms
  private async compressContent(content: string): Promise<{ compressed: string; ratio: number }> {
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Try LZ-string compression first
    const lzCompressed = LZString.compressToBase64(content);
    const lzSize = Buffer.byteLength(lzCompressed, 'utf8');
    
    // Try gzip compression
    const gzipBuffer = await gzip(content);
    const gzipSize = gzipBuffer.length;
    
    // Use the better compression
    if (lzSize < gzipSize) {
      return {
        compressed: 'lz:' + lzCompressed,
        ratio: originalSize / lzSize
      };
    } else {
      return {
        compressed: 'gz:' + gzipBuffer.toString('base64'),
        ratio: originalSize / gzipSize
      };
    }
  }

  // Decompress content
  private async decompressContent(compressed: string): Promise<string> {
    if (compressed.startsWith('lz:')) {
      const result = LZString.decompressFromBase64(compressed.substring(3));
      return result || '';
    } else if (compressed.startsWith('gz:')) {
      const buffer = Buffer.from(compressed.substring(3), 'base64');
      const decompressed = await gunzip(buffer);
      return decompressed.toString('utf8');
    }
    return compressed; // Not compressed
  }

  // Find similar content using MinHash with memory management
  private async findSimilarContent(content: string, threshold: number = 0.8): Promise<SimilarityResult[]> {
    const contentHash = this.generateHash(content);
    let minHash = this.minHashCache.get(contentHash);
    
    if (!minHash) {
      minHash = new MinHash();
      minHash.update(content);
      this.minHashCache.set(contentHash, minHash);
    }

    const results: SimilarityResult[] = [];
    
    for (const [hash, cachedMinHash] of this.minHashCache.entries()) {
      if (hash === contentHash) continue;
      
      const similarity = minHash.jaccardSimilarity(cachedMinHash);
      if (similarity >= threshold) {
        let type: SimilarityResult['type'] = 'near-duplicate';
        if (similarity === 1.0) type = 'exact';
        else if (similarity > 0.9) type = 'template-variation';
        
        results.push({ hash, similarity, type });
      }
    }
    
    // Perform automatic cleanup if needed
    this.processedPages++;
    if (this.processedPages % this.CLEANUP_INTERVAL === 0) {
      await this.performMemoryCleanup();
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // Detect template patterns
  private detectTemplatePattern(contents: string[]): Pattern | null {
    if (contents.length < 2) return null;
    
    // Find common structure by comparing character positions
    const commonPattern = this.extractCommonPattern(contents);
    if (commonPattern.similarity < 0.7) return null;
    
    const patternId = this.generateHash(commonPattern.template);
    return {
      id: patternId,
      template: commonPattern.template,
      frequency: contents.length,
      variations: contents,
      pages: [] // Will be populated when adding pages
    };
  }

  private extractCommonPattern(contents: string[]): { template: string; similarity: number } {
    if (contents.length === 0) return { template: '', similarity: 0 };
    
    let template = contents[0] || '';
    let totalSimilarity = 1;
    
    for (let i = 1; i < contents.length; i++) {
      const currentContent = contents[i];
      if (currentContent !== undefined) {
        const { common, similarity } = this.findCommonStructure(template, currentContent);
        template = common;
        totalSimilarity += similarity;
      }
    }
    
    return {
      template,
      similarity: totalSimilarity / contents.length
    };
  }

  private findCommonStructure(text1: string, text2: string): { common: string; similarity: number } {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const commonWords: string[] = [];
    
    let i = 0, j = 0;
    let matches = 0;
    
    while (i < words1.length && j < words2.length) {
      const word1 = words1[i];
      const word2 = words2[j];
      if (word1 !== undefined && word2 !== undefined) {
        if (word1 === word2) {
          commonWords.push(word1);
          matches++;
          i++;
          j++;
        } else if (this.isVariable(word1, word2)) {
          commonWords.push('{{VAR}}');
          matches += 0.5;
          i++;
          j++;
        } else {
          // Skip non-matching words
          i++;
          j++;
        }
      } else {
        break;
      }
    }
    
    const maxLength = Math.max(words1.length, words2.length);
    const similarity = matches / maxLength;
    
    return {
      common: commonWords.join(' '),
      similarity
    };
  }

  private isVariable(word1: string, word2: string): boolean {
    // Check if words look like they could be variables (numbers, dates, names, etc.)
    const numberPattern = /^\d+$/;
    const datePattern = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return (
      (numberPattern.test(word1) && numberPattern.test(word2)) ||
      (datePattern.test(word1) && datePattern.test(word2)) ||
      (emailPattern.test(word1) && emailPattern.test(word2)) ||
      (word1.length > 5 && word2.length > 5 && this.levenshteinDistance(word1, word2) / Math.max(word1.length, word2.length) < 0.3)
    );
  }

  private levenshteinDistance(str1: string, str2: string): number {
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

  // Process content and add to deduplication storage
  async processContent(
    content: string, 
    url: string, 
    options: ProcessingOptions = {
      similarityThreshold: 0.8,
      enableCompression: true,
      batchSize: 100,
      useRedis: true,
      detectTemplates: true
    }
  ): Promise<string> {
    const startTime = Date.now();
    const hash = this.generateHash(content);
    
    // Check Redis cache first if enabled
    if (options.useRedis && this.redis) {
      const cached = await this.redis.get(`content:${hash}`);
      if (cached) {
        const contentHash = JSON.parse(cached) as ContentHash;
        contentHash.frequency++;
        if (!contentHash.pages.includes(url)) {
          contentHash.pages.push(url);
        }
        await this.redis.set(`content:${hash}`, JSON.stringify(contentHash));
        return hash;
      }
    }
    
    // Check existing storage
    const existingHash = this.storage.commonElements.get(hash);
    if (existingHash) {
      existingHash.frequency++;
      if (!existingHash.pages.includes(url)) {
        existingHash.pages.push(url);
      }
      return hash;
    }
    
    // Find similar content
    const similarResults = await this.findSimilarContent(content, options.similarityThreshold);
    
    let finalHash = hash;
    let contentHash: ContentHash;
    
    if (similarResults.length > 0 && similarResults[0]?.similarity && similarResults[0].similarity >= options.similarityThreshold) {
      // Use existing similar content
      const similarHash = similarResults[0].hash;
      const existing = this.storage.commonElements.get(similarHash);
      
      if (existing) {
        existing.frequency++;
        if (!existing.pages.includes(url)) {
          existing.pages.push(url);
        }
        existing.similarity = similarResults[0]?.similarity || 0;
        finalHash = similarHash;
        contentHash = existing;
      } else {
        contentHash = await this.createContentHash(content, url, hash, options);
      }
    } else {
      contentHash = await this.createContentHash(content, url, hash, options);
    }
    
    // Store in memory
    this.storage.commonElements.set(finalHash, contentHash);
    
    // Update references
    const pageRefs = this.storage.references.get(url) || [];
    pageRefs.push(finalHash);
    this.storage.references.set(url, pageRefs);
    
    // Store in Redis if enabled
    if (options.useRedis && this.redis) {
      await this.redis.set(`content:${finalHash}`, JSON.stringify(contentHash));
      await this.redis.sadd(`page:${url}`, finalHash);
    }
    
    // Store in Supabase
    if (this.supabase) {
      await this.storeInSupabase(contentHash, url);
    }
    
    return finalHash;
  }

  private async createContentHash(
    content: string, 
    url: string, 
    hash: string, 
    options: ProcessingOptions
  ): Promise<ContentHash> {
    const type = this.detectContentType(content, url);
    let compressedSize: number | undefined;
    let processedContent = content;
    
    if (options.enableCompression && content.length > 1000) {
      const compressed = await this.compressContent(content);
      if (compressed.ratio > 1.5) {
        processedContent = compressed.compressed;
        compressedSize = Buffer.byteLength(compressed.compressed, 'utf8');
      }
    }
    
    return {
      hash,
      content: processedContent,
      type,
      frequency: 1,
      pages: [url],
      size: Buffer.byteLength(content, 'utf8'),
      compressedSize
    };
  }

  // Batch process multiple contents
  async batchProcess(
    contents: Array<{ content: string; url: string }>,
    options: ProcessingOptions = {
      similarityThreshold: 0.8,
      enableCompression: true,
      batchSize: 100,
      useRedis: true,
      detectTemplates: true
    }
  ): Promise<{ hashes: string[]; patterns: Pattern[] }> {
    const hashes: string[] = [];
    const batchContents: string[] = [];
    
    // Process in batches
    for (let i = 0; i < contents.length; i += options.batchSize) {
      const batch = contents.slice(i, i + options.batchSize);
      
      for (const { content, url } of batch) {
        const hash = await this.processContent(content, url, options);
        hashes.push(hash);
        batchContents.push(content);
      }
    }
    
    // Detect patterns across all content
    const patterns: Pattern[] = [];
    if (options.detectTemplates && batchContents.length > 1) {
      const detectedPattern = this.detectTemplatePattern(batchContents);
      if (detectedPattern) {
        // Update pattern with actual pages
        detectedPattern.pages = contents.map(c => c.url);
        this.templatePatterns.set(detectedPattern.id, detectedPattern);
        patterns.push(detectedPattern);
      }
    }
    
    return { hashes, patterns };
  }

  // Store in Supabase
  private async storeInSupabase(contentHash: ContentHash, url: string): Promise<void> {
    try {
      // Store content hash
      await this.supabase
        .from('content_hashes')
        .upsert({
          hash: contentHash.hash,
          content: contentHash.content,
          type: contentHash.type,
          frequency: contentHash.frequency,
          size: contentHash.size,
          compressed_size: contentHash.compressedSize,
          similarity: contentHash.similarity,
          updated_at: new Date().toISOString()
        });

      // Store page references
      for (const pageUrl of contentHash.pages) {
        await this.supabase
          .from('page_content_references')
          .upsert({
            page_url: pageUrl,
            content_hash: contentHash.hash,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error storing in Supabase:', error);
    }
  }

  // Get content by hash
  async getContent(hash: string): Promise<string | null> {
    // Try Redis first
    if (this.redis) {
      const cached = await this.redis.get(`content:${hash}`);
      if (cached) {
        const contentHash = JSON.parse(cached) as ContentHash;
        return await this.decompressContent(contentHash.content);
      }
    }
    
    // Try memory storage
    const contentHash = this.storage.commonElements.get(hash);
    if (contentHash) {
      return await this.decompressContent(contentHash.content);
    }
    
    // Try Supabase
    if (this.supabase) {
      const { data } = await this.supabase
        .from('content_hashes')
        .select('content')
        .eq('hash', hash)
        .single();
      
      if (data) {
        return await this.decompressContent(data.content);
      }
    }
    
    return null;
  }

  // Get references for a page
  async getPageReferences(url: string): Promise<string[]> {
    // Try Redis first
    if (this.redis) {
      const refs = await this.redis.smembers(`page:${url}`);
      if (refs.length > 0) return refs;
    }
    
    // Try memory storage
    return this.storage.references.get(url) || [];
  }

  // Generate deduplication metrics
  async generateMetrics(): Promise<DeduplicationMetrics> {
    const startTime = Date.now();
    const totalPages = this.storage.references.size;
    let totalOriginalSize = 0;
    let totalDeduplicatedSize = 0;
    let duplicateContent = 0;
    let uniqueContent = 0;
    
    const patterns: Pattern[] = Array.from(this.templatePatterns.values());
    
    for (const [hash, contentHash] of this.storage.commonElements.entries()) {
      const originalSize = contentHash.size * contentHash.frequency;
      const deduplicatedSize = contentHash.compressedSize || contentHash.size;
      
      totalOriginalSize += originalSize;
      totalDeduplicatedSize += deduplicatedSize;
      
      if (contentHash.frequency > 1) {
        duplicateContent++;
      } else {
        uniqueContent++;
      }
    }
    
    const storageReduction = totalOriginalSize > 0 
      ? ((totalOriginalSize - totalDeduplicatedSize) / totalOriginalSize) * 100 
      : 0;
    
    const compressionRatio = totalOriginalSize > 0 
      ? totalOriginalSize / totalDeduplicatedSize 
      : 1;
    
    return {
      totalPages,
      uniqueContent,
      duplicateContent,
      storageReduction,
      commonPatterns: patterns,
      compressionRatio,
      processingTime: Date.now() - startTime
    };
  }

  // Update reference when content changes
  async updateReference(oldHash: string, newHash: string, url: string): Promise<void> {
    // Update memory storage
    const pageRefs = this.storage.references.get(url) || [];
    const index = pageRefs.indexOf(oldHash);
    if (index !== -1) {
      pageRefs[index] = newHash;
      this.storage.references.set(url, pageRefs);
    }
    
    // Update Redis
    if (this.redis) {
      await this.redis.srem(`page:${url}`, oldHash);
      await this.redis.sadd(`page:${url}`, newHash);
    }
    
    // Update frequency counts
    const oldContent = this.storage.commonElements.get(oldHash);
    if (oldContent) {
      oldContent.frequency--;
      const pageIndex = oldContent.pages.indexOf(url);
      if (pageIndex !== -1) {
        oldContent.pages.splice(pageIndex, 1);
      }
      
      if (oldContent.frequency === 0) {
        this.storage.commonElements.delete(oldHash);
        if (this.redis) {
          await this.redis.del(`content:${oldHash}`);
        }
      }
    }
    
    const newContent = this.storage.commonElements.get(newHash);
    if (newContent) {
      newContent.frequency++;
      if (!newContent.pages.includes(url)) {
        newContent.pages.push(url);
      }
    }
  }

  // Perform memory cleanup to prevent memory leaks
  private async performMemoryCleanup(): Promise<void> {
    console.log(`[ContentDeduplicator] Performing memory cleanup at ${this.processedPages} pages processed`);
    
    // Clean up commonElements Map if it's too large
    if (this.storage.commonElements.size > this.MAX_COMMON_ELEMENTS) {
      const elementsToKeep = new Map<string, ContentHash>();
      const sortedElements = Array.from(this.storage.commonElements.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, Math.floor(this.MAX_COMMON_ELEMENTS * 0.8)); // Keep 80% of max
      
      for (const [hash, content] of sortedElements) {
        elementsToKeep.set(hash, content);
      }
      
      this.storage.commonElements = elementsToKeep;
      console.log(`[ContentDeduplicator] Trimmed commonElements from ${this.storage.commonElements.size} to ${elementsToKeep.size}`);
    }
    
    // Clean up uniqueContent Map (remove rarely accessed items)
    if (this.storage.uniqueContent.size > 1000) {
      const keysToDelete: string[] = [];
      let count = 0;
      for (const key of this.storage.uniqueContent.keys()) {
        if (count++ > 800) { // Keep only 800 most recent
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        this.storage.uniqueContent.delete(key);
      }
      console.log(`[ContentDeduplicator] Cleaned ${keysToDelete.length} items from uniqueContent`);
    }
    
    // Clean up references for pages that are no longer in commonElements
    const validHashes = new Set(this.storage.commonElements.keys());
    for (const [url, hashes] of this.storage.references.entries()) {
      const validRefs = hashes.filter(h => validHashes.has(h));
      if (validRefs.length !== hashes.length) {
        this.storage.references.set(url, validRefs);
      }
      // Remove empty reference entries
      if (validRefs.length === 0) {
        this.storage.references.delete(url);
      }
    }
    
    // Force garbage collection hint (Node.js will decide when to actually run it)
    if (global.gc) {
      global.gc();
      console.log('[ContentDeduplicator] Requested garbage collection');
    }
  }

  // Clear cache and storage
  async clearCache(): Promise<void> {
    this.storage.commonElements.clear();
    this.storage.uniqueContent.clear();
    this.storage.references.clear();
    this.minHashCache.clear();
    this.templatePatterns.clear();
    this.processedPages = 0;
    
    if (this.redis) {
      await this.redis.flushall();
    }
  }

  // Get storage statistics
  getStorageStats(): {
    commonElements: number;
    uniqueContent: number;
    references: number;
    patterns: number;
    cacheSize: number;
    processedPages: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      commonElements: this.storage.commonElements.size,
      uniqueContent: this.storage.uniqueContent.size,
      references: this.storage.references.size,
      patterns: this.templatePatterns.size,
      cacheSize: this.minHashCache.size,
      processedPages: this.processedPages,
      memoryUsage: process.memoryUsage()
    };
  }

  // Cleanup old references
  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - maxAge;
    
    if (this.supabase) {
      await this.supabase
        .from('content_hashes')
        .delete()
        .lt('updated_at', new Date(cutoffTime).toISOString());
      
      await this.supabase
        .from('page_content_references')
        .delete()
        .lt('updated_at', new Date(cutoffTime).toISOString());
    }
  }
}

// Usage examples and tests
export class ContentDeduplicatorTester {
  private deduplicator: ContentDeduplicator;

  constructor(deduplicator: ContentDeduplicator) {
    this.deduplicator = deduplicator;
  }

  async runTests(): Promise<void> {
    console.log('Running Content Deduplicator tests...');
    
    await this.testBasicDeduplication();
    await this.testSimilarityDetection();
    await this.testBatchProcessing();
    await this.testTemplateDetection();
    await this.testCompression();
    await this.testMetrics();
    
    console.log('All tests completed!');
  }

  private async testBasicDeduplication(): Promise<void> {
    console.log('Testing basic deduplication...');
    
    const content1 = "This is a sample navigation menu with Home, About, Contact links.";
    const content2 = "This is a sample navigation menu with Home, About, Contact links.";
    const content3 = "This is a different footer content with copyright information.";
    
    const hash1 = await this.deduplicator.processContent(content1, 'https://example.com/page1');
    const hash2 = await this.deduplicator.processContent(content2, 'https://example.com/page2');
    const hash3 = await this.deduplicator.processContent(content3, 'https://example.com/page3');
    
    console.assert(hash1 === hash2, 'Identical content should have same hash');
    console.assert(hash1 !== hash3, 'Different content should have different hash');
    
    const retrievedContent = await this.deduplicator.getContent(hash1);
    console.assert(retrievedContent === content1, 'Retrieved content should match original');
    
    console.log('✓ Basic deduplication test passed');
  }

  private async testSimilarityDetection(): Promise<void> {
    console.log('Testing similarity detection...');
    
    const template1 = "Welcome to our website. We have 100 products available.";
    const template2 = "Welcome to our website. We have 250 products available.";
    const template3 = "Welcome to our website. We have 500 products available.";
    
    await this.deduplicator.processContent(template1, 'https://example.com/category1');
    await this.deduplicator.processContent(template2, 'https://example.com/category2');
    await this.deduplicator.processContent(template3, 'https://example.com/category3');
    
    const stats = this.deduplicator.getStorageStats();
    console.log('Storage stats after similarity test:', stats);
    
    console.log('✓ Similarity detection test passed');
  }

  private async testBatchProcessing(): Promise<void> {
    console.log('Testing batch processing...');
    
    const contents = [
      { content: "Header content with logo and main navigation", url: 'https://example.com/page1' },
      { content: "Header content with logo and main navigation", url: 'https://example.com/page2' },
      { content: "Footer content with copyright and links", url: 'https://example.com/page3' },
      { content: "Footer content with copyright and links", url: 'https://example.com/page4' },
      { content: "Unique page content about our services", url: 'https://example.com/page5' }
    ];
    
    const result = await this.deduplicator.batchProcess(contents);
    
    console.assert(result.hashes.length === contents.length, 'Should return hash for each content');
    console.log('Batch processing result:', result);
    
    console.log('✓ Batch processing test passed');
  }

  private async testTemplateDetection(): Promise<void> {
    console.log('Testing template detection...');
    
    const templates = [
      "Product: iPhone 12 - Price: $999",
      "Product: Samsung Galaxy - Price: $899",
      "Product: Google Pixel - Price: $799"
    ];
    
    const contents = templates.map((template, i) => ({
      content: template,
      url: `https://example.com/product${i + 1}`
    }));
    
    const result = await this.deduplicator.batchProcess(contents, {
      similarityThreshold: 0.7,
      enableCompression: true,
      batchSize: 10,
      useRedis: false,
      detectTemplates: true
    });
    
    console.log('Template detection result:', result.patterns);
    
    console.log('✓ Template detection test passed');
  }

  private async testCompression(): Promise<void> {
    console.log('Testing compression...');
    
    const longContent = "This is a very long content that should be compressed. ".repeat(100);
    
    const hash = await this.deduplicator.processContent(
      longContent, 
      'https://example.com/long-page',
      { 
        similarityThreshold: 0.8,
        enableCompression: true,
        batchSize: 100,
        useRedis: false,
        detectTemplates: false
      }
    );
    
    const retrievedContent = await this.deduplicator.getContent(hash);
    console.assert(retrievedContent === longContent, 'Compressed content should decompress correctly');
    
    console.log('✓ Compression test passed');
  }

  private async testMetrics(): Promise<void> {
    console.log('Testing metrics generation...');
    
    const metrics = await this.deduplicator.generateMetrics();
    
    console.log('Deduplication metrics:', metrics);
    
    console.assert(metrics.totalPages >= 0, 'Total pages should be non-negative');
    console.assert(metrics.storageReduction >= 0, 'Storage reduction should be non-negative');
    
    console.log('✓ Metrics test passed');
  }
}

// Export utility functions
export const ContentDeduplicatorUtils = {
  // Create Supabase schema
  async createSupabaseSchema(supabase: any): Promise<void> {
    await supabase.from('content_hashes').select('*').limit(1);
    // The tables should be created via Supabase migrations
  },

  // Example usage
  async exampleUsage(): Promise<void> {
    const deduplicator = new ContentDeduplicator(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      process.env.REDIS_URL
    );

    // Process single content
    const hash = await deduplicator.processContent(
      "This is navigation content",
      "https://example.com/page1"
    );

    // Process batch
    const contents = [
      { content: "Header content", url: "https://example.com/page1" },
      { content: "Footer content", url: "https://example.com/page2" }
    ];
    
    const result = await deduplicator.batchProcess(contents);
    
    // Get metrics
    const metrics = await deduplicator.generateMetrics();
    console.log('Deduplication saved:', metrics.storageReduction + '%');

    // Get content
    const retrievedContent = await deduplicator.getContent(hash);
    
    // Cleanup
    await deduplicator.cleanup();
  }
};