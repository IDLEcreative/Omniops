/**
 * Type definitions and constants for queue utilities
 *
 * Extracted from queue-utils.ts for modularity
 */

// Re-export types from queue-manager
export type { JobStatus, JobType } from './queue-manager';
export { JobPriority } from './queue-manager';

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
 * Job creation result interface
 */
export interface JobCreationResult {
  jobId: string;
  deduplicated: boolean;
}

/**
 * Batch job creation result interface
 */
export interface BatchJobResult {
  jobId: string;
  url: string;
  deduplicated: boolean;
}

/**
 * Queue health status interface
 */
export interface QueueHealthStatus {
  queue: {
    stats: any;
    isHealthy: boolean;
    issues: string[];
  };
  processor: {
    isRunning: boolean;
    metrics: any;
  };
  redis: {
    connected: boolean;
  };
  deduplication: {
    totalKeys: number;
    keysByType: Record<string, number>;
  };
}

/**
 * Processing statistics interface
 */
export interface ProcessingStatistics {
  queue: any;
  processing: any;
  performance: {
    averageJobsPerHour: number;
    successRate: number;
    mostCommonErrors: Array<{ type: string; count: number }>;
  };
}

/**
 * Maintenance result interface
 */
export interface MaintenanceResult {
  cleaned?: number;
  cleared?: number;
  retried?: number;
  summary: string;
}

/**
 * Maintenance options interface
 */
export interface MaintenanceOptions {
  cleanupOldJobs?: boolean;
  maxAgeHours?: number;
  clearDeduplication?: boolean;
  retryFailedJobs?: boolean;
  maxRetries?: number;
}

/**
 * Job creation options interface
 */
export interface JobCreationOptions {
  customerId?: string;
  isNewCustomer?: boolean;
  config?: any;
  priority?: any; // JobPriority from queue-manager
  delay?: number;
  metadata?: Record<string, any>;
}

/**
 * Full crawl options interface
 */
export interface FullCrawlOptions extends JobCreationOptions {
  maxPages?: number;
  depth?: number;
  includeSubdomains?: boolean;
}

/**
 * Refresh job options interface
 */
export interface RefreshJobOptions extends JobCreationOptions {
  lastCrawledAt?: Date;
  forceRefresh?: boolean;
  fullRefresh?: boolean;
}

/**
 * Batch job options interface
 */
export interface BatchJobOptions extends JobCreationOptions {
  staggerDelay?: number;
}

/**
 * Recurring job options interface
 */
export interface RecurringJobOptions {
  customerId?: string;
  config?: any;
  metadata?: Record<string, any>;
}
