/**
 * Retry logic and maintenance utilities for queue management
 *
 * Extracted from queue-utils.ts for modularity
 */

import { getQueueManager } from './queue-manager';
import type { JobStatus } from './queue-manager';
import type { MaintenanceResult, MaintenanceOptions } from './queue-utils-types';

/**
 * Queue maintenance utilities for cleanup and retry operations
 */
export class QueueMaintenance {
  private static queueManager = getQueueManager();

  /**
   * Clean up old completed and failed jobs
   */
  static async cleanupOldJobs(
    maxAgeHours: number = 24,
    limit: number = 1000
  ): Promise<{ cleaned: number; summary: string }> {
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const cleaned = await this.queueManager.clean(maxAge, limit, 'completed');

    return {
      cleaned: cleaned.length,
      summary: `Cleaned ${cleaned.length} jobs older than ${maxAgeHours} hours`,
    };
  }

  /**
   * Clear deduplication cache
   */
  static async clearDeduplicationCache(): Promise<{ cleared: number; summary: string }> {
    // Deduplication cache clearing not available in current QueueManager
    // Return 0 for now

    return {
      cleared: 0,
      summary: `Deduplication cache clearing not implemented`,
    };
  }

  /**
   * Retry all failed jobs
   */
  static async retryFailedJobs(
    customerId?: string,
    maxRetries: number = 10
  ): Promise<{ retried: number; summary: string }> {
    const failedJobs = await this.queueManager.getJobsByStatus('failed', maxRetries);

    let retriedCount = 0;
    for (const job of failedJobs) {
      // Filter by customer if specified
      const jobData = job.data as any;
      if (customerId && jobData.customerId !== customerId) {
        continue;
      }

      // Create a new job with the same data
      await this.queueManager.addJob(job.data, {});
      retriedCount++;
    }

    return {
      retried: retriedCount,
      summary: `Retried ${retriedCount} failed jobs${customerId ? ` for customer ${customerId}` : ''}`,
    };
  }

  /**
   * Perform comprehensive queue maintenance
   */
  static async performMaintenance(options: MaintenanceOptions = {}): Promise<{
    cleanup?: { cleaned: number; summary: string };
    deduplication?: { cleared: number; summary: string };
    retry?: { retried: number; summary: string };
    summary: string;
  }> {
    const results: any = {};
    const actions = [];

    if (options.cleanupOldJobs !== false) {
      results.cleanup = await this.cleanupOldJobs(options.maxAgeHours);
      actions.push(results.cleanup.summary);
    }

    if (options.clearDeduplication) {
      results.deduplication = await this.clearDeduplicationCache();
      actions.push(results.deduplication.summary);
    }

    if (options.retryFailedJobs) {
      results.retry = await this.retryFailedJobs(undefined, options.maxRetries);
      actions.push(results.retry.summary);
    }

    return {
      ...results,
      summary: `Maintenance completed: ${actions.join('; ')}`,
    };
  }
}
