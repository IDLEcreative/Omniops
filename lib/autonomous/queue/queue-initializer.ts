/**
 * Queue Initializer
 *
 * Handles BullMQ queue initialization and configuration setup.
 *
 * @module lib/autonomous/queue/queue-initializer
 */

import { Queue, QueueOptions } from 'bullmq';
import { createRedisClient } from '@/lib/redis';
import { OperationQueueConfig } from './types';

/**
 * Normalized queue configuration with all defaults applied
 */
export interface NormalizedQueueConfig {
  queueName: string;
  redisUrl: string;
  maxConcurrency: number;
  defaultJobOptions: {
    attempts: number;
    backoffDelay: number;
    timeout: number;
  };
  enableMetrics: boolean;
  rateLimitPerOrg: number;
}

/**
 * Normalize queue configuration with defaults
 */
export function normalizeQueueConfig(config: OperationQueueConfig = {}): NormalizedQueueConfig {
  return {
    queueName: config.queueName || 'autonomous-operations',
    redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
    maxConcurrency: config.maxConcurrency || 2, // Limit concurrent browser operations
    defaultJobOptions: {
      attempts: config.defaultJobOptions?.attempts || 3,
      backoffDelay: config.defaultJobOptions?.backoffDelay || 5000, // 5 seconds
      timeout: config.defaultJobOptions?.timeout || 300000, // 5 minutes
    },
    enableMetrics: config.enableMetrics !== false,
    rateLimitPerOrg: config.rateLimitPerOrg || 10, // 10 operations per hour per org
  };
}

/**
 * Initialize BullMQ queue with proper configuration
 *
 * @param config Normalized queue configuration
 * @returns Initialized BullMQ Queue instance
 *
 * @example
 * const config = normalizeQueueConfig({ queueName: 'my-queue' });
 * const queue = initializeQueue(config);
 */
export function initializeQueue(config: NormalizedQueueConfig): Queue {
  // Initialize Redis connection
  const connection = createRedisClient();

  // Configure BullMQ queue options
  const queueOptions: QueueOptions = {
    connection: connection as any,
    defaultJobOptions: {
      attempts: config.defaultJobOptions.attempts,
      backoff: {
        type: 'exponential',
        delay: config.defaultJobOptions.backoffDelay,
      },
      removeOnComplete: false, // Keep for audit trail
      removeOnFail: false, // Keep for debugging
      timeout: config.defaultJobOptions.timeout,
    },
  };

  return new Queue(config.queueName, queueOptions);
}

/**
 * Set up event listeners for queue monitoring
 *
 * @param queue BullMQ Queue instance
 *
 * @example
 * const queue = initializeQueue(config);
 * setupQueueEventListeners(queue);
 */
export function setupQueueEventListeners(queue: Queue): void {
  queue.on('added', (job) => {
    console.log(`[OperationQueue] Job added to queue: ${job.id}`);
  });

  queue.on('waiting', (jobId) => {
    console.log(`[OperationQueue] Job waiting: ${jobId}`);
  });

  queue.on('error', (error) => {
    console.error('[OperationQueue] Queue error:', error);
  });
}
