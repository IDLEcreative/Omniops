/**
 * Job queue management for crawl operations
 * Extracted from redis-enhanced.ts for better modularity
 */

import type { ResilientRedisClient } from './redis-enhanced';
import type { JobData, HealthStatus } from './redis-enhanced-types';
import { MemoryManager } from './redis-enhanced-memory';

export class MemoryAwareCrawlJobManager {
  private redis: ResilientRedisClient;
  private memoryManager: MemoryManager;
  private readonly JOB_TTL = 3600; // 1 hour

  constructor(redis: ResilientRedisClient) {
    this.redis = redis;
    this.memoryManager = new MemoryManager(redis);
  }

  /**
   * Get the underlying Redis client
   */
  getRedisClient(): ResilientRedisClient {
    return this.redis;
  }

  /**
   * Create a new crawl job
   */
  async createJob(jobId: string, jobData: JobData): Promise<void> {
    const key = `crawl:job:${jobId}`;
    await this.redis.set(key, JSON.stringify(jobData), this.JOB_TTL);
  }

  /**
   * Check if job exists in Redis
   */
  async ensureJobExists(jobId: string): Promise<boolean> {
    const key = `crawl:job:${jobId}`;
    return await this.redis.exists(key);
  }

  /**
   * Update existing job with new data
   */
  async updateJob(jobId: string, updates: Partial<JobData>): Promise<void> {
    const key = `crawl:job:${jobId}`;
    const existing = await this.redis.get(key);

    if (!existing) {
      console.warn(`Job ${jobId} not found in Redis, skipping update`);
      return;
    }

    const jobData = JSON.parse(existing);
    const updated = { ...jobData, ...updates };
    await this.redis.set(key, JSON.stringify(updated), this.JOB_TTL);
  }

  /**
   * Get job data by ID
   */
  async getJob(jobId: string): Promise<JobData | null> {
    const key = `crawl:job:${jobId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete job and all related data
   */
  async deleteJob(jobId: string): Promise<void> {
    const key = `crawl:job:${jobId}`;
    await this.redis.del(key);
    await this.memoryManager.deleteJobData(jobId);
  }

  /**
   * Add result to job (delegates to memory manager)
   */
  async addJobResult(jobId: string, page: any): Promise<void> {
    return this.memoryManager.addJobResult(jobId, page);
  }

  /**
   * Get job results with pagination (delegates to memory manager)
   */
  async getJobResults(jobId: string, offset: number = 0, limit: number = 100): Promise<any[]> {
    return this.memoryManager.getJobResults(jobId, offset, limit);
  }

  /**
   * Get total result count (delegates to memory manager)
   */
  async getResultCount(jobId: string): Promise<number> {
    return this.memoryManager.getResultCount(jobId);
  }

  /**
   * Stream job results for large crawls (delegates to memory manager)
   */
  async* streamJobResults(jobId: string): AsyncGenerator<any, void, unknown> {
    yield* this.memoryManager.streamJobResults(jobId);
  }

  /**
   * Check content hash (delegates to memory manager)
   */
  async checkContentHash(hash: string): Promise<boolean> {
    return this.memoryManager.checkContentHash(hash);
  }

  /**
   * Save content hash (delegates to memory manager)
   */
  async saveContentHash(hash: string, url: string): Promise<void> {
    return this.memoryManager.saveContentHash(hash, url);
  }

  /**
   * Save page metadata (delegates to memory manager)
   */
  async savePageMetadata(url: string, metadata: { contentHash: string; lastModified?: string; lastCrawled: string }): Promise<void> {
    return this.memoryManager.savePageMetadata(url, metadata);
  }

  /**
   * Get page metadata (delegates to memory manager)
   */
  async getPageMetadata(url: string): Promise<any | null> {
    return this.memoryManager.getPageMetadata(url);
  }

  /**
   * Determine if page should be crawled (delegates to memory manager)
   */
  async shouldCrawlPage(url: string, sitemapLastMod?: string): Promise<boolean> {
    return this.memoryManager.shouldCrawlPage(url, sitemapLastMod);
  }

  /**
   * Check rate limit (delegates to memory manager)
   */
  async checkRateLimit(domain: string, limit: number = 10, window: number = 60): Promise<boolean> {
    return this.memoryManager.checkRateLimit(domain, limit, window);
  }

  /**
   * Get rate limit delay (delegates to memory manager)
   */
  async getRateLimitDelay(domain: string): Promise<number> {
    return this.memoryManager.getRateLimitDelay(domain);
  }

  /**
   * Update rate limit delay (delegates to memory manager)
   */
  async updateRateLimitDelay(domain: string, responseTime: number): Promise<void> {
    return this.memoryManager.updateRateLimitDelay(domain, responseTime);
  }

  /**
   * Get health status of Redis and job manager
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const status = this.redis.getStatus();

    return {
      redis: status.connected,
      fallbackActive: status.circuitBreakerOpen || status.fallbackSize > 0,
      jobCount: status.fallbackSize,
    };
  }
}
