/**
 * Performance Monitoring Types
 *
 * Type definitions for performance tracking system.
 */

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
