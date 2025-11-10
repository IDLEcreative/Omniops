/**
 * Performance Metrics Collector
 *
 * Records performance metrics to Redis for aggregation.
 * Handles storage of durations, errors, cache hits/misses.
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { METRICS_TTL, isSlowQuery } from './thresholds';

/**
 * Record performance metric to Redis
 *
 * Stores individual metric data points for aggregation.
 * Uses sorted sets for efficient percentile calculations.
 *
 * @param endpoint - Endpoint identifier
 * @param duration - Response time in milliseconds
 * @param error - Whether the request resulted in an error
 */
export async function recordMetric(
  endpoint: string,
  duration: number,
  error: boolean
): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = Date.now();

    // Store in sorted set for percentile calculations
    const durationKey = `perf:${endpoint}:durations:${today}`;
    await redis.zadd(durationKey, timestamp, JSON.stringify({ duration, timestamp, error }));
    await redis.expire(durationKey, METRICS_TTL);

    // Track total requests
    const countKey = `perf:${endpoint}:count:${today}`;
    await redis.incr(countKey);
    await redis.expire(countKey, METRICS_TTL);

    // Track errors separately
    if (error) {
      const errorKey = `perf:${endpoint}:errors:${today}`;
      await redis.incr(errorKey);
      await redis.expire(errorKey, METRICS_TTL);
    }

    // Track slow queries
    if (isSlowQuery(duration)) {
      const slowKey = `perf:${endpoint}:slow:${today}`;
      await redis.incr(slowKey);
      await redis.expire(slowKey, METRICS_TTL);
    }
  } catch (error) {
    // Silently fail - metrics are optional
    logger.debug('[Performance] Failed to record metric', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Record cached metric to Redis
 *
 * Extended version that tracks cache hits/misses.
 *
 * @param endpoint - Endpoint identifier
 * @param duration - Response time in milliseconds
 * @param cached - Whether response was cached
 * @param error - Whether the request resulted in an error
 */
export async function recordCachedMetric(
  endpoint: string,
  duration: number,
  cached: boolean,
  error: boolean
): Promise<void> {
  try {
    // Record standard metrics
    await recordMetric(endpoint, duration, error);

    // Track cache hits/misses
    const redis = getRedisClient();
    const today = new Date().toISOString().split('T')[0];

    if (cached) {
      const cacheHitKey = `perf:${endpoint}:cache:hits:${today}`;
      await redis.incr(cacheHitKey);
      await redis.expire(cacheHitKey, METRICS_TTL);
    } else {
      const cacheMissKey = `perf:${endpoint}:cache:misses:${today}`;
      await redis.incr(cacheMissKey);
      await redis.expire(cacheMissKey, METRICS_TTL);
    }
  } catch (error) {
    logger.debug('[Performance] Failed to record cached metric', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Clear metrics for an endpoint
 *
 * Useful for testing or resetting after incidents.
 *
 * @param endpoint - Endpoint identifier
 * @param date - Date to clear metrics for (defaults to today)
 */
export async function clearMetrics(endpoint: string, date?: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const today = date || new Date().toISOString().split('T')[0];

    const keys = [
      `perf:${endpoint}:durations:${today}`,
      `perf:${endpoint}:count:${today}`,
      `perf:${endpoint}:errors:${today}`,
      `perf:${endpoint}:slow:${today}`,
      `perf:${endpoint}:cache:hits:${today}`,
      `perf:${endpoint}:cache:misses:${today}`,
    ];

    await redis.del(...keys);

    logger.info('[Performance] Cleared metrics', { endpoint, date: today });
  } catch (error) {
    logger.error('[Performance] Failed to clear metrics', {
      error: error instanceof Error ? error.message : String(error),
      endpoint
    });
  }
}
