/**
 * Performance Metrics Aggregator
 *
 * Retrieves and aggregates performance metrics from Redis.
 * Calculates percentiles, averages, and cache hit rates.
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { AggregatedMetrics } from './types';

/**
 * Get aggregated metrics for an endpoint
 *
 * Calculates performance statistics from stored metrics.
 * Useful for dashboards and monitoring.
 *
 * @param endpoint - Endpoint identifier
 * @param date - Date to get metrics for (defaults to today)
 * @returns Aggregated performance metrics
 */
export async function getAggregatedMetrics(
  endpoint: string,
  date?: string
): Promise<AggregatedMetrics | null> {
  try {
    const redis = getRedisClient();
    const today = date || new Date().toISOString().split('T')[0];

    // Get all metrics
    const durationKey = `perf:${endpoint}:durations:${today}`;
    const countKey = `perf:${endpoint}:count:${today}`;
    const errorKey = `perf:${endpoint}:errors:${today}`;
    const slowKey = `perf:${endpoint}:slow:${today}`;
    const cacheHitKey = `perf:${endpoint}:cache:hits:${today}`;
    const cacheMissKey = `perf:${endpoint}:cache:misses:${today}`;

    // Check if this is a real Redis client with zrange
    if (typeof (redis as any).zrange !== 'function') {
      return null;
    }

    const durations = await (redis as any).zrange(durationKey, 0, -1);
    const totalRequests = parseInt(await redis.get(countKey) || '0', 10);
    const errorCount = parseInt(await redis.get(errorKey) || '0', 10);
    const slowQueryCount = parseInt(await redis.get(slowKey) || '0', 10);
    const cacheHits = parseInt(await redis.get(cacheHitKey) || '0', 10);
    const cacheMisses = parseInt(await redis.get(cacheMissKey) || '0', 10);

    if (durations.length === 0) {
      return null;
    }

    // Parse durations
    const durationValues = durations
      .map((d: string) => {
        try {
          return JSON.parse(d).duration;
        } catch {
          return null;
        }
      })
      .filter((d: any): d is number => d !== null)
      .sort((a: number, b: number) => a - b);

    if (durationValues.length === 0) {
      return null;
    }

    // Calculate percentiles
    const percentiles = calculatePercentiles(durationValues);
    const averageDuration = calculateAverage(durationValues);
    const cacheHitRate = calculateCacheHitRate(cacheHits, cacheMisses);

    return {
      endpoint,
      totalRequests,
      averageDuration,
      p50Duration: percentiles.p50,
      p95Duration: percentiles.p95,
      p99Duration: percentiles.p99,
      slowQueryCount,
      errorCount,
      cacheHitRate,
      period: today || '',
    };
  } catch (error) {
    logger.error('[Performance] Failed to get aggregated metrics', {
      error: error instanceof Error ? error.message : String(error),
      endpoint
    });
    return null;
  }
}

/**
 * Get metrics for all endpoints
 *
 * @param date - Date to get metrics for (defaults to today)
 * @returns Array of aggregated metrics for all tracked endpoints
 */
export async function getAllMetrics(date?: string): Promise<AggregatedMetrics[]> {
  try {
    const redis = getRedisClient();
    const today = date || new Date().toISOString().split('T')[0];

    // Check if this is a real Redis client with keys command
    if (typeof (redis as any).keys !== 'function') {
      return [];
    }

    // Get all endpoint keys
    const keys = await (redis as any).keys(`perf:*:count:${today}`);

    // Extract endpoint names
    const endpoints = keys.map((key: string) => {
      const match = key.match(/^perf:(.+):count:/);
      return match ? match[1] : null;
    }).filter((e: string | null): e is string => e !== null);

    // Get metrics for each endpoint
    const metricsPromises = endpoints.map((endpoint: string) =>
      getAggregatedMetrics(endpoint, today)
    );

    const metrics = await Promise.all(metricsPromises);

    return metrics.filter((m): m is AggregatedMetrics => m !== null);
  } catch (error) {
    logger.error('[Performance] Failed to get all metrics', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

/**
 * Calculate percentiles from sorted duration values
 */
function calculatePercentiles(sortedDurations: number[]): {
  p50: number;
  p95: number;
  p99: number;
} {
  const p50Index = Math.floor(sortedDurations.length * 0.5);
  const p95Index = Math.floor(sortedDurations.length * 0.95);
  const p99Index = Math.floor(sortedDurations.length * 0.99);

  return {
    p50: sortedDurations[p50Index] || 0,
    p95: sortedDurations[p95Index] || 0,
    p99: sortedDurations[p99Index] || 0,
  };
}

/**
 * Calculate average duration
 */
function calculateAverage(durations: number[]): number {
  const sum = durations.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / durations.length);
}

/**
 * Calculate cache hit rate percentage
 */
function calculateCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  if (total === 0) return 0;
  return Math.round((hits / total) * 1000) / 10; // Round to 1 decimal place
}
