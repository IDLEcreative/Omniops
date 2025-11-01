/**
 * Queue initialization operations
 */

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../../logger';
import {
  createRedisClient,
  createRedisConfig,
  setupEventListeners,
  getDefaultJobOptions,
} from '../../scrape-queue-workers';
import type { ScrapeJobData, ScrapeJobResult } from '../../scrape-queue-types';

export interface InitializationContext {
  redis: Redis | null;
  queue: Queue<ScrapeJobData, ScrapeJobResult> | null;
  queueEvents: QueueEvents | null;
  isInitialized: boolean;
}

/**
 * Initialize the queue manager
 */
export async function initializeQueue(
  context: InitializationContext,
  queueName: string
): Promise<void> {
  if (context.isInitialized) {
    return;
  }

  try {
    // Create Redis connection
    context.redis = createRedisClient();

    // Create queue
    context.queue = new Queue<ScrapeJobData, ScrapeJobResult>(queueName, {
      connection: createRedisConfig(),
      defaultJobOptions: getDefaultJobOptions(),
    });

    // Create queue events listener
    context.queueEvents = new QueueEvents(queueName, {
      connection: createRedisConfig(),
    });

    // Setup event listeners
    setupEventListeners(context.queueEvents);

    // Wait for queue to be ready
    await context.queue.waitUntilReady();

    context.isInitialized = true;
    logger.info(`Queue manager initialized for queue: ${queueName}`);
  } catch (error) {
    logger.error('Failed to initialize queue manager:', error);
    throw error;
  }
}
