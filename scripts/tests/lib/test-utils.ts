/**
 * Shared test utilities for search validation scripts
 */

export const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
} as const;

export interface TestResult {
  name: string;
  query: string;
  expectedMin: number;
  actualCount: number;
  passed: boolean;
  executionTime: number;
  strategy?: string;
  notes?: string;
}

export function log(color: keyof typeof COLORS, message: string): void {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

export function logHeader(title: string): void {
  console.log('\n' + '='.repeat(80));
  log('cyan', `  ${title}`);
  console.log('='.repeat(80) + '\n');
}

export function printSummary(results: TestResult[]): void {
  logHeader('TEST RESULTS SUMMARY');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  log('green', `Passed: ${passedTests}`);
  log(failedTests > 0 ? 'red' : 'green', `Failed: ${failedTests}`);
  log('cyan', `Pass Rate: ${passRate}%`);
}

export function printDetailedResults(results: TestResult[]): void {
  console.log('\n' + '-'.repeat(80));
  console.log('Detailed Results:');
  console.log('-'.repeat(80));

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';

    console.log(`\n${index + 1}. ${result.name}`);
    log(color, `   ${status}`);
    console.log(`   Query: "${result.query}"`);
    console.log(`   Expected: ≥${result.expectedMin} results`);
    console.log(`   Actual: ${result.actualCount} results`);
    console.log(`   Time: ${result.executionTime}ms`);
    if (result.strategy) {
      console.log(`   Recovery Strategy: ${result.strategy}`);
    }
    if (result.notes) {
      log('blue', `   Notes: ${result.notes}`);
    }
  });
}

export function printPerformanceMetrics(results: TestResult[]): void {
  logHeader('PERFORMANCE METRICS');

  const validResults = results.filter(r => r.executionTime > 0);
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const maxExecutionTime = Math.max(...results.map(r => r.executionTime));
  const minExecutionTime = Math.min(...validResults.map(r => r.executionTime));

  console.log(`Average Execution Time: ${avgExecutionTime.toFixed(0)}ms`);
  console.log(`Min Execution Time: ${minExecutionTime}ms`);
  console.log(`Max Execution Time: ${maxExecutionTime}ms`);
}
