/**
 * Worker management and event handling for scrape queue
 */

import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logger';
import type { RedisConfig } from './scrape-queue-types';

/**
 * Create Redis client with error handling
 */
export function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 10000),
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('error', (error) => {
    logger.error('Redis client error:', error);
  });

  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  return redis;
}

/**
 * Create Redis configuration for BullMQ
 */
export function createRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    db: 0,
    retryStrategy: (times: number) => Math.min(times * 100, 10000),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    lazyConnect: false,
  };
}

/**
 * Setup event listeners for queue events
 */
export function setupEventListeners(queueEvents: QueueEvents): void {
  queueEvents.on('waiting', ({ jobId }) => {
    logger.debug(`Job ${jobId} is waiting`);
  });

  queueEvents.on('active', ({ jobId, prev }) => {
    logger.info(`Job ${jobId} is active (prev: ${prev})`);
  });

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    logger.info(`Job ${jobId} completed`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed: ${failedReason}`);
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    logger.debug(`Job ${jobId} progress: ${data}`);
  });

  queueEvents.on('stalled', ({ jobId }) => {
    logger.warn(`Job ${jobId} stalled`);
  });
}

/**
 * Get default job options for the queue
 */
export function getDefaultJobOptions() {
  return {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  };
}
