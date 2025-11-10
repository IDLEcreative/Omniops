/**
 * Operation Queue Manager
 *
 * Manages queueing and processing of autonomous agent operations using BullMQ.
 * Coordinates between queue initialization, job management, monitoring, and rate limiting.
 *
 * @module lib/autonomous/queue/operation-queue-manager
 */

import { Queue } from 'bullmq';
import {
  OperationJobData,
  OperationQueueConfig,
  OperationQueueStats,
  OperationQueueHealth,
} from './types';
import {
  normalizeQueueConfig,
  initializeQueue,
  setupQueueEventListeners,
  NormalizedQueueConfig,
} from './queue-initializer';
import {
  addJobToQueue,
  getJobStatus as getJobStatusFromQueue,
  cancelJob,
  retryJob,
} from './job-manager';
import {
  getQueueStats,
  getQueueHealth,
  pauseQueue,
  resumeQueue,
  cleanOldJobs,
  closeQueue,
} from './queue-monitor';
import { checkRateLimit } from './rate-limiter';

// ============================================================================
// Operation Queue Manager Class
// ============================================================================

/**
 * Operation Queue Manager
 *
 * Central coordinator for autonomous operations queue.
 * Delegates to specialized modules for initialization, job management,
 * monitoring, and rate limiting.
 *
 * @example
 * const queueManager = new OperationQueueManager({
 *   queueName: 'my-operations',
 *   maxConcurrency: 5
 * });
 *
 * await queueManager.addOperation({
 *   operationId: 'op-123',
 *   organizationId: 'org-456',
 *   userId: 'user-789',
 *   service: 'shopify',
 *   operation: 'api_credential_generation',
 *   jobType: 'shopify_setup',
 *   config: { storeUrl: 'mystore.myshopify.com' }
 * });
 */
export class OperationQueueManager {
  private queue: Queue;
  private config: NormalizedQueueConfig;

  constructor(config: OperationQueueConfig = {}) {
    // Normalize configuration with defaults
    this.config = normalizeQueueConfig(config);

    // Initialize BullMQ queue
    this.queue = initializeQueue(this.config);

    // Set up event listeners
    setupQueueEventListeners(this.queue);
  }

  /**
   * Add operation to queue
   *
   * @param data Operation job data
   * @returns Job ID
   *
   * @example
   * const jobId = await queueManager.addOperation({
   *   operationId: 'op-123',
   *   organizationId: 'org-456',
   *   userId: 'user-789',
   *   service: 'shopify',
   *   operation: 'api_credential_generation',
   *   jobType: 'shopify_setup',
   *   priority: OperationPriority.HIGH,
   *   config: { storeUrl: 'mystore.myshopify.com' }
   * });
   */
  async addOperation(data: OperationJobData): Promise<string> {
    // Check rate limit for organization
    await checkRateLimit(this.queue, data.organizationId, this.config.rateLimitPerOrg);

    // Add job to queue
    return addJobToQueue(this.queue, data);
  }

  /**
   * Get job status
   *
   * @param jobId Job ID to query
   * @returns Job status information or null if not found
   */
  async getJobStatus(jobId: string): Promise<any> {
    return getJobStatusFromQueue(this.queue, jobId);
  }

  /**
   * Cancel a pending or active operation
   *
   * @param jobId Job ID to cancel
   * @returns true if cancelled, false if job not found
   */
  async cancelOperation(jobId: string): Promise<boolean> {
    return cancelJob(this.queue, jobId);
  }

  /**
   * Retry a failed operation
   *
   * @param jobId Job ID to retry
   * @returns true if retried, false if job not found
   */
  async retryOperation(jobId: string): Promise<boolean> {
    return retryJob(this.queue, jobId);
  }

  /**
   * Get queue statistics
   *
   * @returns Queue statistics with job counts
   */
  async getStats(): Promise<OperationQueueStats> {
    return getQueueStats(this.queue);
  }

  /**
   * Get queue health status
   *
   * @returns Queue health information
   */
  async getHealth(): Promise<OperationQueueHealth> {
    return getQueueHealth(this.queue, this.config.queueName);
  }

  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    return pauseQueue(this.queue);
  }

  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    return resumeQueue(this.queue);
  }

  /**
   * Clean old completed/failed jobs
   *
   * @param age Maximum age in milliseconds (default: 7 days)
   */
  async clean(age: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    return cleanOldJobs(this.queue, age);
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    return closeQueue(this.queue);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let queueManagerInstance: OperationQueueManager | null = null;

/**
 * Get singleton queue manager instance
 *
 * @param config Optional configuration (only used on first call)
 * @returns Singleton OperationQueueManager instance
 *
 * @example
 * const queueManager = getOperationQueueManager();
 * await queueManager.addOperation(...);
 */
export function getOperationQueueManager(config?: OperationQueueConfig): OperationQueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new OperationQueueManager(config);
  }
  return queueManagerInstance;
}

/**
 * Create new queue manager instance (for testing)
 *
 * @param config Optional configuration
 * @returns New OperationQueueManager instance
 *
 * @example
 * const testQueueManager = createOperationQueueManager({
 *   queueName: 'test-queue',
 *   redisUrl: 'redis://localhost:6380'
 * });
 */
export function createOperationQueueManager(config?: OperationQueueConfig): OperationQueueManager {
  return new OperationQueueManager(config);
}
