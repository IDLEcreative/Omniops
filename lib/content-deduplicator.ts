import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { LRUCache, MinHash } from './content-deduplicator-similarity';
import { detectTemplatePattern } from './content-deduplicator-utils';
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
  private redis: Redis | null = null;
  private supabase: any;
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

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    }
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

    const existingHash = this.storage.commonElements.get(hash);
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

    this.storage.commonElements.set(finalHash, contentHash);

    const pageRefs = this.storage.references.get(url) || [];
    pageRefs.push(finalHash);
    this.storage.references.set(url, pageRefs);

    if (options.useRedis && this.redis) {
      await this.redis.set(`content:${finalHash}`, JSON.stringify(contentHash));
      await this.redis.sadd(`page:${url}`, finalHash);
    }

    if (this.supabase) {
      await this.storeInSupabase(contentHash, url);
    }

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

  private async storeInSupabase(contentHash: ContentHash, url: string): Promise<void> {
    try {
      await this.supabase.from('content_hashes').upsert({
        hash: contentHash.hash,
        content: contentHash.content,
        type: contentHash.type,
        frequency: contentHash.frequency,
        size: contentHash.size,
        compressed_size: contentHash.compressedSize,
        similarity: contentHash.similarity,
        updated_at: new Date().toISOString()
      });

      for (const pageUrl of contentHash.pages) {
        await this.supabase.from('page_content_references').upsert({
          page_url: pageUrl,
          content_hash: contentHash.hash,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error storing in Supabase:', error);
    }
  }

  async getContent(hash: string): Promise<string | null> {
    if (this.redis) {
      const cached = await this.redis.get(`content:${hash}`);
      if (cached) {
        const contentHash = JSON.parse(cached) as ContentHash;
        return await strategies.decompressContent(contentHash.content);
      }
    }

    const contentHash = this.storage.commonElements.get(hash);
    if (contentHash) {
      return await strategies.decompressContent(contentHash.content);
    }

    if (this.supabase) {
      const { data } = await this.supabase.from('content_hashes').select('content').eq('hash', hash).single();
      if (data) {
        return await strategies.decompressContent(data.content);
      }
    }

    return null;
  }

  async getPageReferences(url: string): Promise<string[]> {
    if (this.redis) {
      const refs = await this.redis.smembers(`page:${url}`);
      if (refs.length > 0) return refs;
    }
    return this.storage.references.get(url) || [];
  }

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

  async updateReference(oldHash: string, newHash: string, url: string): Promise<void> {
    const pageRefs = this.storage.references.get(url) || [];
    const index = pageRefs.indexOf(oldHash);
    if (index !== -1) {
      pageRefs[index] = newHash;
      this.storage.references.set(url, pageRefs);
    }

    if (this.redis) {
      await this.redis.srem(`page:${url}`, oldHash);
      await this.redis.sadd(`page:${url}`, newHash);
    }

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

  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - maxAge;

    if (this.supabase) {
      await this.supabase.from('content_hashes').delete().lt('updated_at', new Date(cutoffTime).toISOString());
      await this.supabase.from('page_content_references').delete().lt('updated_at', new Date(cutoffTime).toISOString());
    }
  }
}

// Re-export utilities and tester
export { ContentDeduplicatorTester, ContentDeduplicatorUtils } from './content-deduplicator-utils';
