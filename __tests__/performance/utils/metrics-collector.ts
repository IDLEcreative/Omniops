/**
 * Metrics Collector Utility
 *
 * Collects and analyzes performance metrics from load test results
 * Calculates percentiles (p50, p95, p99) and other statistics
 */

import type { LoadTestResponse, LoadTestResults } from './load-generator';

export interface PerformanceMetrics {
  // Response time metrics (ms)
  min: number;
  max: number;
  mean: number;
  median: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;

  // Throughput metrics
  throughput: number; // requests per second
  successRate: number; // percentage
  errorRate: number; // percentage

  // Request counts
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  // Duration
  totalDuration: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

/**
 * Collect performance metrics from load test results
 */
export function collectMetrics(results: LoadTestResults): PerformanceMetrics {
  const durations = results.responses
    .filter(r => !r.error)
    .map(r => r.duration)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      throughput: 0,
      successRate: 0,
      errorRate: 100,
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      failedRequests: results.failedRequests,
      totalDuration: results.totalDuration
    };
  }

  const min = durations[0];
  const max = durations[durations.length - 1];
  const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const median = calculatePercentile(durations, 50);

  return {
    min,
    max,
    mean,
    median,
    p50: calculatePercentile(durations, 50),
    p90: calculatePercentile(durations, 90),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    throughput: results.requestsPerSecond,
    successRate: (results.successfulRequests / results.totalRequests) * 100,
    errorRate: (results.failedRequests / results.totalRequests) * 100,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    totalDuration: results.totalDuration
  };
}

/**
 * Calculate percentile from sorted array of durations
 */
function calculatePercentile(sortedDurations: number[], percentile: number): number {
  if (sortedDurations.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedDurations.length) - 1;
  return sortedDurations[Math.max(0, Math.min(index, sortedDurations.length - 1))];
}

/**
 * Collect memory metrics
 */
export function collectMemoryMetrics(): MemoryMetrics {
  const usage = process.memoryUsage();

  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
    arrayBuffers: usage.arrayBuffers
  };
}

/**
 * Calculate memory delta between two snapshots
 */
export function calculateMemoryDelta(
  before: MemoryMetrics,
  after: MemoryMetrics
): MemoryMetrics {
  return {
    heapUsed: after.heapUsed - before.heapUsed,
    heapTotal: after.heapTotal - before.heapTotal,
    external: after.external - before.external,
    rss: after.rss - before.rss,
    arrayBuffers: after.arrayBuffers - before.arrayBuffers
  };
}

/**
 * Format memory value to human-readable string
 */
export function formatMemory(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Print performance metrics summary
 */
export function printMetrics(metrics: PerformanceMetrics, label?: string): void {
  console.log(`\n${label ? `${label} - ` : ''}Performance Metrics:`);
  console.log(`  Response Times:`);
  console.log(`    Min:    ${formatDuration(metrics.min)}`);
  console.log(`    Mean:   ${formatDuration(metrics.mean)}`);
  console.log(`    Median: ${formatDuration(metrics.median)}`);
  console.log(`    p90:    ${formatDuration(metrics.p90)}`);
  console.log(`    p95:    ${formatDuration(metrics.p95)}`);
  console.log(`    p99:    ${formatDuration(metrics.p99)}`);
  console.log(`    Max:    ${formatDuration(metrics.max)}`);
  console.log(`  Throughput: ${metrics.throughput.toFixed(2)} req/s`);
  console.log(`  Success Rate: ${metrics.successRate.toFixed(2)}%`);
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Duration: ${formatDuration(metrics.totalDuration)}`);
}

/**
 * Print memory metrics summary
 */
export function printMemoryMetrics(metrics: MemoryMetrics, label?: string): void {
  console.log(`\n${label ? `${label} - ` : ''}Memory Metrics:`);
  console.log(`  Heap Used: ${formatMemory(metrics.heapUsed)}`);
  console.log(`  Heap Total: ${formatMemory(metrics.heapTotal)}`);
  console.log(`  RSS: ${formatMemory(metrics.rss)}`);
  console.log(`  External: ${formatMemory(metrics.external)}`);
}
