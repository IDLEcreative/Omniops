/**
 * Scrape Queue Management System
 * Handles job creation, deduplication, and queue management for web scraping operations
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logger';

/**
 * Job data structure for scraping operations
 */
export interface ScrapeJobData {
  url: string;
  organizationId: string;
  domainId?: string;
  maxPages?: number;
  includePaths?: string[];
  excludePaths?: string[];
  turboMode?: boolean;
  ownSite?: boolean;
  useNewConfig?: boolean;
  newConfigPreset?: string;
  aiOptimization?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Job result structure
 */
export interface ScrapeJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'partial';
  pagesScraped: number;
  totalPages: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
  duration: number;
  data?: any[];
  metadata?: Record<string, any>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  totalJobs: number;
}

/**
 * Scrape Queue Manager - Singleton class for managing the scraping queue
 */
export class ScrapeQueueManager {
  private static instance: ScrapeQueueManager;
  private queue: Queue<ScrapeJobData, ScrapeJobResult> | null = null;
  private queueEvents: QueueEvents | null = null;
  private redis: Redis | null = null;
  private isInitialized = false;
  private readonly queueName: string;
  private readonly deduplicationTTL = 3600; // 1 hour
  
  private constructor(queueName = 'scrape-queue') {
    this.queueName = queueName;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(queueName = 'scrape-queue'): ScrapeQueueManager {
    if (!ScrapeQueueManager.instance) {
      ScrapeQueueManager.instance = new ScrapeQueueManager(queueName);
    }
    return ScrapeQueueManager.instance;
  }

  /**
   * Initialize the queue manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create Redis connection
      this.redis = this.createRedisClient();
      
      // Create queue
      this.queue = new Queue<ScrapeJobData, ScrapeJobResult>(this.queueName, {
        connection: this.createRedisConfig(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      });

      // Create queue events listener
      this.queueEvents = new QueueEvents(this.queueName, {
        connection: this.createRedisConfig(),
      });

      // Setup event listeners
      this.setupEventListeners();

      // Wait for queue to be ready
      await this.queue.waitUntilReady();
      
      this.isInitialized = true;
      logger.info(`Queue manager initialized for queue: ${this.queueName}`);
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  /**
   * Create Redis client
   */
  private createRedisClient(): Redis {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 10000),
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redis.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    return redis;
  }

  /**
   * Create Redis configuration for BullMQ
   */
  private createRedisConfig() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(redisUrl);
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      db: 0,
      retryStrategy: (times: number) => Math.min(times * 100, 10000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: false,
    };
  }

  /**
   * Setup event listeners for the queue
   */
  private setupEventListeners(): void {
    if (!this.queueEvents) return;

    this.queueEvents.on('waiting', ({ jobId }) => {
      logger.debug(`Job ${jobId} is waiting`);
    });

    this.queueEvents.on('active', ({ jobId, prev }) => {
      logger.info(`Job ${jobId} is active (prev: ${prev})`);
    });

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info(`Job ${jobId} completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed: ${failedReason}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`Job ${jobId} progress: ${data}`);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`Job ${jobId} stalled`);
    });
  }

  /**
   * Add a job to the queue with deduplication
   */
  async addJob(
    data: ScrapeJobData,
    options?: {
      priority?: number;
      delay?: number;
      jobId?: string;
      deduplicate?: boolean;
    }
  ): Promise<Job<ScrapeJobData, ScrapeJobResult>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    // Deduplication logic
    if (options?.deduplicate !== false) {
      const isDuplicate = await this.checkDuplicateJob(data);
      if (isDuplicate) {
        logger.info(`Duplicate job detected for URL: ${data.url}`);
        throw new Error('Duplicate job detected');
      }
    }

    // Add job to queue
    const job = await this.queue.add(
      `scrape-${Date.now()}`,
      data,
      {
        priority: options?.priority || data.priority || 0,
        delay: options?.delay || 0,
        jobId: options?.jobId,
      }
    );

    // Store job for deduplication
    if (options?.deduplicate !== false) {
      await this.storeJobForDeduplication(data);
    }

    logger.info(`Job ${job.id} added to queue: ${data.url}`);
    return job;
  }

  /**
   * Check if a similar job already exists
   */
  private async checkDuplicateJob(data: ScrapeJobData): Promise<boolean> {
    if (!this.redis) return false;

    const key = this.getDeduplicationKey(data);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Store job for deduplication
   */
  private async storeJobForDeduplication(data: ScrapeJobData): Promise<void> {
    if (!this.redis) return;

    const key = this.getDeduplicationKey(data);
    await this.redis.setex(key, this.deduplicationTTL, JSON.stringify({
      url: data.url,
      customerId: data.customerId,
      timestamp: Date.now(),
    }));
  }

  /**
   * Get deduplication key for a job
   */
  private getDeduplicationKey(data: ScrapeJobData): string {
    return `dedup:${data.customerId}:${data.url}`;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.queue.isPaused(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      totalJobs: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<ScrapeJobData, ScrapeJobResult> | null | undefined> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    return await this.queue.getJob(jobId) || null;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} cancelled`);
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Clean up old jobs
   */
  async cleanup(options?: {
    grace?: number;
    status?: 'completed' | 'failed';
    limit?: number;
  }): Promise<string[]> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const cleanedJobIds = await this.queue.clean(
      options?.grace || 24 * 3600 * 1000, // Default 24 hours
      options?.limit || 100,
      options?.status
    );

    logger.info(`Cleaned ${cleanedJobIds.length} jobs`);
    return cleanedJobIds;
  }

  /**
   * Get deduplication statistics
   */
  async getDeduplicationStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
  }> {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }

    const keys = await this.redis.keys('dedup:*');
    const info = await this.redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    
    return {
      totalKeys: keys.length,
      memoryUsage: memoryMatch && memoryMatch[1] ? memoryMatch[1].trim() : 'unknown',
    };
  }

  /**
   * Drain the queue (remove all jobs)
   */
  async drain(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.drain();
    logger.info('Queue drained');
  }

  /**
   * Shutdown the queue manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down queue manager...');

    if (this.queueEvents) {
      await this.queueEvents.close();
    }

    if (this.queue) {
      await this.queue.close();
    }

    if (this.redis) {
      this.redis.disconnect();
    }

    this.isInitialized = false;
    logger.info('Queue manager shut down');
  }

  /**
   * Force shutdown (immediate)
   */
  async forceShutdown(): Promise<void> {
    logger.warn('Force shutting down queue manager...');

    if (this.queueEvents) {
      this.queueEvents.removeAllListeners();
      await this.queueEvents.close();
    }

    if (this.queue) {
      await this.queue.close();
    }

    if (this.redis) {
      this.redis.disconnect(false);
    }

    this.isInitialized = false;
  }

  /**
   * Get queue metrics for monitoring
   */
  async getQueueMetrics(): Promise<{
    queue: QueueStats;
    deduplication: any;
    redis: {
      connected: boolean;
      memory: string;
    };
  }> {
    const queueStats = await this.getQueueStats();
    const dedupStats = await this.getDeduplicationStats();
    
    return {
      queue: queueStats,
      deduplication: dedupStats,
      redis: {
        connected: this.redis?.status === 'ready' || false,
        memory: dedupStats.memoryUsage,
      },
    };
  }
}

/**
 * Export singleton getter function
 */
export function getQueueManager(queueName?: string): ScrapeQueueManager {
  return ScrapeQueueManager.getInstance(queueName);
}

/**
 * Export default instance
 */
export default ScrapeQueueManager;