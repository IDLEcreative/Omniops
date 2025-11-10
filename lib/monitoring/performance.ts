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

// Re-export types
export type { PerformanceMetrics, AggregatedMetrics } from './perf/types';

// Re-export aggregation functions
export { getAggregatedMetrics, getAllMetrics } from './perf/aggregator';

// Re-export collection functions
export { clearMetrics } from './perf/collector';

// Import tracker functions
import { trackEndpoint, trackCachedEndpoint } from './perf/tracker';
import type { NextResponse } from 'next/server';

/**
 * Main Performance Monitor Class
 *
 * Provides static methods for tracking endpoint performance.
 * Delegates to specialized modules for collection, aggregation, and tracking.
 */
export class PerformanceMonitor {
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
    return trackEndpoint(endpoint, handler);
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
    return trackCachedEndpoint(endpoint, cached, handler);
  }
}
