/**
 * Event Logger Utility
 *
 * Handles logging of worker events for monitoring and debugging.
 *
 * @module lib/autonomous/queue/utils/event-logger
 */

import { Worker, Job } from 'bullmq';
import { OperationJobData, OperationJobResult } from '../types';

/**
 * Set up event listeners for worker monitoring
 *
 * Logs completion, failures, errors, and stalled jobs.
 *
 * @param worker - BullMQ worker instance to attach listeners to
 */
export function setupWorkerEventListeners(worker: Worker): void {
  worker.on('completed', (job: Job, result: OperationJobResult) => {
    console.log(`[OperationProcessor] Job completed: ${job.id}`, {
      success: result.success,
      duration: result.duration,
    });
  });

  worker.on('failed', (job: Job<OperationJobData> | undefined, error: Error) => {
    console.error(`[OperationProcessor] Job failed: ${job?.id}`, {
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (error: Error) => {
    console.error('[OperationProcessor] Worker error:', error);
  });

  worker.on('stalled', (jobId: string) => {
    console.warn(`[OperationProcessor] Job stalled: ${jobId}`);
  });
}
