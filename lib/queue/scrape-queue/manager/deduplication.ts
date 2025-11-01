/**
 * Job deduplication operations
 */

import Redis from 'ioredis';
import type { ScrapeJobData, DeduplicationStats } from '../../scrape-queue-types';

/**
 * Get deduplication key for a job
 */
export function getDeduplicationKey(data: ScrapeJobData): string {
  return `dedup:${data.organizationId}:${data.url}`;
}

/**
 * Check if a similar job already exists
 */
export async function checkDuplicateJob(redis: Redis | null, data: ScrapeJobData): Promise<boolean> {
  if (!redis) return false;

  const key = getDeduplicationKey(data);
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Store job for deduplication
 */
export async function storeJobForDeduplication(
  redis: Redis | null,
  data: ScrapeJobData,
  ttl: number
): Promise<void> {
  if (!redis) return;

  const key = getDeduplicationKey(data);
  await redis.setex(
    key,
    ttl,
    JSON.stringify({
      url: data.url,
      organizationId: data.organizationId,
      timestamp: Date.now(),
    })
  );
}

/**
 * Get deduplication statistics
 */
export async function getDeduplicationStats(redis: Redis | null): Promise<DeduplicationStats> {
  if (!redis) {
    throw new Error('Redis not initialized');
  }

  const keys = await redis.keys('dedup:*');
  const info = await redis.info('memory');
  const memoryMatch = info.match(/used_memory_human:(.+)/);

  return {
    totalKeys: keys.length,
    memoryUsage: memoryMatch && memoryMatch[1] ? memoryMatch[1].trim() : 'unknown',
  };
}
