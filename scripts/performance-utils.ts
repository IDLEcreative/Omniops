#!/usr/bin/env tsx
/**
 * Performance Metrics Utilities
 *
 * Shared types and utility functions for performance analysis
 * Extracted to keep modules focused and maintainable
 *
 * Exports:
 * - PerformanceMetrics interface
 * - JestTestResult interface
 * - categorizeTest() function
 * - generateMachineReadableReport() function
 */

export interface PerformanceMetrics {
  testName: string;
  category: string;
  p50: number | null;
  p90: number | null;
  p95: number | null;
  p99: number | null;
  mean?: number | null;
  min?: number | null;
  max?: number | null;
  throughput: number | null;
  successRate?: number | null;
  errorRate: number | null;
  totalRequests?: number | null;
  duration: number | null;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'UNKNOWN';
}

export interface JestTestResult {
  testResults: Array<{
    name: string;
    status: 'passed' | 'failed';
    message?: string;
  }>;
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
}

/**
 * Categorize test by name for better organization
 * Maps test names to categories (api, queue, integration, dashboard, other)
 */
export function categorizeTest(testName: string): string {
  const lower = testName.toLowerCase();
  if (lower.includes('chat')) return 'api';
  if (lower.includes('search')) return 'api';
  if (lower.includes('scrape')) return 'api';
  if (lower.includes('job') || lower.includes('queue') || lower.includes('worker')) return 'queue';
  if (lower.includes('woocommerce') || lower.includes('purchase') || lower.includes('customer')) return 'integration';
  if (lower.includes('dashboard')) return 'dashboard';
  return 'other';
}

/**
 * Generate machine-readable report (plain text format)
 * Used for machine parsing and trend analysis
 */
export function generateMachineReadableReport(metrics: PerformanceMetrics[]): string {
  let report = '';

  for (const metric of metrics) {
    report += `[${metric.category}] ${metric.testName}\n`;
    if (metric.p50) report += `  p50: ${metric.p50}ms\n`;
    if (metric.p95) report += `  p95: ${metric.p95}ms\n`;
    if (metric.p99) report += `  p99: ${metric.p99}ms\n`;
    if (metric.throughput) report += `  throughput: ${metric.throughput} req/s\n`;
    if (metric.successRate !== undefined && metric.successRate !== null) report += `  success_rate: ${metric.successRate}%\n`;
    if (metric.errorRate) report += `  error_rate: ${metric.errorRate}%\n`;
    report += `\n`;
  }

  return report;
}
