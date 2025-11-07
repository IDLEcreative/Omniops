/**
 * Performance Monitoring Utility
 *
 * Tracks API endpoint performance metrics for monitoring and optimization.
 * Uses Redis for distributed metrics aggregation across instances.
 *
 * Features:
 * - Response time tracking
 * - Slow query detection and logging
 * - Cache hit/miss rate tracking
 * - Daily performance aggregation
 * - Automatic alerting for performance degradation
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return PerformanceMonitor.trackEndpoint('conversations.list', async () => {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { NextResponse } from 'next/server';

export interface PerformanceMetrics {
  endpoint: string;
  duration: number;
  timestamp: number;
  cached?: boolean;
  error?: boolean;
}

export interface AggregatedMetrics {
  endpoint: string;
  totalRequests: number;
  averageDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  slowQueryCount: number;
  errorCount: number;
  cacheHitRate: number;
  period: string;
}

export class PerformanceMonitor {
  private static SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private static VERY_SLOW_QUERY_THRESHOLD = 3000; // 3 seconds
  private static METRICS_TTL = 86400; // 24 hours

  /**
   * Track API endpoint performance
   *
   * Wraps an endpoint handler to automatically track performance metrics.
   * Logs slow queries and stores metrics in Redis for aggregation.
   *
   * @param endpoint - Endpoint identifier (e.g., 'conversations.list')
   * @param handler - Async function that returns the response
   * @returns The response from the handler
   */
  static async trackEndpoint<T extends NextResponse>(
    endpoint: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let error = false;
    let result: T;

    try {
      result = await handler();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > this.VERY_SLOW_QUERY_THRESHOLD) {
        logger.error(`[Performance] Very slow endpoint`, {
          endpoint,
          duration: `${duration}ms`,
          threshold: `${this.VERY_SLOW_QUERY_THRESHOLD}ms`
        });
      } else if (duration > this.SLOW_QUERY_THRESHOLD) {
        logger.warn(`[Performance] Slow endpoint`, {
          endpoint,
          duration: `${duration}ms`,
          threshold: `${this.SLOW_QUERY_THRESHOLD}ms`
        });
      } else {
        logger.debug(`[Performance] Endpoint completed`, {
          endpoint,
          duration: `${duration}ms`
        });
      }

      // Track metrics (fire and forget)
      this.recordMetric(endpoint, duration, false)
        .catch(err => logger.error('[Performance] Failed to record metric', { error: err }));

      return result;
    } catch (err) {
      error = true;
      const duration = Date.now() - startTime;

      logger.error(`[Performance] Endpoint failed`, {
        endpoint,
        duration: `${duration}ms`,
        error: err instanceof Error ? err.message : String(err)
      });

      // Track error metric
      this.recordMetric(endpoint, duration, true)
        .catch(logErr => logger.error('[Performance] Failed to record error metric', { error: logErr }));

      throw err;
    }
  }

  /**
   * Track endpoint with cache awareness
   *
   * Extended version that tracks whether response was served from cache.
   * Helps measure cache effectiveness.
   *
   * @param endpoint - Endpoint identifier
   * @param cached - Whether response was served from cache
   * @param handler - Async function that returns the response
   * @returns The response from the handler
   */
  static async trackCachedEndpoint<T extends NextResponse>(
    endpoint: string,
    cached: boolean,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await handler();
      const duration = Date.now() - startTime;

      logger.debug(`[Performance] Cached endpoint`, {
        endpoint,
        duration: `${duration}ms`,
        cached
      });

      // Track metrics with cache info
      this.recordCachedMetric(endpoint, duration, cached, false)
        .catch(err => logger.error('[Performance] Failed to record cached metric', { error: err }));

      return result;
    } catch (err) {
      const duration = Date.now() - startTime;

      logger.error(`[Performance] Cached endpoint failed`, {
        endpoint,
        duration: `${duration}ms`,
        cached,
        error: err instanceof Error ? err.message : String(err)
      });

      this.recordCachedMetric(endpoint, duration, cached, true)
        .catch(logErr => logger.error('[Performance] Failed to record error metric', { error: logErr }));

      throw err;
    }
  }

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
  private static async recordMetric(
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
      await redis.expire(durationKey, this.METRICS_TTL);

      // Track total requests
      const countKey = `perf:${endpoint}:count:${today}`;
      await redis.incr(countKey);
      await redis.expire(countKey, this.METRICS_TTL);

      // Track errors separately
      if (error) {
        const errorKey = `perf:${endpoint}:errors:${today}`;
        await redis.incr(errorKey);
        await redis.expire(errorKey, this.METRICS_TTL);
      }

      // Track slow queries
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        const slowKey = `perf:${endpoint}:slow:${today}`;
        await redis.incr(slowKey);
        await redis.expire(slowKey, this.METRICS_TTL);
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
  private static async recordCachedMetric(
    endpoint: string,
    duration: number,
    cached: boolean,
    error: boolean
  ): Promise<void> {
    try {
      // Record standard metrics
      await this.recordMetric(endpoint, duration, error);

      // Track cache hits/misses
      const redis = getRedisClient();
      const today = new Date().toISOString().split('T')[0];

      if (cached) {
        const cacheHitKey = `perf:${endpoint}:cache:hits:${today}`;
        await redis.incr(cacheHitKey);
        await redis.expire(cacheHitKey, this.METRICS_TTL);
      } else {
        const cacheMissKey = `perf:${endpoint}:cache:misses:${today}`;
        await redis.incr(cacheMissKey);
        await redis.expire(cacheMissKey, this.METRICS_TTL);
      }
    } catch (error) {
      logger.debug('[Performance] Failed to record cached metric', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

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
  static async getAggregatedMetrics(
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
      const p50Index = Math.floor(durationValues.length * 0.5);
      const p95Index = Math.floor(durationValues.length * 0.95);
      const p99Index = Math.floor(durationValues.length * 0.99);

      const sum = durationValues.reduce((acc: number, val: number) => acc + val, 0);
      const averageDuration = sum / durationValues.length;

      const cacheHitRate = cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

      return {
        endpoint,
        totalRequests,
        averageDuration: Math.round(averageDuration),
        p50Duration: durationValues[p50Index] || 0,
        p95Duration: durationValues[p95Index] || 0,
        p99Duration: durationValues[p99Index] || 0,
        slowQueryCount,
        errorCount,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
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
  static async getAllMetrics(date?: string): Promise<AggregatedMetrics[]> {
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
        this.getAggregatedMetrics(endpoint, today)
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
   * Clear metrics for an endpoint
   *
   * Useful for testing or resetting after incidents.
   *
   * @param endpoint - Endpoint identifier
   * @param date - Date to clear metrics for (defaults to today)
   */
  static async clearMetrics(endpoint: string, date?: string): Promise<void> {
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
}
