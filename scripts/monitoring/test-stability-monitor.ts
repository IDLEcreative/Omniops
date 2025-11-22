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

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { TestRun, StabilityMetrics } from './test-stability-types';
import { generateReport } from './test-stability-reporter';
import { analyzePatterns } from './test-stability-analyzer';

// Configuration
const METRICS_DIR = path.join(process.cwd(), 'logs', 'test-stability');
const METRICS_FILE = path.join(METRICS_DIR, 'stability-metrics.json');

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
    jestWorkers: 1
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
      const testRun = await runTestsWithMonitoring();
      const metrics = await loadMetrics();
      metrics.runs.push(testRun);
      await saveMetrics(metrics);

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
