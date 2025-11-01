/**
 * Queue Manager - Core Class
 */

import type { Queue, Worker, Job, QueueEvents } from 'bullmq';
import type Redis from 'ioredis';
import { logger } from '../../logger';
import type { JobData, JobStatus, QueueManagerConfig } from '../types';
import { initializeQueue, mergeConfig } from './initialization';
import * as jobOps from './job-operations';
import * as queueControl from './queue-control';
import * as stats from './stats';

/**
 * Queue Manager Class
 * Manages BullMQ queue with Redis backend
 */
export class QueueManager {
  private static instances = new Map<string, QueueManager>();
  private queue: Queue<JobData> | null = null;
  private queueEvents: QueueEvents | null = null;
  private redis: Redis | null = null;
  private config: Required<QueueManagerConfig>;
  private isInitialized = false;

  private constructor(config: QueueManagerConfig = {}) {
    this.config = mergeConfig(config);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(
    queueName = 'scraper-queue',
    config?: QueueManagerConfig
  ): QueueManager {
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
      const { queue, queueEvents, redis } = await initializeQueue(this.config);
      this.queue = queue;
      this.queueEvents = queueEvents;
      this.redis = redis;
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    data: JobData,
    options?: { priority?: number; delay?: number; jobId?: string }
  ): Promise<Job<JobData>> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.addJob(this.queue, data, options);
  }

  /**
   * Add multiple jobs in batch
   */
  async addBulkJobs(
    jobs: Array<{ data: JobData; options?: any }>
  ): Promise<Job<JobData>[]> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.addBulkJobs(this.queue, jobs);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<JobData> | null | undefined> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.getJob(this.queue, jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus, limit = 10): Promise<Job<JobData>[]> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.getJobsByStatus(this.queue, status, limit);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.cancelJob(this.queue, jobId);
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    if (!this.queue) throw new Error('Queue not initialized');
    return jobOps.retryJob(this.queue, jobId);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    if (!this.queue) throw new Error('Queue not initialized');
    return stats.getQueueStats(this.queue);
  }

  /**
   * Get deduplication stats
   */
  async getDeduplicationStats() {
    return stats.getDeduplicationStats();
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    if (!this.queue) throw new Error('Queue not initialized');
    return queueControl.pauseQueue(this.queue);
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    if (!this.queue) throw new Error('Queue not initialized');
    return queueControl.resumeQueue(this.queue);
  }

  /**
   * Clean completed/failed jobs
   */
  async clean(
    grace = 3600000,
    limit = 100,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    if (!this.queue) throw new Error('Queue not initialized');
    return queueControl.cleanQueue(this.queue, grace, limit, status);
  }

  /**
   * Drain the queue
   */
  async drain(): Promise<void> {
    if (!this.queue) throw new Error('Queue not initialized');
    return queueControl.drainQueue(this.queue);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await queueControl.shutdown(this.queue, this.queueEvents, this.redis, this.config.queueName);
    this.isInitialized = false;
    QueueManager.instances.delete(this.config.queueName);
  }

  /**
   * Force shutdown
   */
  async forceShutdown(): Promise<void> {
    await queueControl.forceShutdown(this.queue, this.queueEvents, this.redis, this.config.queueName);
    this.isInitialized = false;
    QueueManager.instances.delete(this.config.queueName);
  }
}
