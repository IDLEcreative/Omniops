#!/usr/bin/env tsx
/**
 * Performance Report Generator
 *
 * Functions for generating markdown and text reports from performance metrics
 * Handles budget evaluation, recommendations, and formatted output
 *
 * Exports:
 * - generateMarkdownTable() function
 * - evaluateBudgets() function
 * - generateRecommendations() function
 * - generateMarkdownReport() function
 */

import { PerformanceMetrics } from './performance-utils';

/**
 * Generate markdown table from performance metrics
 * Displays p50, p90, p95, p99, throughput, error rate, and status
 */
export function generateMarkdownTable(metrics: PerformanceMetrics[]): string {
  if (metrics.length === 0) {
    return '_No performance metrics found_\n';
  }

  let table = '| Test | Category | p50 | p90 | p95 | p99 | Throughput | Error Rate | Status |\n';
  table += '|------|----------|-----|-----|-----|-----|------------|------------|--------|\n';

  for (const m of metrics) {
    const p50 = m.p50 !== null ? `${m.p50}ms` : 'N/A';
    const p90 = m.p90 !== null ? `${m.p90}ms` : 'N/A';
    const p95 = m.p95 !== null ? `${m.p95}ms` : 'N/A';
    const p99 = m.p99 !== null ? `${m.p99}ms` : 'N/A';
    const throughput = m.throughput !== null ? `${m.throughput} req/s` : 'N/A';
    const errorRate = m.errorRate !== null ? `${m.errorRate}%` : 'N/A';
    const statusIcon = m.status === 'PASS' ? '✅' : m.status === 'FAIL' ? '❌' : '⏭️';

    table += `| ${m.testName} | ${m.category} | ${p50} | ${p90} | ${p95} | ${p99} | ${throughput} | ${errorRate} | ${statusIcon} ${m.status} |\n`;
  }

  return table;
}

/**
 * Evaluate performance budgets against actual metrics
 * Compares to defined targets and returns status table
 */
export function evaluateBudgets(metrics: PerformanceMetrics[]): string {
  const budgets = [
    {
      name: 'Chat API p95',
      test: 'chat-endpoint-load',
      metric: 'p95',
      target: 2000,
      unit: 'ms',
      comparison: 'less'
    },
    {
      name: 'Search API p95',
      test: 'search-endpoint-load',
      metric: 'p95',
      target: 500,
      unit: 'ms',
      comparison: 'less'
    },
    {
      name: 'Queue Throughput',
      test: 'job-processing-throughput',
      metric: 'throughput',
      target: 50,
      unit: 'jobs/s',
      comparison: 'greater'
    },
    {
      name: 'Purchase Flow Duration',
      test: 'end-to-end-purchase',
      metric: 'duration',
      target: 5,
      unit: 's',
      comparison: 'less'
    },
    {
      name: 'WooCommerce Sync (100 products)',
      test: 'woocommerce-sync',
      metric: 'duration',
      target: 30,
      unit: 's',
      comparison: 'less'
    }
  ];

  let table = '| Performance Budget | Target | Actual | Status |\n';
  table += '|-------------------|--------|--------|--------|\n';

  for (const budget of budgets) {
    const testMetric = metrics.find(m => m.testName === budget.test);

    if (!testMetric) {
      table += `| ${budget.name} | ${budget.comparison === 'less' ? '<' : '>'} ${budget.target}${budget.unit} | Not Run | ⏭️ SKIP |\n`;
      continue;
    }

    const actualValue = (testMetric as any)[budget.metric];

    if (actualValue === null || actualValue === undefined) {
      table += `| ${budget.name} | ${budget.comparison === 'less' ? '<' : '>'} ${budget.target}${budget.unit} | N/A | ⏭️ N/A |\n`;
      continue;
    }

    const passes = budget.comparison === 'less'
      ? actualValue < budget.target
      : actualValue > budget.target;

    const statusIcon = passes ? '✅' : '❌';
    const status = passes ? 'PASS' : 'FAIL';

    table += `| ${budget.name} | ${budget.comparison === 'less' ? '<' : '>'} ${budget.target}${budget.unit} | ${actualValue}${budget.unit} | ${statusIcon} ${status} |\n`;
  }

  return table;
}

/**
 * Generate performance recommendations based on metrics
 * Identifies issues and suggests optimizations
 */
export function generateRecommendations(metrics: PerformanceMetrics[]): string {
  const recommendations: string[] = [];

  // Check for slow API responses
  const chatTest = metrics.find(m => m.testName === 'chat-endpoint-load');
  if (chatTest && chatTest.p95 !== null && chatTest.p95 > 2000) {
    recommendations.push(`- ⚠️ **Chat API is slow** (p95: ${chatTest.p95}ms > 2000ms target). Consider optimizing AI response generation or implementing streaming responses.`);
  }

  const searchTest = metrics.find(m => m.testName === 'search-endpoint-load');
  if (searchTest && searchTest.p95 !== null && searchTest.p95 > 500) {
    recommendations.push(`- ⚠️ **Search API is slow** (p95: ${searchTest.p95}ms > 500ms target). Review vector search indexes and query optimization.`);
  }

  // Check for low throughput
  const queueTest = metrics.find(m => m.testName === 'job-processing-throughput');
  if (queueTest && queueTest.throughput !== null && queueTest.throughput < 50) {
    recommendations.push(`- ⚠️ **Queue throughput is low** (${queueTest.throughput} jobs/s < 50 jobs/s target). Consider adding more workers or optimizing job processing.`);
  }

  // Check for high error rates
  const highErrorTests = metrics.filter(m => m.errorRate !== null && m.errorRate > 5);
  if (highErrorTests.length > 0) {
    recommendations.push(`- ⚠️ **High error rates detected** in: ${highErrorTests.map(t => t.testName).join(', ')}. Investigate root causes.`);
  }

  // Check for failed tests
  const failedTests = metrics.filter(m => m.status === 'FAIL');
  if (failedTests.length > 0) {
    recommendations.push(`- ❌ **${failedTests.length} test(s) failed**: ${failedTests.map(t => t.testName).join(', ')}. Review test logs for details.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('- ✅ All performance budgets met! No immediate action required.');
    recommendations.push('- 💡 Continue monitoring performance metrics over time.');
    recommendations.push('- 📊 Consider adding more performance tests for new features.');
  }

  return recommendations.join('\n');
}

/**
 * Generate complete markdown report
 * Includes metrics table, budget evaluation, recommendations, and categorized results
 */
export function generateMarkdownReport(
  metrics: PerformanceMetrics[],
  metricsTable: string,
  budgetsTable: string,
  recommendations: string,
  reportPath: string
): string {
  return `# Performance Baseline Report

**Date:** ${new Date().toISOString()}
**Environment:** Local development
**Node Version:** ${process.version}
**Tests Run:** ${metrics.length}
**Tests Passed:** ${metrics.filter(m => m.status === 'PASS').length}
**Tests Failed:** ${metrics.filter(m => m.status === 'FAIL').length}

## Executive Summary

This report contains baseline performance metrics for the Omniops platform.

${metrics.length > 0 ? `**Overall Status:** ${metrics.filter(m => m.status === 'FAIL').length === 0 ? '✅ All tests passed' : `❌ ${metrics.filter(m => m.status === 'FAIL').length} test(s) failed`}` : '**Overall Status:** ⏭️ No tests run'}

## Baseline Metrics

${metricsTable}

## Performance Budgets

${budgetsTable}

## Recommendations

${recommendations}

## Test Categories

### API Performance

${metrics.filter(m => m.category === 'api').length > 0
  ? metrics.filter(m => m.category === 'api').map(m =>
    `- **${m.testName}**: p95 = ${m.p95 !== null ? m.p95 + 'ms' : 'N/A'}, throughput = ${m.throughput !== null ? m.throughput + ' req/s' : 'N/A'}`
  ).join('\n')
  : '_No API tests run_'
}

### Queue Performance

${metrics.filter(m => m.category === 'queue').length > 0
  ? metrics.filter(m => m.category === 'queue').map(m =>
    `- **${m.testName}**: throughput = ${m.throughput !== null ? m.throughput + ' jobs/s' : 'N/A'}, error rate = ${m.errorRate !== null ? m.errorRate + '%' : 'N/A'}`
  ).join('\n')
  : '_No queue tests run_'
}

### Integration Performance

${metrics.filter(m => m.category === 'integration').length > 0
  ? metrics.filter(m => m.category === 'integration').map(m =>
    `- **${m.testName}**: duration = ${m.duration !== null ? m.duration + 's' : 'N/A'}, p95 = ${m.p95 !== null ? m.p95 + 'ms' : 'N/A'}`
  ).join('\n')
  : '_No integration tests run_'
}

## Next Steps

1. **Review Recommendations**: Address any performance budget violations listed above
2. **Monitor Trends**: Run these tests regularly to track performance over time
3. **Add More Tests**: Expand test coverage for critical user flows
4. **Optimize**: Focus optimization efforts on metrics that exceed budgets

## Related Documentation

- [Performance Tests README](__tests__/performance/README.md)
- [Performance Optimization Guide](docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Test Output](${reportPath})

---

_Generated by: scripts/extract-performance-metrics.ts_
`;
}
