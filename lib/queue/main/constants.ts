/**
 * Queue system constants and configurations
 */

import { JobPriority } from '../queue-manager';

/**
 * Configuration constants
 */
export const QUEUE_CONFIG = {
  DEFAULT_QUEUE_NAME: 'scraper-queue',
  DEFAULT_CONCURRENCY: 5,
  DEFAULT_JOB_TTL: 3600, // 1 hour
  DEFAULT_RESULT_TTL: 86400, // 24 hours
  DEFAULT_DEDUPLICATION_TTL: 3600, // 1 hour
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY: 2000, // 2 seconds
} as const;

/**
 * Common job patterns and presets
 */
export const JOB_PATTERNS = {
  // Single page scraping for new customers (high priority)
  NEW_CUSTOMER_SCRAPE: {
    type: 'single-page' as const,
    priority: JobPriority.HIGH,
    config: {
      turboMode: true,
      timeout: 30000,
    },
  },

  // Full site crawl (lower priority, resource intensive)
  FULL_SITE_CRAWL: {
    type: 'full-crawl' as const,
    priority: JobPriority.LOW,
    config: {
      maxPages: 100,
      depth: 3,
      respectRobotsTxt: true,
      delay: 1000,
    },
  },

  // Refresh existing content
  CONTENT_REFRESH: {
    type: 'refresh' as const,
    priority: JobPriority.NORMAL,
    config: {
      forceRefresh: true,
      compareContent: true,
    },
  },
} as const;

/**
 * Error types that can occur in the queue system
 */
export enum QueueErrorType {
  INVALID_JOB_DATA = 'INVALID_JOB_DATA',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  QUEUE_CONNECTION_ERROR = 'QUEUE_CONNECTION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  DEDUPLICATION_ERROR = 'DEDUPLICATION_ERROR',
  MAINTENANCE_ERROR = 'MAINTENANCE_ERROR',
}

/**
 * Queue system events that can be monitored
 */
export enum QueueEvent {
  JOB_CREATED = 'job:created',
  JOB_STARTED = 'job:started',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',
  JOB_STALLED = 'job:stalled',
  JOB_PROGRESS = 'job:progress',
  QUEUE_PAUSED = 'queue:paused',
  QUEUE_RESUMED = 'queue:resumed',
  MAINTENANCE_STARTED = 'maintenance:started',
  MAINTENANCE_COMPLETED = 'maintenance:completed',
}

/**
 * Type definitions for the queue system
 */
export type QueueSystemEvent = {
  event: QueueEvent;
  jobId?: string;
  data?: any;
  timestamp: Date;
  metadata?: Record<string, any>;
};
