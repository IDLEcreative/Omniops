/**
 * Queue Manager - Core queue management functionality
 * Handles job types, priorities, and queue operations
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logger';
import { JobPriority } from './types';
import type {
  JobType,
  JobStatus,
  JobData,
  QueueManagerConfig,
} from './types';

// Re-export types for backwards compatibility
export type {
  JobType,
  JobStatus,
  BaseJobData,
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobData,
  QueueManagerConfig,
} from './types';

// Re-export JobPriority enum
export { JobPriority };

/**
 * Queue Manager Class
 */
export class QueueManager {
  private static instances = new Map<string, QueueManager>();
  private queue: Queue<JobData> | null = null;
  private queueEvents: QueueEvents | null = null;
  private redis: Redis | null = null;
  private config: Required<QueueManagerConfig>;
  private isInitialized = false;
  
  private constructor(config: QueueManagerConfig = {}) {
    this.config = {
      queueName: config.queueName || 'scraper-queue',
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      maxConcurrency: config.maxConcurrency || 5,
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts || 3,
        backoffDelay: config.defaultJobOptions?.backoffDelay || 2000,
        timeout: config.defaultJobOptions?.timeout || 60000,
      },
      enableMetrics: config.enableMetrics ?? true,
    };
  }

  /**
   * Get queue manager instance
   */
  public static getInstance(queueName = 'scraper-queue', config?: QueueManagerConfig): QueueManager {
    if (!QueueManager.instances.has(queueName)) {
      QueueManager.instances.set(queueName, new QueueManager({ ...config, queueName }));
    }
    return QueueManager.instances.get(queueName)!;
  }

  /**
   * Initialize the queue
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const redisConfig = this.createRedisConfig();
      
      // Create Redis client
      this.redis = new Redis(this.config.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 10000),
      });

      // Create queue
      this.queue = new Queue<JobData>(this.config.queueName, {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: this.config.defaultJobOptions.attempts,
          backoff: {
            type: 'exponential',
            delay: this.config.defaultJobOptions.backoffDelay,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 100,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      });

      // Create queue events
      this.queueEvents = new QueueEvents(this.config.queueName, {
        connection: redisConfig,
      });

      // Wait for queue to be ready
      await this.queue.waitUntilReady();
      
      this.isInitialized = true;
      logger.info(`Queue manager initialized: ${this.config.queueName}`);
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  /**
   * Create Redis configuration
   */
  private createRedisConfig() {
    const url = new URL(this.config.redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      db: 0,
      retryStrategy: (times: number) => Math.min(times * 100, 10000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    };
  }

  /**
   * Add a job to the queue
   */
  async addJob(data: JobData, options?: {
    priority?: number;
    delay?: number;
    jobId?: string;
  }): Promise<Job<JobData>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const jobName = `${data.type}-${Date.now()}`;
    const job = await this.queue.add(jobName, data, {
      priority: options?.priority ?? data.priority ?? JobPriority.NORMAL,
      delay: options?.delay,
      jobId: options?.jobId,
    });

    logger.info(`Job ${job.id} added: ${data.type}`);
    return job;
  }

  /**
   * Add multiple jobs in batch
   */
  async addBulkJobs(jobs: Array<{ data: JobData; options?: any }>): Promise<Job<JobData>[]> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const bulkJobs = jobs.map(({ data, options }) => ({
      name: `${data.type}-${Date.now()}-${Math.random()}`,
      data,
      opts: {
        priority: options?.priority ?? data.priority ?? JobPriority.NORMAL,
        delay: options?.delay,
      },
    }));

    const addedJobs = await this.queue.addBulk(bulkJobs);
    logger.info(`Added ${addedJobs.length} jobs in bulk`);
    return addedJobs;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
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

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<JobData> | null | undefined> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }
    return await this.queue.getJob(jobId) || null;
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus, limit = 10): Promise<Job<JobData>[]> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    switch (status) {
      case 'waiting':
        return await this.queue.getWaiting(0, limit - 1);
      case 'active':
        return await this.queue.getActive(0, limit - 1);
      case 'completed':
        return await this.queue.getCompleted(0, limit - 1);
      case 'failed':
        return await this.queue.getFailed(0, limit - 1);
      case 'delayed':
        return await this.queue.getDelayed(0, limit - 1);
      default:
        return [];
    }
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
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job && (await job.isFailed())) {
      await job.retry();
      logger.info(`Job ${jobId} retried`);
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
   * Clean completed/failed jobs
   */
  async clean(grace = 3600000, limit = 100, status: 'completed' | 'failed' = 'completed'): Promise<string[]> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }
    const cleaned = await this.queue.clean(grace, limit, status);
    logger.info(`Cleaned ${cleaned.length} ${status} jobs`);
    return cleaned;
  }

  /**
   * Drain the queue
   */
  async drain(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }
    await this.queue.drain();
    logger.info('Queue drained');
  }

  /**
   * Get deduplication stats (placeholder)
   */
  async getDeduplicationStats(): Promise<{ enabled: boolean; stats: any }> {
    return {
      enabled: true,
      stats: {
        totalDeduplicated: 0,
        recentDeduplications: [],
      },
    };
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
    QueueManager.instances.delete(this.config.queueName);
    logger.info('Queue manager shut down');
  }

  /**
   * Force shutdown
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
    QueueManager.instances.delete(this.config.queueName);
  }
}

/**
 * Helper function to get queue manager instance
 */
export function getQueueManager(queueName?: string, config?: QueueManagerConfig): QueueManager {
  return QueueManager.getInstance(queueName, config);
}

/**
 * Helper function to create a new queue manager
 */
export function createQueueManager(queueName: string, config?: QueueManagerConfig): QueueManager {
  return QueueManager.getInstance(queueName, config);
}