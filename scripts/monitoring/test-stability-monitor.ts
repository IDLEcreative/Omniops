#!/usr/bin/env tsx
/**
 * Test Stability Monitoring System
 *
 * Purpose: Track test failures, SIGKILL occurrences, memory issues, and other stability metrics
 * to identify patterns and prevent regressions.
 *
 * Usage:
 *   npx tsx scripts/monitoring/test-stability-monitor.ts run     - Run tests and capture metrics
 *   npx tsx scripts/monitoring/test-stability-monitor.ts report  - Generate stability report
 *   npx tsx scripts/monitoring/test-stability-monitor.ts track   - Track metrics over time
 *   npx tsx scripts/monitoring/test-stability-monitor.ts analyze - Analyze patterns
 */

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Configuration
const METRICS_DIR = path.join(process.cwd(), 'logs', 'test-stability');
const METRICS_FILE = path.join(METRICS_DIR, 'stability-metrics.json');
const REPORT_FILE = path.join(METRICS_DIR, 'stability-report.md');

interface TestRun {
  timestamp: string;
  date: string;
  memoryLimit: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  memoryUsage: {
    peak: number;
    average: number;
  };
  errors: {
    sigkill: number;
    timeout: number;
    memoryLeak: number;
    other: number;
  };
  failedSuites: string[];
  sigkillOccurrences: string[];
  warnings: string[];
  nodeVersion: string;
  jestWorkers: number;
}

interface StabilityMetrics {
  runs: TestRun[];
  summary: {
    totalRuns: number;
    averageSuccessRate: number;
    sigkillFrequency: number;
    mostFailedSuites: { [key: string]: number };
    memoryIssues: number;
    recommendations: string[];
  };
}

async function ensureMetricsDirectory() {
  await fs.mkdir(METRICS_DIR, { recursive: true });
}

async function loadMetrics(): Promise<StabilityMetrics> {
  try {
    const data = await fs.readFile(METRICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      runs: [],
      summary: {
        totalRuns: 0,
        averageSuccessRate: 0,
        sigkillFrequency: 0,
        mostFailedSuites: {},
        memoryIssues: 0,
        recommendations: []
      }
    };
  }
}

async function saveMetrics(metrics: StabilityMetrics) {
  await ensureMetricsDirectory();
  await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

async function runTestsWithMonitoring(): Promise<TestRun> {
  console.log('🔍 Starting test run with stability monitoring...\n');

  const startTime = Date.now();
  const testRun: TestRun = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    memoryLimit: process.env.NODE_OPTIONS?.match(/max-old-space-size=(\d+)/)?.[1] || '8192',
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    duration: 0,
    memoryUsage: { peak: 0, average: 0 },
    errors: { sigkill: 0, timeout: 0, memoryLeak: 0, other: 0 },
    failedSuites: [],
    sigkillOccurrences: [],
    warnings: [],
    nodeVersion: process.version,
    jestWorkers: 1 // From jest.config.js
  };

  // Track memory usage
  const memoryReadings: number[] = [];
  const memoryInterval = setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    memoryReadings.push(heapUsedMB);
  }, 1000);

  return new Promise((resolve) => {
    const testProcess = spawn('npm', ['test'], {
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192 --expose-gc' },
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(data);

      // Parse test results in real-time
      if (text.includes('Tests:')) {
        const match = text.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+skipped,\s+(\d+)\s+total/);
        if (match) {
          testRun.failedTests = parseInt(match[1]);
          testRun.passedTests = parseInt(match[2]);
          testRun.skippedTests = parseInt(match[3]);
          testRun.totalTests = parseInt(match[4]);
        }
      }

      // Detect SIGKILL
      if (text.includes('SIGKILL')) {
        testRun.errors.sigkill++;
        const context = text.split('\n').slice(-5, 5).join('\n');
        testRun.sigkillOccurrences.push(context);
      }

      // Detect timeout
      if (text.includes('Timeout - Async callback was not invoked')) {
        testRun.errors.timeout++;
      }

      // Detect memory issues
      if (text.includes('JavaScript heap out of memory') || text.includes('Cannot allocate memory')) {
        testRun.errors.memoryLeak++;
        testRun.warnings.push('Memory exhaustion detected');
      }

      // Capture failed test suites
      if (text.includes('FAIL ')) {
        const match = text.match(/FAIL\s+(.*\.test\.(ts|tsx|js|jsx))/);
        if (match) {
          testRun.failedSuites.push(match[1]);
        }
      }
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    testProcess.on('close', (code) => {
      clearInterval(memoryInterval);

      // Calculate memory statistics
      if (memoryReadings.length > 0) {
        testRun.memoryUsage.peak = Math.max(...memoryReadings);
        testRun.memoryUsage.average = Math.round(
          memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length
        );
      }

      testRun.duration = Math.round((Date.now() - startTime) / 1000);

      // Check for other errors
      if (code !== 0 && testRun.errors.sigkill === 0 && testRun.errors.timeout === 0) {
        testRun.errors.other++;
      }

      // Add warnings based on analysis
      if (testRun.memoryUsage.peak > 6000) {
        testRun.warnings.push(`High memory usage: ${testRun.memoryUsage.peak}MB`);
      }

      if (testRun.errors.sigkill > 0) {
        testRun.warnings.push(`SIGKILL detected ${testRun.errors.sigkill} times`);
      }

      if (testRun.duration > 300) {
        testRun.warnings.push(`Long test duration: ${testRun.duration}s`);
      }

      console.log('\n📊 Test run completed\n');
      resolve(testRun);
    });
  });
}

async function generateReport(metrics: StabilityMetrics) {
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

function generateRecommendations(metrics: StabilityMetrics): string[] {
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

async function analyzePatterns(metrics: StabilityMetrics) {
  console.log('\n📈 Analyzing test stability patterns...\n');

  if (metrics.runs.length < 5) {
    console.log('⚠️ Not enough data for pattern analysis. Need at least 5 test runs.');
    return;
  }

  // Time-based analysis
  const hourlyStats: { [hour: string]: { runs: number; sigkills: number } } = {};
  metrics.runs.forEach(run => {
    const hour = new Date(run.timestamp).getHours();
    const key = `${hour}:00`;
    if (!hourlyStats[key]) {
      hourlyStats[key] = { runs: 0, sigkills: 0 };
    }
    hourlyStats[key].runs++;
    if (run.errors.sigkill > 0) {
      hourlyStats[key].sigkills++;
    }
  });

  console.log('📊 Time-based Analysis:');
  Object.entries(hourlyStats)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([hour, stats]) => {
      const rate = (stats.sigkills / stats.runs * 100).toFixed(1);
      console.log(`  ${hour} - Runs: ${stats.runs}, SIGKILL rate: ${rate}%`);
    });

  // Trend analysis
  const last10 = metrics.runs.slice(-10);
  const prev10 = metrics.runs.slice(-20, -10);

  if (prev10.length > 0) {
    const currentSigkillRate = last10.filter(r => r.errors.sigkill > 0).length / last10.length;
    const prevSigkillRate = prev10.filter(r => r.errors.sigkill > 0).length / prev10.length;

    console.log('\n📈 Trend Analysis:');
    if (currentSigkillRate > prevSigkillRate) {
      console.log('  ⚠️ SIGKILL rate is INCREASING');
    } else if (currentSigkillRate < prevSigkillRate) {
      console.log('  ✅ SIGKILL rate is DECREASING');
    } else {
      console.log('  ➡️ SIGKILL rate is STABLE');
    }

    console.log(`  Previous 10 runs: ${(prevSigkillRate * 100).toFixed(1)}%`);
    console.log(`  Last 10 runs: ${(currentSigkillRate * 100).toFixed(1)}%`);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'run': {
      const testRun = await runTestsWithMonitoring();
      const metrics = await loadMetrics();
      metrics.runs.push(testRun);

      // Update summary
      metrics.summary.totalRuns = metrics.runs.length;
      metrics.summary.averageSuccessRate = metrics.runs.reduce(
        (sum, run) => sum + (run.passedTests / Math.max(run.totalTests, 1)),
        0
      ) / metrics.runs.length;
      metrics.summary.sigkillFrequency = metrics.runs.filter(r => r.errors.sigkill > 0).length / metrics.runs.length;

      await saveMetrics(metrics);
      console.log('\n✅ Test metrics saved');

      // Show summary
      console.log('\n📊 Summary:');
      console.log(`  Total tests: ${testRun.totalTests}`);
      console.log(`  Passed: ${testRun.passedTests}`);
      console.log(`  Failed: ${testRun.failedTests}`);
      console.log(`  Duration: ${testRun.duration}s`);
      console.log(`  Peak memory: ${testRun.memoryUsage.peak}MB`);
      if (testRun.errors.sigkill > 0) {
        console.log(`  ⚠️ SIGKILL detected: ${testRun.errors.sigkill} times`);
      }
      break;
    }

    case 'report': {
      const metrics = await loadMetrics();
      const report = await generateReport(metrics);
      console.log('\n' + report);
      break;
    }

    case 'track': {
      console.log('📊 Starting continuous test monitoring...');
      console.log('Running tests every 30 minutes. Press Ctrl+C to stop.\n');

      // Run immediately
      await main.call(null);

      // Then run every 30 minutes
      setInterval(async () => {
        console.log('\n🔄 Running scheduled test...\n');
        const testRun = await runTestsWithMonitoring();
        const metrics = await loadMetrics();
        metrics.runs.push(testRun);
        await saveMetrics(metrics);

        if (testRun.errors.sigkill > 0) {
          console.log('\n⚠️ ALERT: SIGKILL detected in test run!');
        }
      }, 30 * 60 * 1000);
      break;
    }

    case 'analyze': {
      const metrics = await loadMetrics();
      await analyzePatterns(metrics);
      break;
    }

    default:
      console.log('Test Stability Monitor');
      console.log('\nUsage:');
      console.log('  npx tsx scripts/monitoring/test-stability-monitor.ts run     - Run tests with monitoring');
      console.log('  npx tsx scripts/monitoring/test-stability-monitor.ts report  - Generate report');
      console.log('  npx tsx scripts/monitoring/test-stability-monitor.ts track   - Continuous monitoring');
      console.log('  npx tsx scripts/monitoring/test-stability-monitor.ts analyze - Analyze patterns');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}