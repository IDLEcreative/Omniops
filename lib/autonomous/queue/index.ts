/**
 * Autonomous Operations Queue System
 *
 * Production-ready job queue for autonomous agent operations.
 *
 * @module lib/autonomous/queue
 */

// Types
export * from './types';

// Queue Manager
export {
  OperationQueueManager,
  getOperationQueueManager,
  createOperationQueueManager,
} from './operation-queue-manager';

// Job Processor
export {
  OperationJobProcessor,
  getOperationJobProcessor,
  createOperationJobProcessor,
  startOperationProcessing,
} from './operation-job-processor';
