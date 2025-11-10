/**
 * Utility functions for performance metrics
 *
 * Helper functions for filtering, calculating percentiles, and time-based operations.
 */

/**
 * Get recent metrics within time window
 */
export function getRecentMetrics<T extends { timestamp: Date }>(
  metrics: T[],
  timeWindowMs: number
): T[] {
  const cutoff = Date.now() - timeWindowMs;
  return metrics.filter((m) => m.timestamp.getTime() > cutoff);
}

/**
 * Calculate percentile from sorted array
 */
export function percentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}
