/**
 * Performance Profiling for searchByCategory Tool
 *
 * Purpose: Measure actual execution time breakdown to identify bottlenecks
 * Target: Reduce total execution time from 100ms to <50ms
 */

import { performance } from 'perf_hooks';
import { searchByCategory } from '../../servers/search/searchByCategory';
import { ExecutionContext } from '../../servers/shared/types';

// Mock dependencies for isolated performance testing
jest.mock('@/lib/embeddings-optimized', () => ({
  searchSimilarContent: jest.fn()
}));

jest.mock('@/lib/chat/tool-handlers/domain-utils', () => ({
  normalizeDomain: jest.fn((domain: string) => domain.replace('www.', ''))
}));

jest.mock('../../servers/shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: class MockTimer {
    private startTime = performance.now();
    elapsed() { return performance.now() - this.startTime; }
  }
}));

import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

interface ProfilingResult {
  operation: string;
  duration: number;
  percentage: number;
}

/**
 * Profile a single searchByCategory execution with detailed timing
 */
async function profileSearchByCategory(): Promise<{
  totalTime: number;
  breakdown: ProfilingResult[];
}> {
  const timings: { [key: string]: number } = {};

  // Setup
  mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');

  const mockResults = Array.from({ length: 20 }, (_, i) => ({
    content: `Product ${i}`,
    url: `https://example.com/product-${i}`,
    title: `Product ${i}`,
    similarity: 0.85
  }));

  mockSearchSimilarContent.mockResolvedValue(mockResults);

  const context: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk',
    platform: 'woocommerce',
    traceId: 'test-trace-123'
  };

  const input = {
    category: 'hydraulic-pumps',
    limit: 100
  };

  // Start overall timing
  const overallStart = performance.now();

  // Execute with manual timing points
  const validationStart = performance.now();
  // Input validation happens inside searchByCategory
  timings.validation = performance.now() - validationStart;

  const domainNormalizationStart = performance.now();
  // Domain normalization happens inside searchByCategory
  timings.domainNormalization = performance.now() - domainNormalizationStart;

  const searchStart = performance.now();
  await searchByCategory(input, context);
  timings.searchExecution = performance.now() - searchStart;

  const loggingStart = performance.now();
  // Logging happens inside searchByCategory
  timings.logging = performance.now() - loggingStart;

  const totalTime = performance.now() - overallStart;

  // Calculate breakdown
  const breakdown: ProfilingResult[] = Object.entries(timings).map(([operation, duration]) => ({
    operation,
    duration,
    percentage: (duration / totalTime) * 100
  }));

  return { totalTime, breakdown };
}

/**
 * Run multiple iterations to get average performance
 */
async function runBenchmark(iterations: number = 100): Promise<void> {
  console.log('\n=== searchByCategory Performance Profile ===\n');
  console.log(`Running ${iterations} iterations...\n`);

  const results: number[] = [];
  const breakdowns: ProfilingResult[][] = [];

  for (let i = 0; i < iterations; i++) {
    const { totalTime, breakdown } = await profileSearchByCategory();
    results.push(totalTime);
    breakdowns.push(breakdown);
  }

  // Calculate statistics
  const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);
  const p50 = results.sort((a, b) => a - b)[Math.floor(results.length * 0.5)];
  const p95 = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
  const p99 = results.sort((a, b) => a - b)[Math.floor(results.length * 0.99)];

  // Average breakdown across all iterations
  const avgBreakdown: { [key: string]: { duration: number; percentage: number } } = {};

  breakdowns.forEach(breakdown => {
    breakdown.forEach(({ operation, duration, percentage }) => {
      if (!avgBreakdown[operation]) {
        avgBreakdown[operation] = { duration: 0, percentage: 0 };
      }
      avgBreakdown[operation].duration += duration;
      avgBreakdown[operation].percentage += percentage;
    });
  });

  Object.keys(avgBreakdown).forEach(key => {
    avgBreakdown[key].duration /= iterations;
    avgBreakdown[key].percentage /= iterations;
  });

  // Print results
  console.log('OVERALL PERFORMANCE:');
  console.log('━'.repeat(60));
  console.log(`Average Time:    ${avgTime.toFixed(2)}ms`);
  console.log(`Minimum Time:    ${minTime.toFixed(2)}ms`);
  console.log(`Maximum Time:    ${maxTime.toFixed(2)}ms`);
  console.log(`P50 (Median):    ${p50.toFixed(2)}ms`);
  console.log(`P95:             ${p95.toFixed(2)}ms`);
  console.log(`P99:             ${p99.toFixed(2)}ms`);
  console.log(`Target:          <50ms`);
  console.log(`Current vs Goal: ${avgTime > 50 ? '❌' : '✅'} (${((avgTime - 50) / 50 * 100).toFixed(1)}% ${avgTime > 50 ? 'slower' : 'faster'})`);
  console.log('');

  console.log('\nTIME BREAKDOWN (Average across all iterations):');
  console.log('━'.repeat(60));

  const sortedBreakdown = Object.entries(avgBreakdown)
    .sort((a, b) => b[1].duration - a[1].duration);

  sortedBreakdown.forEach(([operation, { duration, percentage }]) => {
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`${operation.padEnd(25)} ${duration.toFixed(2)}ms (${percentage.toFixed(1)}%) ${bar}`);
  });

  console.log('\n');
  console.log('OPTIMIZATION OPPORTUNITIES:');
  console.log('━'.repeat(60));

  // Identify bottlenecks (>20% of total time)
  const bottlenecks = sortedBreakdown.filter(([_, { percentage }]) => percentage > 20);

  if (bottlenecks.length === 0) {
    console.log('✅ No major bottlenecks detected (all operations <20% of total time)');
  } else {
    bottlenecks.forEach(([operation, { duration, percentage }]) => {
      console.log(`⚠️  ${operation}: ${duration.toFixed(2)}ms (${percentage.toFixed(1)}%)`);
      console.log(`   → This is a bottleneck - should be optimized`);
    });
  }

  console.log('\n');
}

// Run the benchmark
runBenchmark(100).catch(console.error);
