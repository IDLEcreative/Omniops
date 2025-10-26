import * as os from 'os';
import { logger } from '../logger';
import { MemoryUsage, RedisConnectionConfig } from './scraper-worker-service-types';

/**
 * Get current memory usage
 */
export function getMemoryUsage(): MemoryUsage {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();

  return {
    used: memoryUsage.heapUsed,
    total: totalMemory,
    percentUsed: memoryUsage.heapUsed / totalMemory,
  };
}

/**
 * Create Redis connection configuration
 */
export function createRedisConnection(): RedisConnectionConfig {
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
    lazyConnect: true,
  };
}

/**
 * Parse environment variable to integer with default
 */
export function parseEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value) : defaultValue;
}

/**
 * Parse environment variable to float with default
 */
export function parseEnvFloat(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseFloat(value) : defaultValue;
}

/**
 * Calculate default worker count based on CPU cores
 */
export function calculateDefaultWorkerCount(): number {
  return Math.max(1, Math.floor(os.cpus().length / 2));
}
