import { Job } from 'bullmq';
import { JobResult, ProgressUpdate, ProcessingMetrics, JobProcessorConfig } from './job-processor-types';

/**
 * Update job progress
 */
export async function updateProgress(
  job: Job,
  progressUpdate: ProgressUpdate
): Promise<void> {
  await job.updateProgress(progressUpdate);
  console.log(`Job ${job.id} progress: ${progressUpdate.percentage}% - ${progressUpdate.message}`);
}

/**
 * Update processing metrics
 */
export function updateMetrics(
  metrics: ProcessingMetrics,
  job: Job,
  result: JobResult,
  success: boolean
): void {
  if (success) {
    metrics.jobsProcessed++;
  } else {
    metrics.jobsFailed++;

    // Track errors by type
    const errorType = job.data.type || 'unknown';
    metrics.errorsByType[errorType] =
      (metrics.errorsByType[errorType] || 0) + 1;
  }

  metrics.totalProcessingTime += result.duration;
  metrics.averageProcessingTime =
    metrics.totalProcessingTime /
    (metrics.jobsProcessed + metrics.jobsFailed);

  metrics.lastProcessedAt = new Date();
}

/**
 * Create initial metrics object
 */
export function createInitialMetrics(): ProcessingMetrics {
  return {
    jobsProcessed: 0,
    jobsFailed: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    errorsByType: {},
  };
}

/**
 * Get default processor configuration
 */
export function getDefaultConfig(): JobProcessorConfig {
  return {
    maxConcurrency: 5,
    stalledInterval: 30000, // 30 seconds
    maxStalledCount: 1,
    retryProcessDelay: 5000, // 5 seconds
    enableMetrics: true,
  };
}
