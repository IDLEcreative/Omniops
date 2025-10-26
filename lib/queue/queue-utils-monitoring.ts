/**
 * Advanced monitoring and statistics utilities for queue management
 *
 * Extracted from queue-utils.ts for modularity
 */

import { getQueueManager } from './queue-manager';
import { getJobProcessor } from './job-processor';
import type { ProcessingMetrics } from './job-processor';

/**
 * Advanced queue statistics and monitoring
 */
export class QueueStatistics {
  private static queueManager = getQueueManager();
  private static jobProcessor = getJobProcessor();

  /**
   * Get processing statistics
   */
  static async getProcessingStats(): Promise<{
    queue: any;
    processing: ProcessingMetrics;
    performance: {
      averageJobsPerHour: number;
      successRate: number;
      mostCommonErrors: Array<{ type: string; count: number }>;
    };
  }> {
    const queueStats = await this.queueManager.getQueueStats();
    const processingMetrics = this.jobProcessor.getMetrics();

    const totalJobs = processingMetrics.jobsProcessed + processingMetrics.jobsFailed;
    const successRate = totalJobs > 0 ? (processingMetrics.jobsProcessed / totalJobs) * 100 : 0;

    const hoursElapsed = processingMetrics.lastProcessedAt
      ? (Date.now() - processingMetrics.lastProcessedAt.getTime()) / (1000 * 60 * 60)
      : 1;
    const averageJobsPerHour = totalJobs / Math.max(hoursElapsed, 1);

    const mostCommonErrors = Object.entries(processingMetrics.errorsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      queue: queueStats,
      processing: processingMetrics,
      performance: {
        averageJobsPerHour,
        successRate,
        mostCommonErrors,
      },
    };
  }
}
