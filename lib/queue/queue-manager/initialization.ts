/**
 * Queue Manager - Initialization Logic
 */

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../logger';
import type { JobData, QueueManagerConfig } from '../types';
import { DEFAULT_CONFIG, REMOVAL_SETTINGS, REDIS_SETTINGS } from './constants';

/**
 * Create Redis configuration from URL
 */
export function createRedisConfig(redisUrl: string) {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    db: REDIS_SETTINGS.db,
    retryStrategy: REDIS_SETTINGS.retryStrategy,
    enableReadyCheck: REDIS_SETTINGS.enableReadyCheck,
    maxRetriesPerRequest: REDIS_SETTINGS.maxRetriesPerRequest,
  };
}

/**
 * Initialize queue, events, and Redis client
 */
export async function initializeQueue(
  config: Required<QueueManagerConfig>
): Promise<{
  queue: Queue<JobData>;
  queueEvents: QueueEvents;
  redis: Redis;
}> {
  const redisConfig = createRedisConfig(config.redisUrl);

  // Create Redis client
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: REDIS_SETTINGS.maxRetriesPerRequest,
    retryStrategy: REDIS_SETTINGS.retryStrategy,
  });

  // Create queue
  const queue = new Queue<JobData>(config.queueName, {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: config.defaultJobOptions.attempts,
      backoff: {
        type: 'exponential',
        delay: config.defaultJobOptions.backoffDelay,
      },
      removeOnComplete: REMOVAL_SETTINGS.onComplete,
      removeOnFail: REMOVAL_SETTINGS.onFail,
    },
  });

  // Create queue events
  const queueEvents = new QueueEvents(config.queueName, {
    connection: redisConfig,
  });

  // Wait for queue to be ready
  await queue.waitUntilReady();

  logger.info(`Queue manager initialized: ${config.queueName}`);

  return { queue, queueEvents, redis };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(config: QueueManagerConfig = {}): Required<QueueManagerConfig> {
  return {
    queueName: config.queueName || DEFAULT_CONFIG.queueName,
    redisUrl: config.redisUrl || DEFAULT_CONFIG.redisUrl,
    maxConcurrency: config.maxConcurrency || DEFAULT_CONFIG.maxConcurrency,
    defaultJobOptions: {
      attempts: config.defaultJobOptions?.attempts || DEFAULT_CONFIG.defaultJobOptions.attempts,
      backoffDelay: config.defaultJobOptions?.backoffDelay || DEFAULT_CONFIG.defaultJobOptions.backoffDelay,
      timeout: config.defaultJobOptions?.timeout || DEFAULT_CONFIG.defaultJobOptions.timeout,
    },
    enableMetrics: config.enableMetrics ?? DEFAULT_CONFIG.enableMetrics,
  };
}
