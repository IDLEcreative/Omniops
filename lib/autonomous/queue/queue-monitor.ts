/**
 * Queue Monitor
 *
 * Handles queue statistics, health checks, and maintenance operations.
 *
 * @module lib/autonomous/queue/queue-monitor
 */

import { Queue } from 'bullmq';
import { OperationQueueStats, OperationQueueHealth } from './types';

/**
 * Get queue statistics
 *
 * @param queue BullMQ Queue instance
 * @returns Queue statistics with job counts
 *
 * @example
 * const stats = await getQueueStats(queue);
 * console.log(`Active jobs: ${stats.active}`);
 */
export async function getQueueStats(queue: Queue): Promise<OperationQueueStats> {
  try {
    const counts = await queue.getJobCounts(
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
 *
 * @param queue BullMQ Queue instance
 * @param queueName Queue name for reporting
 * @returns Queue health information
 *
 * @example
 * const health = await getQueueHealth(queue, 'autonomous-operations');
 * if (!health.healthy) {
 *   console.error('Queue is unhealthy:', health.errors);
 * }
 */
export async function getQueueHealth(
  queue: Queue,
  queueName: string
): Promise<OperationQueueHealth> {
  try {
    const stats = await getQueueStats(queue);
    const client = await queue.client;

    let redisConnected = false;
    try {
      await client.ping();
      redisConnected = true;
    } catch (err) {
      // Redis not connected
    }

    // Get last processed job
    const completedJobs = await queue.getCompleted(0, 0);
    const lastJobProcessedAt = completedJobs.length > 0
      ? new Date(completedJobs[0].finishedOn!).toISOString()
      : undefined;

    return {
      healthy: redisConnected && stats.active >= 0,
      queueName,
      redisConnected,
      activeWorkers: stats.active,
      stats,
      lastJobProcessedAt,
    };
  } catch (error) {
    return {
      healthy: false,
      queueName,
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
 *
 * @param queue BullMQ Queue instance
 */
export async function pauseQueue(queue: Queue): Promise<void> {
  await queue.pause();
  console.log('[OperationQueue] Queue paused');
}

/**
 * Resume queue processing
 *
 * @param queue BullMQ Queue instance
 */
export async function resumeQueue(queue: Queue): Promise<void> {
  await queue.resume();
  console.log('[OperationQueue] Queue resumed');
}

/**
 * Clean old completed/failed jobs
 *
 * @param queue BullMQ Queue instance
 * @param age Maximum age in milliseconds (default: 7 days)
 *
 * @example
 * // Clean jobs older than 7 days
 * await cleanOldJobs(queue);
 *
 * // Clean jobs older than 24 hours
 * await cleanOldJobs(queue, 24 * 60 * 60 * 1000);
 */
export async function cleanOldJobs(
  queue: Queue,
  age: number = 7 * 24 * 60 * 60 * 1000
): Promise<void> {
  try {
    // Clean completed jobs older than age
    await queue.clean(age, 100, 'completed');

    // Clean failed jobs older than age
    await queue.clean(age, 100, 'failed');

    console.log('[OperationQueue] Cleaned old jobs');
  } catch (error) {
    console.error('[OperationQueue] Failed to clean jobs:', error);
    throw error;
  }
}

/**
 * Close queue connection
 *
 * @param queue BullMQ Queue instance
 */
export async function closeQueue(queue: Queue): Promise<void> {
  await queue.close();
  console.log('[OperationQueue] Queue closed');
}
