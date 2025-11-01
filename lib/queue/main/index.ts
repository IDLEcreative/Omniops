/**
 * Queue Management System - Main Export File
 *
 * This file exports all the components of the BullMQ-based queue management system.
 * Import from here to get access to all queue functionality.
 */

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
} from '../queue-manager';

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
} from '../job-processor';

// Utility functions and helpers
export {
  JobUtils,
  QueueMonitor,
  QueueMaintenance,
  QueueUtils,
  CronPatterns,
  validateCronPattern,
  getNextRunTime,
} from '../queue-utils';

// Constants and configurations
export * from './constants';

// Health checking
export { checkQueueSystemHealth } from './health-check';

// Initialization
export { initializeQueueSystem } from './initialization';
