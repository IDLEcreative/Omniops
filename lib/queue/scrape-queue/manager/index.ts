/**
 * Scrape Queue Manager - Singleton class for managing the scraping queue
 */

import { Job } from 'bullmq';
import type {
  ScrapeJobData,
  ScrapeJobResult,
  QueueStats,
  AddJobOptions,
  CleanupOptions,
  DeduplicationStats,
  QueueMetrics,
} from '../../scrape-queue-types';
import type { InitializationContext } from './initialization';
import { initializeQueue } from './initialization';
import { addJob, getQueueStats, getJob, cancelJob, cleanupJobs } from './job-operations';
import { pauseQueue, resumeQueue, drainQueue, shutdownQueue, forceShutdownQueue } from './queue-control';
import { getDeduplicationStats } from './deduplication';

export class ScrapeQueueManager {
  private static instance: ScrapeQueueManager;
  private context: InitializationContext = {
    redis: null,
    queue: null,
    queueEvents: null,
    isInitialized: false,
  };
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

  async initialize(): Promise<void> {
    return initializeQueue(this.context, this.queueName);
  }

  async addJob(
    data: ScrapeJobData,
    options?: AddJobOptions
  ): Promise<Job<ScrapeJobData, ScrapeJobResult>> {
    return addJob(this.context.queue, this.context.redis, data, options, this.deduplicationTTL);
  }

  async getQueueStats(): Promise<QueueStats> {
    return getQueueStats(this.context.queue);
  }

  async getJob(jobId: string): Promise<Job<ScrapeJobData, ScrapeJobResult> | null | undefined> {
    return getJob(this.context.queue, jobId);
  }

  async cancelJob(jobId: string): Promise<void> {
    return cancelJob(this.context.queue, jobId);
  }

  async pause(): Promise<void> {
    return pauseQueue(this.context.queue);
  }

  async resume(): Promise<void> {
    return resumeQueue(this.context.queue);
  }

  async cleanup(options?: CleanupOptions): Promise<string[]> {
    return cleanupJobs(this.context.queue, options);
  }

  async getDeduplicationStats(): Promise<DeduplicationStats> {
    return getDeduplicationStats(this.context.redis);
  }

  async drain(): Promise<void> {
    return drainQueue(this.context.queue);
  }

  async shutdown(): Promise<void> {
    await shutdownQueue(this.context.queueEvents, this.context.queue, this.context.redis);
    this.context.isInitialized = false;
  }

  async forceShutdown(): Promise<void> {
    await forceShutdownQueue(this.context.queueEvents, this.context.queue, this.context.redis);
    this.context.isInitialized = false;
  }

  async getQueueMetrics(): Promise<QueueMetrics> {
    const queueStats = await this.getQueueStats();
    const dedupStats = await this.getDeduplicationStats();

    return {
      queue: queueStats,
      deduplication: dedupStats,
      redis: {
        connected: this.context.redis?.status === 'ready' || false,
        memory: dedupStats.memoryUsage,
      },
    };
  }
}
