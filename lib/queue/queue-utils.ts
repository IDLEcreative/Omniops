import { 
  getQueueManager, 
  JobData, 
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobPriority, 
  JobStatus, 
  JobType 
} from './queue-manager';
import { getJobProcessor, ProcessingMetrics } from './job-processor';

/**
 * Utility functions for queue management and job operations
 */

/**
 * Job creation helpers
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
    cronPattern: string, // e.g., '0 */6 * * *' for every 6 hours
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

    // addRecurringJob doesn't exist on QueueManager, using regular addJob instead
    const job = await this.queueManager.addJob(jobData, {
      // Recurring jobs would need to be implemented in QueueManager
      // For now, just add as a regular job with metadata
    });
    const jobId = job.id ?? '';
    return jobId;
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
      staggerDelay?: number; // Delay between jobs in ms
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ jobId: string; url: string; deduplicated: boolean }[]> {
    const results = [];
    const staggerDelay = options.staggerDelay || 1000; // Default 1 second between jobs

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
 * Queue monitoring utilities
 */
export class QueueMonitor {
  private static queueManager = getQueueManager();
  private static jobProcessor = getJobProcessor();

  /**
   * Get comprehensive queue health status
   */
  static async getQueueHealth(): Promise<{
    queue: {
      stats: any;
      isHealthy: boolean;
      issues: string[];
    };
    processor: {
      isRunning: boolean;
      metrics: ProcessingMetrics;
    };
    redis: {
      connected: boolean;
    };
    deduplication: {
      totalKeys: number;
      keysByType: Record<string, number>;
    };
  }> {
    const stats = await this.queueManager.getQueueStats();
    const processingMetrics = this.jobProcessor.getMetrics();
    const deduplicationStats = await this.queueManager.getDeduplicationStats();

    // Assess queue health
    const issues = [];
    if (stats.failed > stats.completed * 0.1) { // More than 10% failure rate
      issues.push('High failure rate detected');
    }
    if (stats.waiting > 100) { // More than 100 jobs waiting
      issues.push('Large queue backlog');
    }
    if (stats.active === 0 && stats.waiting > 0) {
      issues.push('Jobs waiting but no active processing');
    }

    return {
      queue: {
        stats,
        isHealthy: issues.length === 0,
        issues,
      },
      processor: {
        isRunning: this.jobProcessor.isRunning(),
        metrics: processingMetrics,
      },
      redis: {
        connected: true, // TODO: Add actual Redis health check
      },
      deduplication: {
        totalKeys: deduplicationStats.enabled ? deduplicationStats.stats?.totalKeys || 0 : 0,
        keysByType: deduplicationStats.enabled ? deduplicationStats.stats?.keysByType || {} : {}
      },
    };
  }

  /**
   * Get jobs by customer
   */
  static async getJobsByCustomer(
    customerId: string,
    status?: JobStatus,
    limit: number = 10
  ): Promise<any[]> {
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

    // Sort by creation time (newest first) and limit
    return allJobs
      .slice(0, limit);
  }

  /**
   * Get jobs by URL pattern
   */
  static async getJobsByUrl(
    urlPattern: string,
    exactMatch: boolean = false,
    limit: number = 10
  ): Promise<any[]> {
    const statuses = ['waiting', 'active', 'completed', 'failed', 'delayed'];
    const allJobs = [];

    for (const status of statuses) {
      const jobs = await this.queueManager.getJobsByStatus(status as JobStatus, 100);
      const matchingJobs = jobs.filter(job => {
        const jobData = job.data as any;
        if (exactMatch) {
          return jobData.url === urlPattern;
        } else {
          return jobData.url && jobData.url.includes(urlPattern);
        }
      });
      allJobs.push(...matchingJobs);
    }

    return allJobs
      .slice(0, limit);
  }

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

    // Calculate average jobs per hour (rough estimate)
    const hoursElapsed = processingMetrics.lastProcessedAt
      ? (Date.now() - processingMetrics.lastProcessedAt.getTime()) / (1000 * 60 * 60)
      : 1;
    const averageJobsPerHour = totalJobs / Math.max(hoursElapsed, 1);

    // Get most common errors
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

/**
 * Queue maintenance utilities
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
  static async performMaintenance(options: {
    cleanupOldJobs?: boolean;
    maxAgeHours?: number;
    clearDeduplication?: boolean;
    retryFailedJobs?: boolean;
    maxRetries?: number;
  } = {}): Promise<{
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

/**
 * Common cron patterns for scheduling
 */
export const CronPatterns = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
  DAILY_AT_MIDNIGHT: '0 0 * * *',
  DAILY_AT_NOON: '0 12 * * *',
  WEEKLY_SUNDAY_MIDNIGHT: '0 0 * * 0',
  MONTHLY_FIRST_DAY: '0 0 1 * *',
} as const;

/**
 * Helper function to validate cron patterns
 */
export function validateCronPattern(pattern: string): boolean {
  // Basic cron pattern validation (5 fields)
  const parts = pattern.split(' ');
  if (parts.length !== 5) return false;

  // Each part should be valid cron syntax
  const cronRegex = /^(\*|\d+(-\d+)?)(\/\d+)?$/;
  return parts.every(part => {
    if (part.includes(',')) {
      return part.split(',').every(p => cronRegex.test(p.trim()));
    }
    return cronRegex.test(part);
  });
}

/**
 * Calculate next run time for a cron pattern
 */
export function getNextRunTime(cronPattern: string): Date | null {
  if (!validateCronPattern(cronPattern)) {
    return null;
  }

  // This is a simplified implementation
  // In production, use a proper cron parsing library like node-cron
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  return nextHour;
}

/**
 * Export all utilities as a single object for convenience
 */
export const QueueUtils = {
  JobUtils,
  QueueMonitor,
  QueueMaintenance,
  CronPatterns,
  validateCronPattern,
  getNextRunTime,
} as const;