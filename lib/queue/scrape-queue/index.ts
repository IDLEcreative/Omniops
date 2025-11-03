/**
 * Scrape Queue Management System
 * Handles job creation, deduplication, and queue management for web scraping operations
 */

import { ScrapeQueueManager } from './manager/index';

/**
 * Export singleton getter function
 */
export function getQueueManager(queueName?: string): ScrapeQueueManager {
  return ScrapeQueueManager.getInstance(queueName);
}

/**
 * Export default instance
 */
export default ScrapeQueueManager;
export { ScrapeQueueManager };

// Re-export types for convenience
export type {
  ScrapeJobData,
  ScrapeJobResult,
  QueueStats,
  AddJobOptions,
  CleanupOptions,
  DeduplicationStats,
  QueueMetrics,
} from '../scrape-queue-types';
