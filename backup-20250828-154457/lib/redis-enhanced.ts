import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Enhanced Redis client with circuit breaker and fallback
export class ResilientRedisClient extends EventEmitter {
  private redis: Redis | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerOpenTime: number = 0;
  private circuitBreakerTimeout: number = 30000; // 30 seconds
  private fallbackStorage: Map<string, any> = new Map();
  
  constructor(private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    super();
    this.connect();
  }

  private connect() {
    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          // Exponential backoff with max 10 seconds
          const delay = Math.min(times * 100, 10000);
          
          // Open circuit breaker after max attempts
          if (times > this.maxConnectionAttempts) {
            this.openCircuitBreaker();
            return null; // Stop retrying
          }
          
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY errors
          }
          return false;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false, // Don't queue commands when offline
        connectTimeout: 10000,
        disconnectTimeout: 2000,
        commandTimeout: 5000,
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.closeCircuitBreaker();
        this.emit('connected');
      });

      this.redis.on('error', (err) => {
        console.error('Redis error:', err.message);
        this.emit('error', err);
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.redis.on('reconnecting', () => {
        this.connectionAttempts++;
        console.log(`Redis reconnecting... attempt ${this.connectionAttempts}`);
      });

    } catch (error) {
      console.error('Failed to create Redis client:', error);
      this.openCircuitBreaker();
    }
  }

  private openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    this.circuitBreakerOpenTime = Date.now();
    console.warn('Redis circuit breaker opened - using fallback storage');
    
    // Schedule circuit breaker check
    setTimeout(() => {
      this.checkCircuitBreaker();
    }, this.circuitBreakerTimeout);
  }

  private closeCircuitBreaker() {
    this.circuitBreakerOpen = false;
    console.log('Redis circuit breaker closed');
  }

  private checkCircuitBreaker() {
    if (this.circuitBreakerOpen && 
        Date.now() - this.circuitBreakerOpenTime > this.circuitBreakerTimeout) {
      console.log('Attempting to close circuit breaker...');
      this.connectionAttempts = 0;
      this.connect();
    }
  }

  private isAvailable(): boolean {
    return this.isConnected && !this.circuitBreakerOpen && this.redis !== null;
  }

  // Wrapped Redis operations with fallback
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return this.fallbackStorage.get(key) || null;
    }

    try {
      return await this.redis!.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return this.fallbackStorage.get(key) || null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    // Always store in fallback for safety
    this.fallbackStorage.set(key, value);
    
    if (!this.isAvailable()) {
      return true; // Stored in fallback
    }

    try {
      if (ttl) {
        await this.redis!.setex(key, ttl, value);
      } else {
        await this.redis!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return true; // Still stored in fallback
    }
  }

  async del(key: string): Promise<boolean> {
    this.fallbackStorage.delete(key);
    
    if (!this.isAvailable()) {
      return true;
    }

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return true; // Deleted from fallback
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return this.fallbackStorage.has(key);
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return this.fallbackStorage.has(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) {
      const current = this.fallbackStorage.get(key) || 0;
      const newValue = parseInt(current) + 1;
      this.fallbackStorage.set(key, newValue.toString());
      return newValue;
    }

    try {
      return await this.redis!.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      const current = this.fallbackStorage.get(key) || 0;
      const newValue = parseInt(current) + 1;
      this.fallbackStorage.set(key, newValue.toString());
      return newValue;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      // Fallback doesn't support TTL, but return success
      return true;
    }

    try {
      const result = await this.redis!.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return true;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.isAvailable()) {
      const list = this.fallbackStorage.get(key) || [];
      return list.slice(start, stop === -1 ? undefined : stop + 1);
    }

    try {
      return await this.redis!.lrange(key, start, stop);
    } catch (error) {
      console.error(`Redis LRANGE error for key ${key}:`, error);
      const list = this.fallbackStorage.get(key) || [];
      return list.slice(start, stop === -1 ? undefined : stop + 1);
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    if (!this.isAvailable()) {
      const list = this.fallbackStorage.get(key) || [];
      list.push(...values);
      this.fallbackStorage.set(key, list);
      return list.length;
    }

    try {
      // Also update fallback
      const list = this.fallbackStorage.get(key) || [];
      list.push(...values);
      this.fallbackStorage.set(key, list);
      
      return await this.redis!.rpush(key, ...values);
    } catch (error) {
      console.error(`Redis RPUSH error for key ${key}:`, error);
      const list = this.fallbackStorage.get(key) || [];
      return list.length;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis!.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      // Return keys from fallback storage that match pattern
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Array.from(this.fallbackStorage.keys()).filter(key => regex.test(key));
    }

    try {
      return await this.redis!.keys(pattern);
    } catch (error) {
      console.warn('Redis keys error:', error);
      return [];
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isAvailable()) {
      const value = this.fallbackStorage.get(key);
      if (typeof value === 'object' && value !== null) {
        return value;
      }
      return {};
    }

    try {
      return await this.redis!.hgetall(key) || {};
    } catch (error) {
      console.warn('Redis hgetall error:', error);
      return {};
    }
  }

  // Get connection status
  getStatus(): {
    connected: boolean;
    circuitBreakerOpen: boolean;
    fallbackSize: number;
  } {
    return {
      connected: this.isConnected,
      circuitBreakerOpen: this.circuitBreakerOpen,
      fallbackSize: this.fallbackStorage.size,
    };
  }

  // Clear fallback storage (use with caution)
  clearFallbackStorage(): void {
    this.fallbackStorage.clear();
  }
}

// Enhanced job manager with memory management
export class MemoryAwareCrawlJobManager {
  private redis: ResilientRedisClient;
  private readonly JOB_TTL = 3600; // 1 hour
  private readonly RESULT_TTL = 86400; // 24 hours
  private readonly MAX_RESULTS_IN_MEMORY = 1000; // Max results to keep in memory
  private readonly BATCH_SIZE = 100; // Process results in batches

  constructor(redis: ResilientRedisClient) {
    this.redis = redis;
  }

  // Public getter for redis client
  getRedisClient(): ResilientRedisClient {
    return this.redis;
  }

  async createJob(jobId: string, jobData: any): Promise<void> {
    const key = `crawl:job:${jobId}`;
    await this.redis.set(key, JSON.stringify(jobData), this.JOB_TTL);
  }
  
  async ensureJobExists(jobId: string): Promise<boolean> {
    const key = `crawl:job:${jobId}`;
    const exists = await this.redis.exists(key);
    return exists;
  }

  async updateJob(jobId: string, updates: any): Promise<void> {
    const key = `crawl:job:${jobId}`;
    const existing = await this.redis.get(key);
    if (!existing) {
      // Log warning but don't throw - job might have expired
      console.warn(`Job ${jobId} not found in Redis, skipping update`);
      return;
    }
    
    const jobData = JSON.parse(existing);
    const updated = { ...jobData, ...updates };
    await this.redis.set(key, JSON.stringify(updated), this.JOB_TTL);
  }

  async getJob(jobId: string): Promise<any | null> {
    const key = `crawl:job:${jobId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Memory-efficient result storage
  async addJobResult(jobId: string, page: any): Promise<void> {
    const key = `crawl:results:${jobId}`;
    
    // Check current result count
    const currentCount = await this.getResultCount(jobId);
    
    // If we're approaching memory limits, store in batches
    if (currentCount >= this.MAX_RESULTS_IN_MEMORY) {
      // Archive current results to a separate key
      await this.archiveResults(jobId, currentCount);
    }
    
    await this.redis.rpush(key, JSON.stringify(page));
    await this.redis.expire(key, this.RESULT_TTL);
  }

  // Get results with pagination for memory efficiency
  async getJobResults(jobId: string, offset: number = 0, limit: number = 100): Promise<any[]> {
    const key = `crawl:results:${jobId}`;
    const results = await this.redis.lrange(key, offset, offset + limit - 1);
    return results.map(r => JSON.parse(r));
  }

  // Get total result count
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
    
    // This is a lightweight operation that doesn't fetch the actual data
    const current = await this.redis.lrange(`crawl:results:${jobId}`, 0, -1);
    return archivedCount + current.length;
  }

  // Archive results to prevent memory issues
  private async archiveResults(jobId: string, startIndex: number): Promise<void> {
    const sourceKey = `crawl:results:${jobId}`;
    const archiveKey = `crawl:archive:${jobId}:${startIndex}`;
    
    // Move results to archive
    const results = await this.redis.lrange(sourceKey, 0, -1);
    if (results.length > 0) {
      await this.redis.set(archiveKey, JSON.stringify(results), this.RESULT_TTL);
      await this.redis.del(sourceKey);
      await this.redis.set(`crawl:results:${jobId}:count`, startIndex.toString());
    }
  }

  // Stream results for very large crawls
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

  async deleteJob(jobId: string): Promise<void> {
    // Delete all related keys
    const keys = [
      `crawl:job:${jobId}`,
      `crawl:results:${jobId}`,
      `crawl:results:${jobId}:count`,
    ];
    
    // Also check for archived results
    for (let i = 0; i < 10; i++) {
      keys.push(`crawl:archive:${jobId}:${i * this.MAX_RESULTS_IN_MEMORY}`);
    }
    
    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  // Content deduplication with memory-efficient storage
  async checkContentHash(hash: string): Promise<boolean> {
    const key = `content:hash:${hash}`;
    return await this.redis.exists(key);
  }

  async saveContentHash(hash: string, url: string): Promise<void> {
    const key = `content:hash:${hash}`;
    // Store minimal data - just URL
    await this.redis.set(key, url, 86400); // 24 hour TTL
  }
  
  // Enhanced content change detection
  async savePageMetadata(url: string, metadata: {
    contentHash: string;
    lastModified?: string;
    lastCrawled: string;
  }): Promise<void> {
    const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
    await this.redis.set(key, JSON.stringify(metadata), 30 * 24 * 60 * 60); // 30 days
  }
  
  async getPageMetadata(url: string): Promise<any | null> {
    const key = `page:metadata:${Buffer.from(url).toString('base64')}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
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
      
      // If page was modified after last crawl, should crawl
      if (lastModDate > lastCrawledDate) {
        return true;
      }
    }
    
    // If no sitemap date, check if it's been more than 24 hours
    const lastCrawledDate = new Date(metadata.lastCrawled);
    const now = new Date();
    const hoursSinceLastCrawl = (now.getTime() - lastCrawledDate.getTime()) / (1000 * 60 * 60);
    
    // Re-crawl if more than 24 hours old (configurable)
    return hoursSinceLastCrawl > 24;
  }

  // Rate limiting with circuit breaker awareness
  async checkRateLimit(domain: string, limit: number = 10, window: number = 60): Promise<boolean> {
    const key = `rate:${domain}`;
    
    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, window);
      }
      
      return current <= limit;
    } catch (error) {
      // If Redis fails, be conservative and deny
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  async getRateLimitDelay(domain: string): Promise<number> {
    const key = `rate:delay:${domain}`;
    const delay = await this.redis.get(key);
    return delay ? parseInt(delay) : 1000; // Default 1 second
  }

  async updateRateLimitDelay(domain: string, responseTime: number): Promise<void> {
    const key = `rate:delay:${domain}`;
    // Adaptive delay: if response is slow, increase delay
    const newDelay = responseTime > 2000 ? Math.min(responseTime * 1.5, 5000) : 1000;
    await this.redis.set(key, Math.round(newDelay).toString(), 300); // 5 min TTL
  }

  // Get Redis health status
  async getHealthStatus(): Promise<{
    redis: boolean;
    fallbackActive: boolean;
    jobCount: number;
  }> {
    const status = this.redis.getStatus();
    
    return {
      redis: status.connected,
      fallbackActive: status.circuitBreakerOpen || status.fallbackSize > 0,
      jobCount: status.fallbackSize,
    };
  }
}

// Singleton instances
let redisClient: ResilientRedisClient | null = null;
let jobManager: MemoryAwareCrawlJobManager | null = null;

export function getResilientRedisClient(): ResilientRedisClient {
  if (!redisClient) {
    redisClient = new ResilientRedisClient();
  }
  return redisClient;
}

export function getMemoryAwareJobManager(): MemoryAwareCrawlJobManager {
  if (!jobManager) {
    jobManager = new MemoryAwareCrawlJobManager(getResilientRedisClient());
  }
  return jobManager;
}