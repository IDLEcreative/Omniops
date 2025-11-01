/**
 * Queue Manager - Public API
 */

// Export core class
export { QueueManager } from './core';

// Re-export types from parent directory
export type {
  JobType,
  JobStatus,
  BaseJobData,
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobData,
  QueueManagerConfig,
} from '../types';

// Re-export JobPriority enum
export { JobPriority } from '../types';

// Export helper functions
import { QueueManager } from './core';
import type { QueueManagerConfig } from '../types';

/**
 * Get queue manager instance
 */
export function getQueueManager(
  queueName?: string,
  config?: QueueManagerConfig
): QueueManager {
  return QueueManager.getInstance(queueName, config);
}

/**
 * Create a new queue manager
 */
export function createQueueManager(
  queueName: string,
  config?: QueueManagerConfig
): QueueManager {
  return QueueManager.getInstance(queueName, config);
}
