/**
 * Progress Tracker Utility
 *
 * Manages progress updates for operation jobs, storing state in Redis
 * for real-time monitoring.
 *
 * @module lib/autonomous/queue/utils/progress-tracker
 */

import { Job } from 'bullmq';
import { OperationJobData, OperationProgressUpdate } from '../types';

/**
 * Update operation progress in Redis
 *
 * Stores progress information with a 1-hour expiry for real-time access.
 *
 * @param job - BullMQ job instance
 * @param update - Progress update data
 */
export async function updateOperationProgress(
  job: Job<OperationJobData>,
  update: OperationProgressUpdate
): Promise<void> {
  try {
    // Get Redis client from worker
    const client = await (job as any).queueEvents?.client || (job as any).queue?.client;
    if (!client) {
      console.warn('[ProgressTracker] Redis client not available');
      return;
    }

    const key = `operation:progress:${update.operationId}`;
    await client.set(key, JSON.stringify(update), 'EX', 3600); // 1 hour expiry
  } catch (error) {
    console.warn('[ProgressTracker] Failed to update progress:', error);
  }
}

/**
 * Create a progress updater function bound to a specific job
 *
 * @param job - BullMQ job instance
 * @param operationId - Operation ID for tracking
 * @returns Function that updates both job and operation progress
 */
export function createProgressUpdater(
  job: Job<OperationJobData>,
  operationId: string
): (progress: number, message: string) => Promise<void> {
  return async (progress: number, message: string) => {
    await updateOperationProgress(job, {
      operationId,
      status: 'active',
      progress,
      message,
      timestamp: new Date().toISOString(),
    });
  };
}
