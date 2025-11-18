/**
 * Job Manager
 *
 * Handles job operations including adding, canceling, and retrying jobs.
 *
 * @module lib/autonomous/queue/job-manager
 */

import { Queue, JobsOptions } from 'bullmq';
import { OperationJobData, OperationPriority } from './types';

/**
 * Add operation to queue
 *
 * @param queue BullMQ Queue instance
 * @param data Operation job data
 * @returns Job ID
 *
 * @example
 * const jobId = await addJobToQueue(queue, {
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
export async function addJobToQueue(queue: Queue, data: OperationJobData): Promise<string> {
  try {
    // Job options based on priority
    const jobOptions: JobsOptions = {
      priority: data.priority || OperationPriority.NORMAL,
      jobId: data.operationId, // Use operation ID as job ID for tracking
    };

    // Add job to queue
    const job = await queue.add(
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
 * Get job status from queue
 *
 * @param queue BullMQ Queue instance
 * @param jobId Job ID to query
 * @returns Job status information or null if not found
 */
export async function getJobStatus(queue: Queue, jobId: string): Promise<any> {
  try {
    const job = await queue.getJob(jobId);

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
 *
 * @param queue BullMQ Queue instance
 * @param jobId Job ID to cancel
 * @returns true if cancelled, false if job not found
 */
export async function cancelJob(queue: Queue, jobId: string): Promise<boolean> {
  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();

    return true;
  } catch (error) {
    console.error('[OperationQueue] Failed to cancel operation:', error);
    throw error;
  }
}

/**
 * Retry a failed operation
 *
 * @param queue BullMQ Queue instance
 * @param jobId Job ID to retry
 * @returns true if retried, false if job not found
 */
export async function retryJob(queue: Queue, jobId: string): Promise<boolean> {
  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.retry();

    return true;
  } catch (error) {
    console.error('[OperationQueue] Failed to retry operation:', error);
    throw error;
  }
}
