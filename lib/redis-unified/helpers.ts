/**
 * Redis Unified - Helper Functions
 */

import { getRedisClient } from './client';
import { QUEUE_PRIORITIES, RATE_LIMITS, DEDUP_CONFIG } from './constants';

/**
 * Helper function to get queue key with priority
 */
export function getQueueKey(
  namespace: string,
  priority: number = QUEUE_PRIORITIES.NORMAL
): string {
  if (priority >= QUEUE_PRIORITIES.HIGH) {
    return `${namespace}:high`;
  } else if (priority <= QUEUE_PRIORITIES.LOW) {
    return `${namespace}:low`;
  }
  return `${namespace}:normal`;
}

/**
 * Helper function to check if a job already exists (deduplication)
 */
export async function isDuplicateJob(
  jobKey: string,
  windowSeconds: number = DEDUP_CONFIG.JOB_DEDUP_WINDOW
): Promise<boolean> {
  const redis = getRedisClient();
  const dedupKey = `dedup:${jobKey}`;

  const exists = await redis.exists(dedupKey);
  if (!exists) {
    // Mark as processing to prevent duplicates
    await redis.set(dedupKey, '1', windowSeconds);
    return false;
  }

  return true;
}

/**
 * Helper function to apply rate limiting
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = RATE_LIMITS.API_PER_CLIENT.requests,
  window: number = RATE_LIMITS.API_PER_CLIENT.window
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedisClient();
  const key = `rate:${identifier}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  const ttl = (await redis.get(`${key}:ttl`)) || window;
  const resetIn = parseInt(ttl.toString());

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetIn,
  };
}
