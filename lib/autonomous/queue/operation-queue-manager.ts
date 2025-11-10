/**
 * Operation Queue Manager
 *
 * Manages queueing and processing of autonomous agent operations using BullMQ.
 *
 * @module lib/autonomous/queue/operation-queue-manager
 */

import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { createRedisClient } from '@/lib/redis';
import {
  OperationJobData,
  OperationQueueConfig,
  OperationQueueStats,
  OperationPriority,
  OperationQueueHealth,
} from './types';

// ============================================================================
// Operation Queue Manager Class
// ============================================================================

export class OperationQueueManager {
  private queue: Queue;
  private config: OperationQueueConfig;

  constructor(config: OperationQueueConfig = {}) {
    this.config = {
      queueName: config.queueName || 'autonomous-operations',
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      maxConcurrency: config.maxConcurrency || 2, // Limit concurrent browser operations
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts || 3,
        backoffDelay: config.defaultJobOptions?.backoffDelay || 5000, // 5 seconds
        timeout: config.defaultJobOptions?.timeout || 300000, // 5 minutes
        ...config.defaultJobOptions,
      },
      enableMetrics: config.enableMetrics !== false,
      rateLimitPerOrg: config.rateLimitPerOrg || 10, // 10 operations per hour per org
    };

    // Initialize BullMQ queue
    const connection = createRedisClient();

    const queueOptions: QueueOptions = {
      connection: connection as any,
      defaultJobOptions: {
        attempts: this.config.defaultJobOptions!.attempts,
        backoff: {
          type: 'exponential',
          delay: this.config.defaultJobOptions!.backoffDelay,
        },
        removeOnComplete: false, // Keep for audit trail
        removeOnFail: false, // Keep for debugging
        timeout: this.config.defaultJobOptions!.timeout,
      },
    };

    this.queue = new Queue(this.config.queueName!, queueOptions);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Add operation to queue
   *
   * @example
   * const jobId = await queueManager.addOperation({
   *   operationId: 'op-123',
   *   organizationId: 'org-456',
   *   userId: 'user-789',
   *   service: 'shopify',
   *   operation: 'api_credential_generation',
   *   jobType: 'shopify_setup',
   *   priority: OperationPriority.HIGH,
   *   config: { storeUrl: 'mystore.myshopify.com' }
   * });
   */
  async addOperation(data: OperationJobData): Promise<string> {
    try {
      // Check rate limit for organization
      await this.checkRateLimit(data.organizationId);

      // Job options based on priority
      const jobOptions: JobsOptions = {
        priority: data.priority || OperationPriority.NORMAL,
        jobId: data.operationId, // Use operation ID as job ID for tracking
      };

      // Add job to queue
      const job = await this.queue.add(
        data.jobType,
        data,
        jobOptions
      );

      console.log(`[OperationQueue] Job added: ${job.id} (${data.jobType})`);

      return job.id!;
    } catch (error) {
      console.error('[OperationQueue] Failed to add operation:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress;
      const failedReason = job.failedReason;

      return {
        id: job.id,
        status: state,
        progress,
        data: job.data,
        failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        attemptsMade: job.attemptsMade,
        returnvalue: job.returnvalue,
      };
    } catch (error) {
      console.error('[OperationQueue] Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending or active operation
   */
  async cancelOperation(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      console.log(`[OperationQueue] Job cancelled: ${jobId}`);

      return true;
    } catch (error) {
      console.error('[OperationQueue] Failed to cancel operation:', error);
      throw error;
    }
  }

  /**
   * Retry a failed operation
   */
  async retryOperation(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.retry();
      console.log(`[OperationQueue] Job retried: ${jobId}`);

      return true;
    } catch (error) {
      console.error('[OperationQueue] Failed to retry operation:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<OperationQueueStats> {
    try {
      const counts = await this.queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused'
      );

      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        paused: counts.paused || 0,
      };
    } catch (error) {
      console.error('[OperationQueue] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Get queue health status
   */
  async getHealth(): Promise<OperationQueueHealth> {
    try {
      const stats = await this.getStats();
      const client = await this.queue.client;

      let redisConnected = false;
      try {
        await client.ping();
        redisConnected = true;
      } catch (err) {
        // Redis not connected
      }

      // Get last processed job
      const completedJobs = await this.queue.getCompleted(0, 0);
      const lastJobProcessedAt = completedJobs.length > 0
        ? new Date(completedJobs[0].finishedOn!).toISOString()
        : undefined;

      return {
        healthy: redisConnected && stats.active >= 0,
        queueName: this.config.queueName!,
        redisConnected,
        activeWorkers: stats.active,
        stats,
        lastJobProcessedAt,
      };
    } catch (error) {
      return {
        healthy: false,
        queueName: this.config.queueName!,
        redisConnected: false,
        activeWorkers: 0,
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    console.log('[OperationQueue] Queue paused');
  }

  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    console.log('[OperationQueue] Queue resumed');
  }

  /**
   * Clean old completed/failed jobs
   */
  async clean(age: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      // Clean completed jobs older than age
      await this.queue.clean(age, 100, 'completed');

      // Clean failed jobs older than age
      await this.queue.clean(age, 100, 'failed');

      console.log('[OperationQueue] Cleaned old jobs');
    } catch (error) {
      console.error('[OperationQueue] Failed to clean jobs:', error);
      throw error;
    }
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    console.log('[OperationQueue] Queue closed');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set up event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    this.queue.on('added', (job) => {
      console.log(`[OperationQueue] Job added to queue: ${job.id}`);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`[OperationQueue] Job waiting: ${jobId}`);
    });

    this.queue.on('error', (error) => {
      console.error('[OperationQueue] Queue error:', error);
    });
  }

  /**
   * Check if organization has exceeded rate limit
   */
  private async checkRateLimit(organizationId: string): Promise<void> {
    try {
      const client = await this.queue.client;
      const key = `ratelimit:operations:${organizationId}`;
      const count = await client.incr(key);

      if (count === 1) {
        // Set expiry on first request
        await client.expire(key, 3600); // 1 hour
      }

      if (count > this.config.rateLimitPerOrg!) {
        throw new Error(`Rate limit exceeded for organization ${organizationId}`);
      }
    } catch (error) {
      if ((error as Error).message.includes('Rate limit')) {
        throw error;
      }
      // Don't fail on rate limit errors, just log
      console.warn('[OperationQueue] Rate limit check failed:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let queueManagerInstance: OperationQueueManager | null = null;

/**
 * Get singleton queue manager instance
 *
 * @example
 * const queueManager = getOperationQueueManager();
 * await queueManager.addOperation(...);
 */
export function getOperationQueueManager(config?: OperationQueueConfig): OperationQueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new OperationQueueManager(config);
  }
  return queueManagerInstance;
}

/**
 * Create new queue manager instance (for testing)
 */
export function createOperationQueueManager(config?: OperationQueueConfig): OperationQueueManager {
  return new OperationQueueManager(config);
}
