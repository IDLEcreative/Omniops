/**
 * Queue Manager - Statistics and Monitoring
 */

import type { Queue } from 'bullmq';
import type { JobData } from '../types';

/**
 * Get queue statistics
 */
export async function getQueueStats(queue: Queue<JobData>): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}> {
  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.isPaused(),
  ]);

  return { waiting, active, completed, failed, delayed, paused };
}

/**
 * Get deduplication statistics
 * TODO: Implement actual deduplication tracking
 */
export async function getDeduplicationStats(): Promise<{
  enabled: boolean;
  stats: {
    totalDeduplicated: number;
    recentDeduplications: any[];
  };
}> {
  return {
    enabled: true,
    stats: {
      totalDeduplicated: 0,
      recentDeduplications: [],
    },
  };
}
