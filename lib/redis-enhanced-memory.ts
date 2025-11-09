/**
 * Memory-efficient result storage and archiving for Redis
 * Extracted from redis-enhanced.ts for better modularity
 */

import type { IResilientRedisClient, PageMetadata } from './redis-enhanced-types';

export class MemoryManager {
  private readonly RESULT_TTL = 86400; // 24 hours
  private readonly MAX_RESULTS_IN_MEMORY = 1000;
  private readonly BATCH_SIZE = 100;

  constructor(private redis: IResilientRedisClient) {}

  /**
   * Add job result with memory management
   */
  async addJobResult(jobId: string, page: any): Promise<void> {
    const key = `crawl:results:${jobId}`;

    // Check current result count
    const currentCount = await this.getResultCount(jobId);

    // If approaching memory limits, archive current results
    if (currentCount >= this.MAX_RESULTS_IN_MEMORY) {
      await this.archiveResults(jobId, currentCount);
    }

    await this.redis.rpush(key, JSON.stringify(page));
    await this.redis.expire(key, this.RESULT_TTL);
  }

  /**
   * Get job results with pagination for memory efficiency
   */
  async getJobResults(jobId: string, offset: number = 0, limit: number = 100): Promise<any[]> {
    const key = `crawl:results:${jobId}`;
    const results = await this.redis.lrange(key, offset, offset + limit - 1);
    return results.map(r => JSON.parse(r));
  }

  /**
   * Get total result count
   */
  async getResultCount(jobId: string): Promise<number> {
    const counts = await Promise.all([
      this.redis.get(`crawl:results:${jobId}:count`),
      this.redis.exists(`crawl:results:${jobId}`),
    ]);

    const archivedCount = counts[0] ? parseInt(counts[0]) : 0;
    const currentExists = counts[1];

    if (!currentExists) {
      return archivedCount;
    }

    const current = await this.redis.lrange(`crawl:results:${jobId}`, 0, -1);
    return archivedCount + current.length;
  }

  /**
   * Archive results to prevent memory issues
   */
  private async archiveResults(jobId: string, startIndex: number): Promise<void> {
    const sourceKey = `crawl:results:${jobId}`;
    const archiveKey = `crawl:archive:${jobId}:${startIndex}`;

    const results = await this.redis.lrange(sourceKey, 0, -1);
    if (results.length > 0) {
      await this.redis.set(archiveKey, JSON.stringify(results), this.RESULT_TTL);
      await this.redis.del(sourceKey);
      await this.redis.set(`crawl:results:${jobId}:count`, startIndex.toString());
    }
  }

  /**
   * Stream results for very large crawls
   */
  async* streamJobResults(jobId: string): AsyncGenerator<any, void, unknown> {
    let offset = 0;
    const batchSize = this.BATCH_SIZE;

    while (true) {
      const batch = await this.getJobResults(jobId, offset, batchSize);
      if (batch.length === 0) break;

      for (const result of batch) {
        yield result;
      }

      offset += batchSize;

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Delete all job-related data
   */
  async deleteJobData(jobId: string): Promise<void> {
    const keys = [
      `crawl:results:${jobId}`,
      `crawl:results:${jobId}:count`,
    ];

    // Check for archived results
    for (let i = 0; i < 10; i++) {
      keys.push(`crawl:archive:${jobId}:${i * this.MAX_RESULTS_IN_MEMORY}`);
    }

    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  /**
   * Content deduplication with memory-efficient storage
   */
  async checkContentHash(hash: string): Promise<boolean> {
    const key = `content:hash:${hash}`;
    return await this.redis.exists(key);
  }

  /**
   * Save content hash
   */
  async saveContentHash(hash: string, url: string): Promise<void> {
    const key = `content:hash:${hash}`;
    await this.redis.set(key, url, 86400); // 24 hour TTL
  }

  /**
   * Save page metadata for change detection
   */
  async savePageMetadata(url: string, metadata: PageMetadata): Promise<void> {
    const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
    await this.redis.set(key, JSON.stringify(metadata), 30 * 24 * 60 * 60); // 30 days
  }

  /**
   * Get page metadata
   */
  async getPageMetadata(url: string): Promise<PageMetadata | null> {
    const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Determine if page should be crawled based on metadata
   */
  async shouldCrawlPage(url: string, sitemapLastMod?: string): Promise<boolean> {
    const metadata = await this.getPageMetadata(url);

    // If never crawled, should crawl
    if (!metadata) {
      return true;
    }

    // If sitemap has lastmod date, check if page was modified
    if (sitemapLastMod) {
      const lastModDate = new Date(sitemapLastMod);
      const lastCrawledDate = new Date(metadata.lastCrawled);

      if (lastModDate > lastCrawledDate) {
        return true;
      }
    }

    // If no sitemap date, check if it's been more than 24 hours
    const lastCrawledDate = new Date(metadata.lastCrawled);
    const now = new Date();
    const hoursSinceLastCrawl = (now.getTime() - lastCrawledDate.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastCrawl > 24;
  }

  /**
   * Rate limiting with circuit breaker awareness
   */
  async checkRateLimit(domain: string, limit: number = 10, window: number = 60): Promise<boolean> {
    const key = `rate:${domain}`;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, window);
      }

      return current <= limit;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  /**
   * Get rate limit delay
   */
  async getRateLimitDelay(domain: string): Promise<number> {
    const key = `rate:delay:${domain}`;
    const delay = await this.redis.get(key);
    return delay ? parseInt(delay) : 1000;
  }

  /**
   * Update rate limit delay based on response time
   */
  async updateRateLimitDelay(domain: string, responseTime: number): Promise<void> {
    const key = `rate:delay:${domain}`;
    const newDelay = responseTime > 2000 ? Math.min(responseTime * 1.5, 5000) : 1000;
    await this.redis.set(key, Math.round(newDelay).toString(), 300); // 5 min TTL
  }
}
