/**
 * Performance Endpoint Tracker
 *
 * Wraps endpoint handlers to automatically track performance metrics.
 * Handles logging and metric recording.
 */

import { logger } from '@/lib/logger';
import type { NextResponse } from 'next/server';
import { recordMetric, recordCachedMetric } from './collector';
import { isSlowQuery, isVerySlowQuery } from './thresholds';

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
export async function trackEndpoint<T extends NextResponse>(
  endpoint: string,
  handler: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let error = false;
  let result: T;

  try {
    result = await handler();
    const duration = Date.now() - startTime;

    // Log based on severity
    logEndpointPerformance(endpoint, duration, false);

    // Track metrics (fire and forget)
    recordMetric(endpoint, duration, false)
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
    recordMetric(endpoint, duration, true)
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
export async function trackCachedEndpoint<T extends NextResponse>(
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
    recordCachedMetric(endpoint, duration, cached, false)
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

    recordCachedMetric(endpoint, duration, cached, true)
      .catch(logErr => logger.error('[Performance] Failed to record error metric', { error: logErr }));

    throw err;
  }
}

/**
 * Log endpoint performance based on severity
 */
function logEndpointPerformance(
  endpoint: string,
  duration: number,
  error: boolean
): void {
  const durationStr = `${duration}ms`;

  if (isVerySlowQuery(duration)) {
    logger.error(`[Performance] Very slow endpoint`, {
      endpoint,
      duration: durationStr,
      threshold: '3000ms'
    });
  } else if (isSlowQuery(duration)) {
    logger.warn(`[Performance] Slow endpoint`, {
      endpoint,
      duration: durationStr,
      threshold: '1000ms'
    });
  } else {
    logger.debug(`[Performance] Endpoint completed`, {
      endpoint,
      duration: durationStr
    });
  }
}
