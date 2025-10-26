/**
 * Main queue utility functions for job creation and monitoring
 *
 * Refactored to be under 300 LOC - specialized functionality extracted to:
 * - queue-utils-types.ts (types and interfaces)
 * - queue-utils-retry.ts (retry and maintenance)
 * - queue-utils-priority.ts (scheduling and priority)
 */

import {
  getQueueManager,
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobPriority,
  JobType,
} from './queue-manager';
import type { JobStatus } from './queue-manager';
import { QueueMonitor as QueueMonitorClass } from './queue-utils-health';

// Re-export types and utilities
export type { JobStatus, JobType } from './queue-manager';
export { JobPriority } from './queue-manager';
export type {
  JobCreationResult,
  BatchJobResult,
  QueueHealthStatus,
  ProcessingStatistics,
  JobCreationOptions,
  FullCrawlOptions,
  RefreshJobOptions,
  BatchJobOptions,
  RecurringJobOptions,
} from './queue-utils-types';
export { CronPatterns } from './queue-utils-types';
export { QueueMaintenance } from './queue-utils-retry';
export { validateCronPattern, getNextRunTime, PriorityScheduler } from './queue-utils-priority';
export { QueueStatistics } from './queue-utils-monitoring';
export { QueueMonitor } from './queue-utils-health';

/**
 * Job creation utilities
 */
export class JobUtils {
  private static queueManager = getQueueManager();

  /**
   * Create a single page scraping job
   */
  static async createSinglePageJob(
    url: string,
    options: {
      customerId?: string;
      isNewCustomer?: boolean;
      config?: any;
      priority?: JobPriority;
      delay?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ jobId: string; deduplicated: boolean }> {
    const jobData: SinglePageJobData = {
      type: 'single-page',
      url,
      customerId: options.customerId || '',
      metadata: {
        ...options.metadata,
        isNewCustomer: options.isNewCustomer || false,
        config: options.config,
      },
      createdAt: new Date().toISOString(),
    };

    const jobOptions: any = {};
    if (options.priority) jobOptions.priority = options.priority;
    if (options.delay) jobOptions.delay = options.delay;

    const job = await this.queueManager.addJob(jobData, jobOptions);
    return {
      jobId: job.id ?? '',
      deduplicated: false
    };
  }

  /**
   * Create a full crawl job
   */
  static async createFullCrawlJob(
    url: string,
    options: {
      customerId?: string;
      isNewCustomer?: boolean;
      maxPages?: number;
      depth?: number;
      includeSubdomains?: boolean;
      config?: any;
      priority?: JobPriority;
      delay?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ jobId: string; deduplicated: boolean }> {
    const jobData: FullCrawlJobData = {
      type: 'full-crawl',
      url,
      customerId: options.customerId || '',
      maxPages: options.maxPages || 100,
      depth: options.depth || 3,
      metadata: {
        ...options.metadata,
        isNewCustomer: options.isNewCustomer || false,
        includeSubdomains: options.includeSubdomains || false,
        config: options.config,
      },
      createdAt: new Date().toISOString(),
    };

    const jobOptions: any = {};
    if (options.priority) jobOptions.priority = options.priority;
    if (options.delay) jobOptions.delay = options.delay;

    const job = await this.queueManager.addJob(jobData, jobOptions);
    return {
      jobId: job.id ?? '',
      deduplicated: false
    };
  }

  /**
   * Create a refresh job
   */
  static async createRefreshJob(
    url: string,
    options: {
      customerId?: string;
      lastCrawledAt?: Date;
      forceRefresh?: boolean;
      fullRefresh?: boolean;
      config?: any;
      priority?: JobPriority;
      delay?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ jobId: string; deduplicated: boolean }> {
    const jobData: RefreshJobData = {
      type: 'refresh',
      urls: [url],
      customerId: options.customerId || '',
      forceRefresh: options.forceRefresh || false,
      metadata: {
        ...options.metadata,
        lastCrawledAt: options.lastCrawledAt,
        config: {
          ...options.config,
          fullRefresh: options.fullRefresh || false,
        },
      },
      createdAt: new Date().toISOString(),
    };

    const jobOptions: any = {};
    if (options.priority) jobOptions.priority = options.priority;
    if (options.delay) jobOptions.delay = options.delay;

    const job = await this.queueManager.addJob(jobData, jobOptions);
    return {
      jobId: job.id ?? '',
      deduplicated: false
    };
  }

  /**
   * Schedule a recurring refresh job
   */
  static async createRecurringRefreshJob(
    url: string,
    cronPattern: string,
    options: {
      customerId?: string;
      config?: any;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const jobData: RefreshJobData = {
      type: 'refresh',
      urls: [url],
      customerId: options.customerId || '',
      forceRefresh: true,
      metadata: {
        ...options.metadata,
        config: options.config,
        recurring: true,
        cronPattern,
      },
      createdAt: new Date().toISOString(),
    };

    const job = await this.queueManager.addJob(jobData, {});
    return job.id ?? '';
  }

  /**
   * Batch create jobs for multiple URLs
   */
  static async createBatchJobs(
    urls: string[],
    jobType: JobType,
    options: {
      customerId?: string;
      isNewCustomer?: boolean;
      config?: any;
      priority?: JobPriority;
      staggerDelay?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ jobId: string; url: string; deduplicated: boolean }[]> {
    const results = [];
    const staggerDelay = options.staggerDelay || 1000;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const delay = i * staggerDelay;

      let result;
      switch (jobType) {
        case 'single-page':
          result = await this.createSinglePageJob(url || '', { ...options, delay });
          break;
        case 'full-crawl':
          result = await this.createFullCrawlJob(url || '', { ...options, delay });
          break;
        case 'refresh':
          result = await this.createRefreshJob(url || '', { ...options, delay });
          break;
        default:
          throw new Error(`Unsupported job type: ${jobType}`);
      }

      results.push({
        jobId: result?.jobId || '',
        url: url || '',
        deduplicated: result?.deduplicated || false
      });
    }

    return results;
  }
}

/**
 * Export all utilities as a single object for convenience
 */
export const QueueUtils = {
  JobUtils,
  QueueMonitor: QueueMonitorClass,
} as const;
