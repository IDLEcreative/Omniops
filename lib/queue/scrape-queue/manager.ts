/**
 * Scrape Queue Manager - Singleton class for managing the scraping queue
 */

import { Queue, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../logger';
import {
  createRedisClient,
  createRedisConfig,
  setupEventListeners,
  getDefaultJobOptions,
} from '../scrape-queue-workers';
import type {
  ScrapeJobData,
  ScrapeJobResult,
  QueueStats,
  AddJobOptions,
  CleanupOptions,
  DeduplicationStats,
  QueueMetrics,
} from '../scrape-queue-types';

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
      this.redis = createRedisClient();

      // Create queue
      this.queue = new Queue<ScrapeJobData, ScrapeJobResult>(this.queueName, {
        connection: createRedisConfig(),
        defaultJobOptions: getDefaultJobOptions(),
      });

      // Create queue events listener
      this.queueEvents = new QueueEvents(this.queueName, {
        connection: createRedisConfig(),
      });

      // Setup event listeners
      setupEventListeners(this.queueEvents);

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
   * Add a job to the queue with deduplication
   */
  async addJob(
    data: ScrapeJobData,
    options?: AddJobOptions
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
    const job = await this.queue.add(`scrape-${Date.now()}`, data, {
      priority: options?.priority || data.priority || 0,
      delay: options?.delay || 0,
      jobId: options?.jobId,
    });

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
    await this.redis.setex(
      key,
      this.deduplicationTTL,
      JSON.stringify({
        url: data.url,
        organizationId: data.organizationId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Get deduplication key for a job
   */
  private getDeduplicationKey(data: ScrapeJobData): string {
    return `dedup:${data.organizationId}:${data.url}`;
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

    return (await this.queue.getJob(jobId)) || null;
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
  async cleanup(options?: CleanupOptions): Promise<string[]> {
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
  async getDeduplicationStats(): Promise<DeduplicationStats> {
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
  async getQueueMetrics(): Promise<QueueMetrics> {
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
