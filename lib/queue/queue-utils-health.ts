/**
 * Queue health monitoring and job lookup utilities
 *
 * Extracted from queue-utils.ts for modularity
 */

import { getQueueManager } from './queue-manager';
import type { JobStatus } from './queue-manager';
import { getJobProcessor } from './job-processor';
import type { ProcessingMetrics } from './job-processor';

/**
 * Queue monitoring and health check utilities
 */
export class QueueMonitor {
  private static queueManager = getQueueManager();
  private static jobProcessor = getJobProcessor();

  /**
   * Check Redis connection health
   */
  private static async checkRedisConnection(): Promise<boolean> {
    try {
      const queue = (this.queueManager as any).queue;
      if (!queue || !queue.client) {
        return false;
      }
      await queue.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive queue health status
   */
  static async getQueueHealth(): Promise<{
    queue: { stats: any; isHealthy: boolean; issues: string[] };
    processor: { isRunning: boolean; metrics: ProcessingMetrics };
    redis: { connected: boolean };
    deduplication: { totalKeys: number; keysByType: Record<string, number> };
  }> {
    const stats = await this.queueManager.getQueueStats();
    const processingMetrics = this.jobProcessor.getMetrics();
    const deduplicationStats = await this.queueManager.getDeduplicationStats();

    const issues = [];
    if (stats.failed > stats.completed * 0.1) {
      issues.push('High failure rate detected');
    }
    if (stats.waiting > 100) {
      issues.push('Large queue backlog');
    }
    if (stats.active === 0 && stats.waiting > 0) {
      issues.push('Jobs waiting but no active processing');
    }

    return {
      queue: { stats, isHealthy: issues.length === 0, issues },
      processor: { isRunning: this.jobProcessor.isRunning(), metrics: processingMetrics },
      redis: { connected: await this.checkRedisConnection() },
      deduplication: {
        totalKeys: deduplicationStats.enabled ? (deduplicationStats.stats as any)?.totalKeys || 0 : 0,
        keysByType: deduplicationStats.enabled ? (deduplicationStats.stats as any)?.keysByType || {} : {}
      },
    };
  }

  /**
   * Get jobs by customer
   */
  static async getJobsByCustomer(customerId: string, status?: JobStatus, limit = 10): Promise<any[]> {
    const statuses = status ? [status] : ['waiting', 'active', 'completed', 'failed', 'delayed'];
    const allJobs = [];

    for (const currentStatus of statuses) {
      const jobs = await this.queueManager.getJobsByStatus(currentStatus as JobStatus, 100);
      const customerJobs = jobs.filter(job => {
        const jobData = job.data as any;
        return jobData.customerId === customerId;
      });
      allJobs.push(...customerJobs);
    }

    return allJobs.slice(0, limit);
  }

  /**
   * Get jobs by URL pattern
   */
  static async getJobsByUrl(urlPattern: string, exactMatch = false, limit = 10): Promise<any[]> {
    const statuses = ['waiting', 'active', 'completed', 'failed', 'delayed'];
    const allJobs = [];

    for (const status of statuses) {
      const jobs = await this.queueManager.getJobsByStatus(status as JobStatus, 100);
      const matchingJobs = jobs.filter(job => {
        const jobData = job.data as any;
        if (exactMatch) {
          return jobData.url === urlPattern;
        }
        return jobData.url && jobData.url.includes(urlPattern);
      });
      allJobs.push(...matchingJobs);
    }

    return allJobs.slice(0, limit);
  }

  /**
   * Get processing statistics - delegates to QueueStatistics
   */
  static async getProcessingStats() {
    const { QueueStatistics } = await import('./queue-utils-monitoring');
    return QueueStatistics.getProcessingStats();
  }
}
