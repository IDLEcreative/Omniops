/**
 * Job management operations
 */

import { Queue, Job } from 'bullmq';
import { logger } from '../../../logger';
import { checkDuplicateJob, storeJobForDeduplication } from './deduplication';
import type { ScrapeJobData, ScrapeJobResult, QueueStats, CleanupOptions } from '../../scrape-queue-types';
import type { JobOptions } from './types';
import Redis from 'ioredis';

/**
 * Add a job to the queue with deduplication
 */
export async function addJob(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  redis: Redis | null,
  data: ScrapeJobData,
  options: JobOptions | undefined,
  deduplicationTTL: number
): Promise<Job<ScrapeJobData, ScrapeJobResult>> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  // Deduplication logic
  if (options?.deduplicate !== false) {
    const isDuplicate = await checkDuplicateJob(redis, data);
    if (isDuplicate) {
      logger.info(`Duplicate job detected for URL: ${data.url}`);
      throw new Error('Duplicate job detected');
    }
  }

  // Add job to queue
  const job = await queue.add(`scrape-${Date.now()}`, data, {
    priority: options?.priority || data.priority || 0,
    delay: options?.delay || 0,
    jobId: options?.jobId,
  });

  // Store job for deduplication
  if (options?.deduplicate !== false) {
    await storeJobForDeduplication(redis, data, deduplicationTTL);
  }

  logger.info(`Job ${job.id} added to queue: ${data.url}`);
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null
): Promise<QueueStats> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.isPaused(),
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
export async function getJob(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  jobId: string
): Promise<Job<ScrapeJobData, ScrapeJobResult> | null | undefined> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  return (await queue.getJob(jobId)) || null;
}

/**
 * Cancel a job
 */
export async function cancelJob(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  jobId: string
): Promise<void> {
  const job = await getJob(queue, jobId);
  if (job) {
    await job.remove();
    logger.info(`Job ${jobId} cancelled`);
  }
}

/**
 * Clean up old jobs
 */
export async function cleanupJobs(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  options?: CleanupOptions
): Promise<string[]> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  const cleanedJobIds = await queue.clean(
    options?.grace || 24 * 3600 * 1000, // Default 24 hours
    options?.limit || 100,
    options?.status
  );

  logger.info(`Cleaned ${cleanedJobIds.length} jobs`);
  return cleanedJobIds;
}
