/**
 * Queue Manager - Configuration Constants
 */

import type { QueueManagerConfig } from '../types';

/**
 * Default queue manager configuration
 */
export const DEFAULT_CONFIG: Required<QueueManagerConfig> = {
  queueName: 'scraper-queue',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  maxConcurrency: 5,
  defaultJobOptions: {
    attempts: 3,
    backoffDelay: 2000,
    timeout: 60000,
  },
  enableMetrics: true,
};

/**
 * Job removal settings
 */
export const REMOVAL_SETTINGS = {
  onComplete: {
    age: 24 * 3600, // 24 hours
    count: 100,
  },
  onFail: {
    age: 7 * 24 * 3600, // 7 days
  },
};

/**
 * Redis connection settings
 */
export const REDIS_SETTINGS = {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 100, 10000),
  enableReadyCheck: true,
  db: 0,
};
