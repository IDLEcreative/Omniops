/**
 * Generic Cache Operations
 *
 * Reusable get/set operations for Redis caching with automatic error handling.
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Generic cache get operation
 */
export async function getCachedData<T>(
  cacheKey: string,
  logContext: Record<string, any>
): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug('Cache hit', logContext);
      return JSON.parse(cached) as T;
    }

    logger.debug('Cache miss', logContext);
    return null;
  } catch (error) {
    logger.error('Error getting from cache', {
      error: error instanceof Error ? error.message : String(error),
      ...logContext
    });
    return null;
  }
}

/**
 * Generic cache set operation
 */
export async function setCachedData<T>(
  cacheKey: string,
  data: T,
  ttl: number,
  logContext: Record<string, any>
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    logger.debug('Cached data', { ...logContext, ttl });
  } catch (error) {
    logger.error('Error setting cache', {
      error: error instanceof Error ? error.message : String(error),
      ...logContext
    });
  }
}
