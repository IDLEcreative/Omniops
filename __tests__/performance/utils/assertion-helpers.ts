/**
 * Performance Assertion Helpers
 *
 * Custom assertions for performance testing
 * Validates response times, throughput, error rates, etc.
 */

import type { PerformanceMetrics, MemoryMetrics } from './metrics-collector';

/**
 * Assert response time percentiles are within acceptable bounds
 */
export function assertResponseTime(
  metrics: PerformanceMetrics,
  thresholds: {
    p50?: number;
    p90?: number;
    p95?: number;
    p99?: number;
    max?: number;
  }
): void {
  if (thresholds.p50 !== undefined && metrics.p50 > thresholds.p50) {
    throw new Error(
      `P50 response time (${metrics.p50.toFixed(0)}ms) exceeds threshold (${thresholds.p50}ms)`
    );
  }

  if (thresholds.p90 !== undefined && metrics.p90 > thresholds.p90) {
    throw new Error(
      `P90 response time (${metrics.p90.toFixed(0)}ms) exceeds threshold (${thresholds.p90}ms)`
    );
  }

  if (thresholds.p95 !== undefined && metrics.p95 > thresholds.p95) {
    throw new Error(
      `P95 response time (${metrics.p95.toFixed(0)}ms) exceeds threshold (${thresholds.p95}ms)`
    );
  }

  if (thresholds.p99 !== undefined && metrics.p99 > thresholds.p99) {
    throw new Error(
      `P99 response time (${metrics.p99.toFixed(0)}ms) exceeds threshold (${thresholds.p99}ms)`
    );
  }

  if (thresholds.max !== undefined && metrics.max > thresholds.max) {
    throw new Error(
      `Max response time (${metrics.max.toFixed(0)}ms) exceeds threshold (${thresholds.max}ms)`
    );
  }
}

/**
 * Assert throughput meets minimum requirements
 */
export function assertThroughput(
  metrics: PerformanceMetrics,
  minRequestsPerSecond: number
): void {
  if (metrics.throughput < minRequestsPerSecond) {
    throw new Error(
      `Throughput (${metrics.throughput.toFixed(2)} req/s) is below minimum (${minRequestsPerSecond} req/s)`
    );
  }
}

/**
 * Assert error rate is below maximum threshold
 */
export function assertErrorRate(
  metrics: PerformanceMetrics,
  maxErrorRatePercent: number
): void {
  if (metrics.errorRate > maxErrorRatePercent) {
    throw new Error(
      `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds maximum (${maxErrorRatePercent}%)`
    );
  }
}

/**
 * Assert success rate meets minimum threshold
 */
export function assertSuccessRate(
  metrics: PerformanceMetrics,
  minSuccessRatePercent: number
): void {
  if (metrics.successRate < minSuccessRatePercent) {
    throw new Error(
      `Success rate (${metrics.successRate.toFixed(2)}%) is below minimum (${minSuccessRatePercent}%)`
    );
  }
}

/**
 * Assert memory usage is within bounds
 */
export function assertMemoryUsage(
  metrics: MemoryMetrics,
  thresholds: {
    maxHeapUsedMB?: number;
    maxRssMB?: number;
  }
): void {
  const heapUsedMB = metrics.heapUsed / 1024 / 1024;
  const rssMB = metrics.rss / 1024 / 1024;

  if (thresholds.maxHeapUsedMB !== undefined && heapUsedMB > thresholds.maxHeapUsedMB) {
    throw new Error(
      `Heap usage (${heapUsedMB.toFixed(2)} MB) exceeds threshold (${thresholds.maxHeapUsedMB} MB)`
    );
  }

  if (thresholds.maxRssMB !== undefined && rssMB > thresholds.maxRssMB) {
    throw new Error(
      `RSS (${rssMB.toFixed(2)} MB) exceeds threshold (${thresholds.maxRssMB} MB)`
    );
  }
}

/**
 * Assert no memory leak detected
 * Compares memory before and after, allowing for some growth
 */
export function assertNoMemoryLeak(
  before: MemoryMetrics,
  after: MemoryMetrics,
  maxGrowthMB: number = 50
): void {
  const heapGrowthMB = (after.heapUsed - before.heapUsed) / 1024 / 1024;

  if (heapGrowthMB > maxGrowthMB) {
    throw new Error(
      `Potential memory leak detected: heap grew by ${heapGrowthMB.toFixed(2)} MB (max allowed: ${maxGrowthMB} MB)`
    );
  }
}

/**
 * Assert all performance criteria are met
 */
export function assertPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: {
    p95ResponseTime?: number;
    minThroughput?: number;
    maxErrorRate?: number;
    minSuccessRate?: number;
  }
): void {
  if (budget.p95ResponseTime !== undefined) {
    assertResponseTime(metrics, { p95: budget.p95ResponseTime });
  }

  if (budget.minThroughput !== undefined) {
    assertThroughput(metrics, budget.minThroughput);
  }

  if (budget.maxErrorRate !== undefined) {
    assertErrorRate(metrics, budget.maxErrorRate);
  }

  if (budget.minSuccessRate !== undefined) {
    assertSuccessRate(metrics, budget.minSuccessRate);
  }
}

/**
 * Create custom Jest matcher for performance metrics
 */
export function toMeetPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: {
    p95ResponseTime?: number;
    minThroughput?: number;
    maxErrorRate?: number;
  }
) {
  const failures: string[] = [];

  if (budget.p95ResponseTime !== undefined && metrics.p95 > budget.p95ResponseTime) {
    failures.push(
      `P95 response time (${metrics.p95.toFixed(0)}ms) exceeds ${budget.p95ResponseTime}ms`
    );
  }

  if (budget.minThroughput !== undefined && metrics.throughput < budget.minThroughput) {
    failures.push(
      `Throughput (${metrics.throughput.toFixed(2)} req/s) below ${budget.minThroughput} req/s`
    );
  }

  if (budget.maxErrorRate !== undefined && metrics.errorRate > budget.maxErrorRate) {
    failures.push(
      `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds ${budget.maxErrorRate}%`
    );
  }

  const pass = failures.length === 0;

  return {
    pass,
    message: () =>
      pass
        ? 'Performance budget met'
        : `Performance budget not met:\n${failures.map(f => `  - ${f}`).join('\n')}`
  };
}
