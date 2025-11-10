/**
 * Performance Thresholds
 *
 * Configuration for performance monitoring thresholds and TTLs.
 */

export const SLOW_QUERY_THRESHOLD = 1000; // 1 second
export const VERY_SLOW_QUERY_THRESHOLD = 3000; // 3 seconds
export const METRICS_TTL = 86400; // 24 hours

/**
 * Check if duration exceeds slow query threshold
 */
export function isSlowQuery(duration: number): boolean {
  return duration > SLOW_QUERY_THRESHOLD;
}

/**
 * Check if duration exceeds very slow query threshold
 */
export function isVerySlowQuery(duration: number): boolean {
  return duration > VERY_SLOW_QUERY_THRESHOLD;
}

/**
 * Get query severity level
 */
export function getQuerySeverity(duration: number): 'normal' | 'slow' | 'very_slow' {
  if (duration > VERY_SLOW_QUERY_THRESHOLD) return 'very_slow';
  if (duration > SLOW_QUERY_THRESHOLD) return 'slow';
  return 'normal';
}
