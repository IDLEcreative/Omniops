/**
 * Test Stability Report Generation
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { StabilityMetrics } from './test-stability-types';

const METRICS_DIR = path.join(process.cwd(), 'logs', 'test-stability');
const REPORT_FILE = path.join(METRICS_DIR, 'stability-report.md');

async function ensureMetricsDirectory() {
  await fs.mkdir(METRICS_DIR, { recursive: true });
}

export async function generateReport(metrics: StabilityMetrics): Promise<string> {
  const lastRuns = metrics.runs.slice(-10);

  // Calculate statistics
  const totalSigkills = metrics.runs.reduce((sum, run) => sum + run.errors.sigkill, 0);
  const avgSuccessRate = metrics.runs.length > 0
    ? metrics.runs.reduce((sum, run) => sum + (run.passedTests / Math.max(run.totalTests, 1)), 0) / metrics.runs.length
    : 0;

  // Find problematic test suites
  const suiteCounts: { [key: string]: number } = {};
  metrics.runs.forEach(run => {
    run.failedSuites.forEach(suite => {
      suiteCounts[suite] = (suiteCounts[suite] || 0) + 1;
    });
  });

  const report = `# Test Stability Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Test Runs**: ${metrics.runs.length}
- **Average Success Rate**: ${(avgSuccessRate * 100).toFixed(2)}%
- **Total SIGKILL Occurrences**: ${totalSigkills}
- **SIGKILL Frequency**: ${metrics.runs.length > 0 ? ((totalSigkills / metrics.runs.length) * 100).toFixed(2) : 0}%

## Recent Runs (Last 10)
${lastRuns.map(run => `
### ${run.date} - ${run.timestamp}
- **Status**: ${run.errors.sigkill > 0 ? '❌ SIGKILL' : run.failedTests > 0 ? '⚠️ Failures' : '✅ Passed'}
- **Tests**: ${run.passedTests}/${run.totalTests} passed (${run.failedTests} failed, ${run.skippedTests} skipped)
- **Duration**: ${run.duration}s
- **Memory**: Peak ${run.memoryUsage.peak}MB, Avg ${run.memoryUsage.average}MB
- **Errors**: SIGKILL: ${run.errors.sigkill}, Timeout: ${run.errors.timeout}, Memory: ${run.errors.memoryLeak}
${run.warnings.length > 0 ? `- **Warnings**: ${run.warnings.join(', ')}` : ''}
${run.failedSuites.length > 0 ? `- **Failed Suites**: ${run.failedSuites.join(', ')}` : ''}
`).join('\n')}

## Most Frequently Failed Test Suites
${Object.entries(suiteCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([suite, count]) => `- **${suite}**: Failed ${count} times`)
  .join('\n') || 'No failures recorded'}

## Memory Analysis
${(() => {
  const recentRuns = metrics.runs.slice(-20);
  if (recentRuns.length === 0) return 'No data available';

  const avgPeak = recentRuns.reduce((sum, run) => sum + run.memoryUsage.peak, 0) / recentRuns.length;
  const maxPeak = Math.max(...recentRuns.map(run => run.memoryUsage.peak));

  return `- **Average Peak Memory**: ${avgPeak.toFixed(0)}MB
- **Maximum Peak Memory**: ${maxPeak}MB
- **Memory Limit**: 8192MB (8GB)
- **Safety Margin**: ${((8192 - maxPeak) / 8192 * 100).toFixed(1)}%`;
})()}

## Recommendations
${generateRecommendations(metrics).map(r => `- ${r}`).join('\n')}

## Configuration
- **Memory Limit**: 8192MB (8GB)
- **Jest Workers**: 1 (serial execution)
- **Node Version**: ${process.version}
`;

  await ensureMetricsDirectory();
  await fs.writeFile(REPORT_FILE, report);
  console.log(`📄 Report saved to: ${REPORT_FILE}`);
  return report;
}

export function generateRecommendations(metrics: StabilityMetrics): string[] {
  const recommendations: string[] = [];
  const recentRuns = metrics.runs.slice(-10);

  if (recentRuns.length === 0) {
    return ['Run more tests to gather stability data'];
  }

  // Check SIGKILL frequency
  const recentSigkills = recentRuns.filter(run => run.errors.sigkill > 0).length;
  if (recentSigkills > 3) {
    recommendations.push('⚠️ High SIGKILL frequency detected. Consider:');
    recommendations.push('  - Further memory optimization');
    recommendations.push('  - Splitting test suites');
    recommendations.push('  - Investigating memory leaks in specific tests');
  }

  // Check memory usage
  const avgPeak = recentRuns.reduce((sum, run) => sum + run.memoryUsage.peak, 0) / recentRuns.length;
  if (avgPeak > 6000) {
    recommendations.push('⚠️ High memory usage detected (>6GB). Consider:');
    recommendations.push('  - Optimizing test setup/teardown');
    recommendations.push('  - Using beforeEach/afterEach for cleanup');
    recommendations.push('  - Reviewing mock implementations');
  }

  // Check test duration
  const avgDuration = recentRuns.reduce((sum, run) => sum + run.duration, 0) / recentRuns.length;
  if (avgDuration > 300) {
    recommendations.push('⏱️ Long test duration (>5 min). Consider:');
    recommendations.push('  - Parallelizing test suites (if memory allows)');
    recommendations.push('  - Optimizing slow tests');
    recommendations.push('  - Using test.concurrent for independent tests');
  }

  // Check specific suite failures
  const suiteCounts: { [key: string]: number } = {};
  recentRuns.forEach(run => {
    run.failedSuites.forEach(suite => {
      suiteCounts[suite] = (suiteCounts[suite] || 0) + 1;
    });
  });

  const problematicSuites = Object.entries(suiteCounts)
    .filter(([, count]) => count >= 3)
    .map(([suite]) => suite);

  if (problematicSuites.length > 0) {
    recommendations.push('🔴 Consistently failing suites detected:');
    problematicSuites.forEach(suite => {
      recommendations.push(`  - Fix or skip: ${suite}`);
    });
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Test stability is good! Continue monitoring.');
  }

  return recommendations;
}
