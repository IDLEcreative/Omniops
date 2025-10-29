import { createServiceRoleClientSync } from '@/lib/supabase/server';
import Redis from 'ioredis';
import { LRUCache, MinHash } from './content-deduplicator-similarity';
import { detectTemplatePattern } from './content-deduplicator-utils';
import { DeduplicationStorage } from './content-deduplicator-storage';
import * as strategies from './content-deduplicator-strategies';
import type {
  ContentHash,
  DeduplicatedStorage,
  Pattern,
  DeduplicationMetrics,
  SimilarityResult,
  ProcessingOptions
} from './content-deduplicator-types';

// Re-export types for backwards compatibility
export type {
  ContentHash,
  DeduplicatedStorage,
  Pattern,
  DeduplicationMetrics,
  SimilarityResult,
  ProcessingOptions
};

export class ContentDeduplicator {
  private storage: DeduplicatedStorage;
  private storageManager: DeduplicationStorage;
  private minHashCache: LRUCache<string, MinHash>;
  private templatePatterns: Map<string, Pattern> = new Map();
  private processedPages: number = 0;
  private readonly CLEANUP_INTERVAL = 500;
  private readonly MAX_MINHASH_CACHE = 1000;
  private readonly MAX_COMMON_ELEMENTS = 2000;

  constructor(supabaseUrl?: string, supabaseKey?: string, redisUrl?: string) {
    this.minHashCache = new LRUCache<string, MinHash>(this.MAX_MINHASH_CACHE);
    this.storage = {
      commonElements: new Map(),
      uniqueContent: new Map(),
      references: new Map()
    };

    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
    const redis = redisUrl ? new Redis(redisUrl) : null;
    this.storageManager = new DeduplicationStorage(supabase, redis, this.storage);
  }

  private async findSimilarContent(content: string, threshold: number = 0.8) {
    const results = await strategies.findSimilarContent(content, this.minHashCache, threshold);
    this.processedPages++;
    if (this.processedPages % this.CLEANUP_INTERVAL === 0) {
      await strategies.performMemoryCleanup(this.storage, this.processedPages, this.MAX_COMMON_ELEMENTS);
    }
    return results;
  }

  async processContent(content: string, url: string, options: ProcessingOptions = {
    similarityThreshold: 0.8,
    enableCompression: true,
    batchSize: 100,
    useRedis: true,
    detectTemplates: true
  }): Promise<string> {
    const hash = strategies.generateHash(content);

    if (options.useRedis) {
      const cached = await this.storageManager.getFromRedis(hash);
      if (cached) {
        cached.frequency++;
        if (!cached.pages.includes(url)) {
          cached.pages.push(url);
        }
        await this.storageManager.storeInRedis(hash, cached, url);
        return hash;
      }
    }

    const existingHash = this.storageManager.getContentHash(hash);
    if (existingHash) {
      existingHash.frequency++;
      if (!existingHash.pages.includes(url)) {
        existingHash.pages.push(url);
      }
      return hash;
    }

    const similarResults = await this.findSimilarContent(content, options.similarityThreshold);

    let finalHash = hash;
    let contentHash: ContentHash;

    if (similarResults.length > 0 && similarResults[0]?.similarity && similarResults[0].similarity >= options.similarityThreshold) {
      const similarHash = similarResults[0].hash;
      const existing = this.storageManager.getContentHash(similarHash);

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

    this.storageManager.setContentHash(finalHash, contentHash);
    this.storageManager.addPageReference(url, finalHash);

    if (options.useRedis) {
      await this.storageManager.storeInRedis(finalHash, contentHash, url);
    }

    await this.storageManager.storeInSupabase(contentHash, url);
    return finalHash;
  }

  private async createContentHash(content: string, url: string, hash: string, options: ProcessingOptions): Promise<ContentHash> {
    const type = strategies.detectContentType(content, url);
    let compressedSize: number | undefined;
    let processedContent = content;

    if (options.enableCompression && content.length > 1000) {
      const compressed = await strategies.compressContent(content);
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

  async batchProcess(contents: Array<{ content: string; url: string }>, options: ProcessingOptions = {
    similarityThreshold: 0.8,
    enableCompression: true,
    batchSize: 100,
    useRedis: true,
    detectTemplates: true
  }): Promise<{ hashes: string[]; patterns: Pattern[] }> {
    const hashes: string[] = [];
    const batchContents: string[] = [];

    for (let i = 0; i < contents.length; i += options.batchSize) {
      const batch = contents.slice(i, i + options.batchSize);

      for (const { content, url } of batch) {
        const hash = await this.processContent(content, url, options);
        hashes.push(hash);
        batchContents.push(content);
      }
    }

    const patterns: Pattern[] = [];
    if (options.detectTemplates && batchContents.length > 1) {
      const detectedPattern = detectTemplatePattern(batchContents);
      if (detectedPattern) {
        detectedPattern.pages = contents.map(c => c.url);
        this.templatePatterns.set(detectedPattern.id, detectedPattern);
        patterns.push(detectedPattern);
      }
    }

    return { hashes, patterns };
  }

  async getContent(hash: string): Promise<string | null> {
    const cached = await this.storageManager.getFromRedis(hash);
    if (cached) {
      return await strategies.decompressContent(cached.content);
    }

    const contentHash = this.storageManager.getContentHash(hash);
    if (contentHash) {
      return await strategies.decompressContent(contentHash.content);
    }

    const supabaseContent = await this.storageManager.getFromSupabase(hash);
    if (supabaseContent) {
      return await strategies.decompressContent(supabaseContent);
    }

    return null;
  }

  async getPageReferences(url: string): Promise<string[]> {
    const redisRefs = await this.storageManager.getReferencesFromRedis(url);
    if (redisRefs.length > 0) return redisRefs;
    return this.storageManager.getPageReferences(url);
  }

  async generateMetrics(): Promise<DeduplicationMetrics> {
    const startTime = Date.now();
    const metrics = this.storageManager.calculateMetrics(this.templatePatterns);

    return {
      totalPages: metrics.totalPages,
      uniqueContent: metrics.uniqueContent,
      duplicateContent: metrics.duplicateContent,
      storageReduction: metrics.storageReduction,
      commonPatterns: metrics.patterns,
      compressionRatio: metrics.compressionRatio,
      processingTime: Date.now() - startTime
    };
  }

  async updateReference(oldHash: string, newHash: string, url: string): Promise<void> {
    await this.storageManager.handleReferenceUpdate(oldHash, newHash, url);
  }

  async clearCache(): Promise<void> {
    this.storageManager.clearMemoryStorage();
    this.minHashCache.clear();
    this.templatePatterns.clear();
    this.processedPages = 0;
    await this.storageManager.clearRedis();
  }

  getStorageStats(): {
    commonElements: number;
    uniqueContent: number;
    references: number;
    patterns: number;
    cacheSize: number;
    processedPages: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const storageSize = this.storageManager.getStorageSize();
    return {
      ...storageSize,
      patterns: this.templatePatterns.size,
      cacheSize: this.minHashCache.size,
      processedPages: this.processedPages,
      memoryUsage: process.memoryUsage()
    };
  }

  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.storageManager.cleanupOldData(maxAge);
  }
}

// Re-export utilities and tester
export { ContentDeduplicatorTester, ContentDeduplicatorUtils } from './content-deduplicator-utils';
