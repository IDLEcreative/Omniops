/**
 * Queue Management System - Main Export File
 * 
 * This file exports all the components of the BullMQ-based queue management system.
 * Import from here to get access to all queue functionality.
 */

// Import everything we need
import {
  QueueManager,
  getQueueManager,
  createQueueManager,
  JobPriority,
  type JobType,
  type JobData,
  type SinglePageJobData,
  type FullCrawlJobData,
  type RefreshJobData,
  type JobStatus,
  type BaseJobData,
  type QueueManagerConfig,
} from './queue-manager';

import {
  JobProcessor,
  getJobProcessor,
  createJobProcessor,
  startJobProcessing,
  type JobResult,
  type ProgressUpdate,
  type JobProcessorConfig,
  type ProcessingMetrics,
} from './job-processor';

import {
  JobUtils,
  QueueMonitor,
  QueueMaintenance,
  QueueUtils,
  CronPatterns,
  validateCronPattern,
  getNextRunTime,
} from './queue-utils';

// Core queue management
export {
  QueueManager,
  getQueueManager,
  createQueueManager,
  JobPriority,
  type JobType,
  type JobData,
  type SinglePageJobData,
  type FullCrawlJobData,
  type RefreshJobData,
  type JobStatus,
  type BaseJobData,
  type QueueManagerConfig,
} from './queue-manager';

// Job processing
export {
  JobProcessor,
  getJobProcessor,
  createJobProcessor,
  startJobProcessing,
  type JobResult,
  type ProgressUpdate,
  type JobProcessorConfig,
  type ProcessingMetrics,
} from './job-processor';

// Utility functions and helpers
export {
  JobUtils,
  QueueMonitor,
  QueueMaintenance,
  QueueUtils,
  CronPatterns,
  validateCronPattern,
  getNextRunTime,
} from './queue-utils';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { JobUtils, QueueMonitor, JobPriority } from '@/lib/queue';
 * 
 * // Create a high-priority job for a new customer
 * const result = await JobUtils.createSinglePageJob('https://example.com', {
 *   customerId: 'customer-123',
 *   isNewCustomer: true,
 *   priority: JobPriority.HIGH
 * });
 * 
 * // Monitor queue health
 * const health = await QueueMonitor.getQueueHealth();
 * console.log('Queue is healthy:', health.queue.isHealthy);
 * ```
 * 
 * API Endpoints:
 * - GET /api/jobs - List jobs and statistics
 * - POST /api/jobs - Create jobs (single, batch, recurring)  
 * - GET /api/jobs/[jobId] - Get job status
 * - PUT /api/jobs/[jobId] - Update job (pause/resume/cancel)
 * - DELETE /api/jobs/[jobId] - Cancel job
 * - GET /api/queue - Queue health and statistics
 * - POST /api/queue - Queue operations (maintenance, pause, resume)
 * - DELETE /api/queue - Cleanup operations
 */

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

/**
 * Health check function for the entire queue system
 */
export async function checkQueueSystemHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  components: {
    queueManager: boolean;
    jobProcessor: boolean;
    redis: boolean;
    deduplication: boolean;
  };
}> {
  const issues: string[] = [];
  const components = {
    queueManager: false,
    jobProcessor: false,
    redis: false,
    deduplication: false,
  };

  try {
    // Test queue manager
    const queueManager = getQueueManager();
    await queueManager.getQueueStats();
    components.queueManager = true;
  } catch (error) {
    issues.push('Queue manager not accessible');
  }

  try {
    // Test job processor
    const jobProcessor = getJobProcessor();
    components.jobProcessor = jobProcessor.isRunning();
    if (!components.jobProcessor) {
      issues.push('Job processor not running');
    }
  } catch (error) {
    issues.push('Job processor not accessible');
  }

  try {
    // Test Redis connection indirectly through queue operations
    const health = await QueueMonitor.getQueueHealth();
    components.redis = health.redis.connected;
    if (!components.redis) {
      issues.push('Redis connection issues');
    }
  } catch (error) {
    issues.push('Cannot verify Redis connection');
  }

  try {
    // Test deduplication
    const queueManager = getQueueManager();
    await queueManager.getDeduplicationStats();
    components.deduplication = true;
  } catch (error) {
    issues.push('Deduplication system issues');
  }

  return {
    healthy: issues.length === 0,
    issues,
    components,
  };
}

/**
 * Initialize the queue system with default configuration
 */
export async function initializeQueueSystem(config?: {
  queueName?: string;
  concurrency?: number;
  autoStartProcessing?: boolean;
}): Promise<{
  queueManager: QueueManager;
  jobProcessor: JobProcessor;
  initialized: boolean;
}> {
  const queueName = config?.queueName || QUEUE_CONFIG.DEFAULT_QUEUE_NAME;
  const concurrency = config?.concurrency || QUEUE_CONFIG.DEFAULT_CONCURRENCY;

  try {
    // Initialize queue manager
    const queueManager = createQueueManager(queueName, {
      maxConcurrency: concurrency,
    });

    // Initialize job processor
    const jobProcessor = createJobProcessor(queueName, {
      maxConcurrency: concurrency,
    });

    return {
      queueManager,
      jobProcessor,
      initialized: true,
    };
  } catch (error) {
    console.error('Failed to initialize queue system:', error);
    throw new Error('Queue system initialization failed');
  }
}