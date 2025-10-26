// Storage operations for content deduplication (Supabase, Redis, references)
import Redis from 'ioredis';
import type { ContentHash, DeduplicatedStorage } from './content-deduplicator-types';

export class DeduplicationStorage {
  constructor(
    private supabase: any,
    private redis: Redis | null,
    private storage: DeduplicatedStorage
  ) {}

  async storeInSupabase(contentHash: ContentHash, url: string): Promise<void> {
    if (!this.supabase) return;

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

  async getFromSupabase(hash: string): Promise<string | null> {
    if (!this.supabase) return null;

    const { data } = await this.supabase.from('content_hashes').select('content').eq('hash', hash).single();
    return data?.content || null;
  }

  async storeInRedis(hash: string, contentHash: ContentHash, url: string): Promise<void> {
    if (!this.redis) return;

    await this.redis.set(`content:${hash}`, JSON.stringify(contentHash));
    await this.redis.sadd(`page:${url}`, hash);
  }

  async getFromRedis(hash: string): Promise<ContentHash | null> {
    if (!this.redis) return null;

    const cached = await this.redis.get(`content:${hash}`);
    return cached ? JSON.parse(cached) as ContentHash : null;
  }

  async getReferencesFromRedis(url: string): Promise<string[]> {
    if (!this.redis) return [];

    const refs = await this.redis.smembers(`page:${url}`);
    return refs.length > 0 ? refs : [];
  }

  async updateReferenceInRedis(url: string, oldHash: string, newHash: string): Promise<void> {
    if (!this.redis) return;

    await this.redis.srem(`page:${url}`, oldHash);
    await this.redis.sadd(`page:${url}`, newHash);
  }

  async deleteFromRedis(hash: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(`content:${hash}`);
  }

  getPageReferences(url: string): string[] {
    return this.storage.references.get(url) || [];
  }

  addPageReference(url: string, hash: string): void {
    const pageRefs = this.storage.references.get(url) || [];
    pageRefs.push(hash);
    this.storage.references.set(url, pageRefs);
  }

  updateReference(oldHash: string, newHash: string, url: string): void {
    const pageRefs = this.storage.references.get(url) || [];
    const index = pageRefs.indexOf(oldHash);
    if (index !== -1) {
      pageRefs[index] = newHash;
      this.storage.references.set(url, pageRefs);
    }
  }

  clearMemoryStorage(): void {
    this.storage.commonElements.clear();
    this.storage.uniqueContent.clear();
    this.storage.references.clear();
  }

  async clearRedis(): Promise<void> {
    if (this.redis) {
      await this.redis.flushall();
    }
  }

  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.supabase) return;

    const cutoffTime = Date.now() - maxAge;
    await this.supabase.from('content_hashes').delete().lt('updated_at', new Date(cutoffTime).toISOString());
    await this.supabase.from('page_content_references').delete().lt('updated_at', new Date(cutoffTime).toISOString());
  }

  getContentHash(hash: string): ContentHash | undefined {
    return this.storage.commonElements.get(hash);
  }

  setContentHash(hash: string, contentHash: ContentHash): void {
    this.storage.commonElements.set(hash, contentHash);
  }

  deleteContentHash(hash: string): void {
    this.storage.commonElements.delete(hash);
  }

  getStorageSize(): {
    commonElements: number;
    uniqueContent: number;
    references: number;
  } {
    return {
      commonElements: this.storage.commonElements.size,
      uniqueContent: this.storage.uniqueContent.size,
      references: this.storage.references.size
    };
  }

  async handleReferenceUpdate(oldHash: string, newHash: string, url: string): Promise<void> {
    this.updateReference(oldHash, newHash, url);
    await this.updateReferenceInRedis(url, oldHash, newHash);

    const oldContent = this.getContentHash(oldHash);
    if (oldContent) {
      oldContent.frequency--;
      const pageIndex = oldContent.pages.indexOf(url);
      if (pageIndex !== -1) {
        oldContent.pages.splice(pageIndex, 1);
      }

      if (oldContent.frequency === 0) {
        this.deleteContentHash(oldHash);
        await this.deleteFromRedis(oldHash);
      }
    }

    const newContent = this.getContentHash(newHash);
    if (newContent) {
      newContent.frequency++;
      if (!newContent.pages.includes(url)) {
        newContent.pages.push(url);
      }
    }
  }

  calculateMetrics(patterns: Map<string, any>): {
    totalPages: number;
    totalOriginalSize: number;
    totalDeduplicatedSize: number;
    duplicateContent: number;
    uniqueContent: number;
    storageReduction: number;
    compressionRatio: number;
    patterns: any[];
  } {
    const totalPages = this.storage.references.size;
    let totalOriginalSize = 0;
    let totalDeduplicatedSize = 0;
    let duplicateContent = 0;
    let uniqueContent = 0;

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
      totalOriginalSize,
      totalDeduplicatedSize,
      duplicateContent,
      uniqueContent,
      storageReduction,
      compressionRatio,
      patterns: Array.from(patterns.values())
    };
  }
}
