/**
 * Queue Manager - Job Operations
 */

import type { Queue, Job } from 'bullmq';
import { logger } from '../../logger';
import { JobPriority } from '../types';
import type { JobData, JobStatus } from '../types';

/**
 * Add a single job to the queue
 */
export async function addJob(
  queue: Queue<JobData>,
  data: JobData,
  options?: {
    priority?: number;
    delay?: number;
    jobId?: string;
  }
): Promise<Job<JobData>> {
  const jobName = `${data.type}-${Date.now()}`;
  const job = await queue.add(jobName, data, {
    priority: options?.priority ?? data.priority ?? JobPriority.NORMAL,
    delay: options?.delay,
    jobId: options?.jobId,
  });

  logger.info(`Job ${job.id} added: ${data.type}`);
  return job;
}

/**
 * Add multiple jobs in batch
 */
export async function addBulkJobs(
  queue: Queue<JobData>,
  jobs: Array<{ data: JobData; options?: any }>
): Promise<Job<JobData>[]> {
  const bulkJobs = jobs.map(({ data, options }) => ({
    name: `${data.type}-${Date.now()}-${Math.random()}`,
    data,
    opts: {
      priority: options?.priority ?? data.priority ?? JobPriority.NORMAL,
      delay: options?.delay,
    },
  }));

  const addedJobs = await queue.addBulk(bulkJobs);
  logger.info(`Added ${addedJobs.length} jobs in bulk`);
  return addedJobs;
}

/**
 * Get job by ID
 */
export async function getJob(
  queue: Queue<JobData>,
  jobId: string
): Promise<Job<JobData> | null> {
  return (await queue.getJob(jobId)) || null;
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(
  queue: Queue<JobData>,
  status: JobStatus,
  limit = 10
): Promise<Job<JobData>[]> {
  switch (status) {
    case 'waiting':
      return await queue.getWaiting(0, limit - 1);
    case 'active':
      return await queue.getActive(0, limit - 1);
    case 'completed':
      return await queue.getCompleted(0, limit - 1);
    case 'failed':
      return await queue.getFailed(0, limit - 1);
    case 'delayed':
      return await queue.getDelayed(0, limit - 1);
    default:
      return [];
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(queue: Queue<JobData>, jobId: string): Promise<void> {
  const job = await getJob(queue, jobId);
  if (job) {
    await job.remove();
    logger.info(`Job ${jobId} cancelled`);
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(queue: Queue<JobData>, jobId: string): Promise<void> {
  const job = await getJob(queue, jobId);
  if (job && (await job.isFailed())) {
    await job.retry();
    logger.info(`Job ${jobId} retried`);
  }
}
