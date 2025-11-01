/**
 * Queue Manager - Queue Control Operations
 */

import type { Queue, QueueEvents } from 'bullmq';
import type Redis from 'ioredis';
import { logger } from '../../logger';
import type { JobData } from '../types';

/**
 * Pause the queue
 */
export async function pauseQueue(queue: Queue<JobData>): Promise<void> {
  await queue.pause();
  logger.info('Queue paused');
}

/**
 * Resume the queue
 */
export async function resumeQueue(queue: Queue<JobData>): Promise<void> {
  await queue.resume();
  logger.info('Queue resumed');
}

/**
 * Clean completed/failed jobs
 */
export async function cleanQueue(
  queue: Queue<JobData>,
  grace = 3600000,
  limit = 100,
  status: 'completed' | 'failed' = 'completed'
): Promise<string[]> {
  const cleaned = await queue.clean(grace, limit, status);
  logger.info(`Cleaned ${cleaned.length} ${status} jobs`);
  return cleaned;
}

/**
 * Drain the queue (remove all jobs)
 */
export async function drainQueue(queue: Queue<JobData>): Promise<void> {
  await queue.drain();
  logger.info('Queue drained');
}

/**
 * Graceful shutdown
 */
export async function shutdown(
  queue: Queue<JobData> | null,
  queueEvents: QueueEvents | null,
  redis: Redis | null,
  queueName: string
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

  logger.info(`Queue manager shut down: ${queueName}`);
}

/**
 * Force shutdown (immediate)
 */
export async function forceShutdown(
  queue: Queue<JobData> | null,
  queueEvents: QueueEvents | null,
  redis: Redis | null,
  queueName: string
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

  logger.info(`Queue manager force shut down: ${queueName}`);
}
