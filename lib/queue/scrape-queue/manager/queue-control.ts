/**
 * Queue control operations
 */

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../../logger';
import type { ScrapeJobData, ScrapeJobResult } from '../../scrape-queue-types';

/**
 * Pause the queue
 */
export async function pauseQueue(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null
): Promise<void> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  await queue.pause();
  logger.info('Queue paused');
}

/**
 * Resume the queue
 */
export async function resumeQueue(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null
): Promise<void> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  await queue.resume();
  logger.info('Queue resumed');
}

/**
 * Drain the queue (remove all jobs)
 */
export async function drainQueue(
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null
): Promise<void> {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  await queue.drain();
  logger.info('Queue drained');
}

/**
 * Shutdown the queue manager
 */
export async function shutdownQueue(
  queueEvents: QueueEvents | null,
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  redis: Redis | null
): Promise<void> {
  logger.info('Shutting down queue manager...');

  if (queueEvents) {
    await queueEvents.close();
  }

  if (queue) {
    await queue.close();
  }

  if (redis) {
    redis.disconnect();
  }

  logger.info('Queue manager shut down');
}

/**
 * Force shutdown (immediate)
 */
export async function forceShutdownQueue(
  queueEvents: QueueEvents | null,
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null,
  redis: Redis | null
): Promise<void> {
  logger.warn('Force shutting down queue manager...');

  if (queueEvents) {
    queueEvents.removeAllListeners();
    await queueEvents.close();
  }

  if (queue) {
    await queue.close();
  }

  if (redis) {
    redis.disconnect(false);
  }
}
