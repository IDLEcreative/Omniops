#!/usr/bin/env tsx
/**
 * Extract Performance Metrics from Test Results
 *
 * Parses performance test output (JSON or text format) and generates reports
 * Usage:
 *   npx tsx scripts/extract-performance-metrics.ts [input-file] [output-file]
 *
 * Generates:
 * - PERFORMANCE_BASELINE.md (formatted report)
 * - performance-baseline-report.txt (machine-readable)
 * - performance-metrics-YYYY-MM-DD.json (timestamped metrics)
 */

import * as fs from 'fs';
import path from 'path';
import { PerformanceMetrics, JestTestResult, categorizeTest, generateMachineReadableReport } from './performance-utils';
import {
  generateMarkdownTable,
  evaluateBudgets,
  generateRecommendations,
  generateMarkdownReport
} from './performance-report-generator';

/**
 * Parse JSON report from Jest test output
 */
function parseJSONReport(filePath: string): PerformanceMetrics[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results: JestTestResult = JSON.parse(content);
  const metrics: PerformanceMetrics[] = [];

  for (const testResult of results.testResults) {
    const message = testResult.message || '';
    const lines = message.split('\n');

    let currentTest: Partial<PerformanceMetrics> = {};
    let testName = '';

    for (const line of lines) {
      // Detect test name from "Performance Metrics:" label
      const labelMatch = line.match(/(.+?) - Performance Metrics:/);
      if (labelMatch) {
        if (testName && Object.keys(currentTest).length > 0) {
          metrics.push(buildMetric(testName, currentTest, testResult.status));
        }
        testName = labelMatch[1].trim();
        currentTest = {};
        continue;
      }

      // Extract metrics
      const p50Match = line.match(/p50:\s+(\d+(?:\.\d+)?)(?:ms|s)/);
      const p90Match = line.match(/p90:\s+(\d+(?:\.\d+)?)(?:ms|s)/);
      const p95Match = line.match(/p95:\s+(\d+(?:\.\d+)?)(?:ms|s)/);
      const p99Match = line.match(/p99:\s+(\d+(?:\.\d+)?)(?:ms|s)/);
      const meanMatch = line.match(/Mean:\s+(\d+(?:\.\d+)?)(?:ms|s)/);
      const throughputMatch = line.match(/Throughput:\s+(\d+(?:\.\d+)?)\s+req\/s/);
      const successRateMatch = line.match(/Success Rate:\s+(\d+(?:\.\d+)?)%/);
      const durationMatch = line.match(/Duration:\s+(\d+(?:\.\d+)?)(?:ms|s)/);

      if (p50Match) currentTest.p50 = parseFloat(p50Match[1]);
      if (p90Match) currentTest.p90 = parseFloat(p90Match[1]);
      if (p95Match) currentTest.p95 = parseFloat(p95Match[1]);
      if (p99Match) currentTest.p99 = parseFloat(p99Match[1]);
      if (meanMatch) currentTest.mean = parseFloat(meanMatch[1]);
      if (throughputMatch) currentTest.throughput = parseFloat(throughputMatch[1]);
      if (successRateMatch) {
        currentTest.successRate = parseFloat(successRateMatch[1]);
        currentTest.errorRate = 100 - currentTest.successRate;
      }
      if (durationMatch) currentTest.duration = parseFloat(durationMatch[1]);
    }

    // Add last test
    if (testName && Object.keys(currentTest).length > 0) {
      metrics.push(buildMetric(testName, currentTest, testResult.status));
    }
  }

  return metrics;
}

/**
 * Parse text-format performance report
 */
function parseTextReport(filePath: string): PerformanceMetrics[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const metrics: PerformanceMetrics[] = [];

  const lines = content.split('\n');
  let currentTest: Partial<PerformanceMetrics> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect test start
    if (line.includes('PASS') || line.includes('FAIL')) {
      if (line.includes('__tests__/performance/')) {
        const testPath = line.match(/__tests__\/performance\/(.+?)\.test\.ts/)?.[1];
        if (testPath) {
          if (currentTest) {
            metrics.push(currentTest as PerformanceMetrics);
          }

          const parts = testPath.split('/');
          currentTest = {
            testName: parts[parts.length - 1] || testPath,
            category: parts[0] || 'unknown',
            p50: null,
            p90: null,
            p95: null,
            p99: null,
            throughput: null,
            errorRate: null,
            duration: null,
            status: line.includes('PASS') ? 'PASS' : 'FAIL'
          };
        }
      }
    }

    // Extract p-percentiles
    const percentileMatch = line.match(/p(\d+):\s*(\d+(?:\.\d+)?)\s*ms/g);
    if (percentileMatch && currentTest) {
      percentileMatch.forEach(match => {
        const [, percentile, value] = match.match(/p(\d+):\s*(\d+(?:\.\d+)?)/) || [];
        if (percentile && value && (currentTest as any)) {
          const key = `p${percentile}` as keyof PerformanceMetrics;
          if (key in currentTest) {
            (currentTest as any)[key] = parseFloat(value);
          }
        }
      });
    }

    // Extract throughput
    const throughputMatch = line.match(/throughput:\s*(\d+(?:\.\d+)?)\s*(?:req\/s|jobs\/s)/i);
    if (throughputMatch && currentTest) {
      currentTest.throughput = parseFloat(throughputMatch[1]);
    }

    // Extract error rate
    const errorRateMatch = line.match(/error\s*rate:\s*(\d+(?:\.\d+)?)\s*%/i);
    if (errorRateMatch && currentTest) {
      currentTest.errorRate = parseFloat(errorRateMatch[1]);
    }

    // Extract test duration
    const durationMatch = line.match(/Time:\s*(\d+(?:\.\d+)?)\s*s/);
    if (durationMatch && currentTest) {
      currentTest.duration = parseFloat(durationMatch[1]);
    }
  }

  // Add last test
  if (currentTest) {
    metrics.push(currentTest as PerformanceMetrics);
  }

  return metrics;
}

/**
 * Build a complete metric object from parsed data
 */
function buildMetric(
  testName: string,
  partial: Partial<PerformanceMetrics>,
  testStatus: 'passed' | 'failed'
): PerformanceMetrics {
  return {
    testName,
    category: categorizeTest(testName),
    status: testStatus === 'passed' ? 'PASS' : 'FAIL',
    p50: partial.p50 || null,
    p90: partial.p90 || null,
    p95: partial.p95 || null,
    p99: partial.p99 || null,
    mean: partial.mean || null,
    throughput: partial.throughput || null,
    errorRate: partial.errorRate || null,
    duration: partial.duration || null
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Extracting performance metrics from test results...\n');

  const jsonResultsPath = path.join(process.cwd(), 'performance-results.json');
  const textReportPath = process.argv[2] || 'performance-baseline-report.txt';
  const outputPath = process.argv[3] || 'PERFORMANCE_BASELINE.md';

  let metrics: PerformanceMetrics[];

  // Try JSON format first (preferred for CI/CD)
  if (fs.existsSync(jsonResultsPath)) {
    console.log(`📊 Found JSON results: ${jsonResultsPath}`);
    metrics = parseJSONReport(jsonResultsPath);

    // Write timestamped metrics file for trend analysis
    const timestamp = new Date().toISOString().split('T')[0];
    const metricsFile = `performance-metrics-${timestamp}.json`;
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`✅ Generated ${metricsFile}\n`);
  }
  // Fall back to text format
  else if (fs.existsSync(textReportPath)) {
    console.log(`📊 Found text report: ${textReportPath}`);
    metrics = parseTextReport(textReportPath);
  }
  // No input found
  else {
    console.error('❌ No performance results found');
    console.log('   Expected: performance-results.json (JSON) or performance-baseline-report.txt (text)');
    console.log('   Run: npm test -- __tests__/performance/ --json --outputFile=performance-results.json');
    process.exit(1);
  }

  if (metrics.length === 0) {
    console.warn('⚠️  No performance metrics found in test output');
    console.log('   Ensure tests call printMetrics() to output results\n');
    process.exit(0);
  }

  console.log(`✅ Extracted ${metrics.length} performance metric sets\n`);

  // Generate report sections
  const metricsTable = generateMarkdownTable(metrics);
  const budgetsTable = evaluateBudgets(metrics);
  const recommendations = generateRecommendations(metrics);
  const report = generateMarkdownReport(metrics, metricsTable, budgetsTable, recommendations, textReportPath);

  // Write markdown report
  fs.writeFileSync(outputPath, report);

  // Write machine-readable report
  const machineReport = generateMachineReadableReport(metrics);
  fs.writeFileSync('performance-baseline-report.txt', machineReport);

  // Report results
  console.log(`✅ Performance baseline report generated: ${outputPath}`);
  console.log(`✅ Machine-readable report: performance-baseline-report.txt`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Tests run: ${metrics.length}`);
  console.log(`   - Passed: ${metrics.filter(m => m.status === 'PASS').length}`);
  console.log(`   - Failed: ${metrics.filter(m => m.status === 'FAIL').length}`);

  if (metrics.filter(m => m.status === 'FAIL').length > 0) {
    console.log(`\n❌ Some tests failed. Review the report for details.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All performance tests passed!`);
    process.exit(0);
  }
}

main();
