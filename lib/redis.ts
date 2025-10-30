import Redis from 'ioredis';
import { getRedisClientWithFallback, RedisClientWithFallback } from './redis-fallback';
import { logger } from './logger';

// Detect build time to suppress connection errors
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NEXT_PHASE === 'phase-export' ||
                    process.argv.includes('build');

// Create Redis client with connection retry logic (legacy function for compatibility)
export function createRedisClient(): Redis | RedisClientWithFallback {
  const redisUrl = process.env.REDIS_URL;

  // If no Redis URL, return the fallback client
  if (!redisUrl) {
    if (!isBuildTime) {
      logger.info('[Redis] No REDIS_URL configured, using fallback client');
    }
    return getRedisClientWithFallback();
  }

  try {
    const redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        if (times > 3) {
          if (!isBuildTime) {
            logger.warn('[Redis] Connection failed, using fallback');
          }
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: isBuildTime,
    });

    redis.on('error', (err) => {
      if (!isBuildTime) {
        console.error('[Redis] Connection error:', err);
      }
    });

    redis.on('connect', () => {
      if (!isBuildTime) {
        console.log('[Redis] Connected successfully');
      }
    });

    return redis;
  } catch (error) {
    if (!isBuildTime) {
      logger.error('[Redis] Failed to create client, using fallback:', error);
    }
    return getRedisClientWithFallback();
  }
}

// Helper functions for job management
export class CrawlJobManager {
  private redis: Redis | RedisClientWithFallback;
  private readonly JOB_TTL = 3600; // 1 hour TTL for jobs
  private readonly RESULT_TTL = 86400; // 24 hour TTL for results

  constructor(redis: Redis | RedisClientWithFallback) {
    this.redis = redis;
  }

  async createJob(jobId: string, jobData: any): Promise<void> {
    const key = `crawl:job:${jobId}`;
    await this.redis.setex(key, this.JOB_TTL, JSON.stringify(jobData));
  }

  async updateJob(jobId: string, updates: any): Promise<void> {
    const key = `crawl:job:${jobId}`;
    const existing = await this.redis.get(key);
    if (!existing) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    const jobData = JSON.parse(existing);
    const updated = { ...jobData, ...updates };
    await this.redis.setex(key, this.JOB_TTL, JSON.stringify(updated));
  }

  async getJob(jobId: string): Promise<any | null> {
    const key = `crawl:job:${jobId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async addJobResult(jobId: string, page: any): Promise<void> {
    const key = `crawl:results:${jobId}`;
    await this.redis.rpush(key, JSON.stringify(page));
    await this.redis.expire(key, this.RESULT_TTL);
  }

  async getJobResults(jobId: string): Promise<any[]> {
    const key = `crawl:results:${jobId}`;
    const results = await this.redis.lrange(key, 0, -1);
    return results.map(r => JSON.parse(r));
  }

  async deleteJob(jobId: string): Promise<void> {
    await this.redis.del(`crawl:job:${jobId}`, `crawl:results:${jobId}`);
  }

  // Content deduplication
  async checkContentHash(hash: string): Promise<boolean> {
    const key = `content:hash:${hash}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async saveContentHash(hash: string, url: string): Promise<void> {
    const key = `content:hash:${hash}`;
    await this.redis.setex(key, 86400, url); // 24 hour TTL
  }

  // Rate limiting
  async checkRateLimit(domain: string, limit: number = 10, window: number = 60): Promise<boolean> {
    const key = `rate:${domain}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
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
    await this.redis.setex(key, 300, Math.round(newDelay).toString()); // 5 min TTL
  }
}

// Singleton instance
let redisClient: Redis | RedisClientWithFallback | null = null;
let jobManager: CrawlJobManager | null = null;

export function getRedisClient(): Redis | RedisClientWithFallback {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function getJobManager(): CrawlJobManager {
  if (!jobManager) {
    jobManager = new CrawlJobManager(getRedisClient());
  }
  return jobManager;
}