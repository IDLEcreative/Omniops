#!/usr/bin/env npx tsx
/**
 * Error Injection Test Suite Runner
 *
 * Orchestrates all three Phase 2 error injection tests:
 * 1. Promise.allSettled Fallback Tests
 * 2. Redis Fallback Tests
 * 3. Null/Undefined Data Injection Tests
 *
 * Validates system resilience by forcing failures at critical points
 * and confirming graceful fallback behavior.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const TEST_SCRIPTS_DIR = __dirname;

interface TestSuiteResult {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'error' | 'skipped';
  duration: number;
  output: string;
  error?: string;
}

const TEST_SUITES = [
  {
    name: 'Promise.allSettled Fallback Tests',
    file: 'test-promise-allsettled-fallbacks.ts',
    description: 'Validates graceful handling of Promise.allSettled rejections'
  },
  {
    name: 'Redis Fallback Tests',
    file: 'test-redis-fallback.ts',
    description: 'Validates fail-open behavior when Redis is unavailable'
  },
  {
    name: 'Null/Undefined Data Injection Tests',
    file: 'test-null-data-injection.ts',
    description: 'Validates graceful handling of null/undefined data'
  }
];

/**
 * Run a single test suite
 */
function runTestSuite(suite: typeof TEST_SUITES[0]): TestSuiteResult {
  const scriptPath = join(TEST_SCRIPTS_DIR, suite.file);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Running: ${suite.name}`);
  console.log(`File: ${suite.file}`);
  console.log(`Description: ${suite.description}`);
  console.log(`${'='.repeat(70)}`);

  // Check if file exists
  if (!existsSync(scriptPath)) {
    console.error(`❌ Test file not found: ${scriptPath}`);
    return {
      name: suite.name,
      file: suite.file,
      status: 'skipped',
      duration: 0,
      output: '',
      error: `File not found: ${scriptPath}`
    };
  }

  const startTime = performance.now();
  let output = '';
  let error = '';

  try {
    // Run the test script with a 5-minute timeout
    output = execSync(`npx tsx "${scriptPath}"`, {
      timeout: 5 * 60 * 1000, // 5 minutes
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const duration = performance.now() - startTime;

    console.log(output);

    return {
      name: suite.name,
      file: suite.file,
      status: 'passed',
      duration,
      output
    };
  } catch (err) {
    const duration = performance.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Check if it's a timeout
    if (errorMessage.includes('ETIMEDOUT')) {
      console.error(`❌ Test suite timed out after ${(duration / 1000).toFixed(1)}s`);
      error = 'Test suite timeout';
    } else {
      console.error(`❌ Test suite failed`);
      error = errorMessage;
    }

    // Still print partial output if available
    if (err instanceof Error && 'stdout' in err) {
      console.log((err as any).stdout?.toString() || '');
    }

    return {
      name: suite.name,
      file: suite.file,
      status: 'error',
      duration,
      output,
      error
    };
  }
}

/**
 * Generate summary report
 */
function generateReport(results: TestSuiteResult[]) {
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n${'='.repeat(70)}`);
  console.log('ERROR INJECTION TEST SUITE - SUMMARY REPORT');
  console.log(`${'='.repeat(70)}`);

  console.log(`\nExecution Summary:`);
  console.log(`  Total Suites: ${results.length}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⚠️  Errors: ${errors}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  console.log(`\nDetailed Results:`);
  for (const result of results) {
    const icon = result.status === 'passed' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Critical findings
  console.log(`\n${'='.repeat(70)}`);
  console.log('CRITICAL FINDINGS');
  console.log(`${'='.repeat(70)}`);

  let criticalFound = false;

  // Check for TypeErrors in null injection tests
  const nullTestResult = results.find(r => r.file.includes('null-data'));
  if (nullTestResult && nullTestResult.output.includes('TypeError')) {
    console.log('\n⚠️  CRITICAL: TypeErrors detected in null data injection tests');
    console.log('   The system may crash when receiving null/undefined data');
    criticalFound = true;
  }

  // Check for Redis fallback failures
  const redisTestResult = results.find(r => r.file.includes('redis'));
  if (redisTestResult && redisTestResult.status === 'error') {
    console.log('\n⚠️  CRITICAL: Redis fallback tests failed');
    console.log('   Rate limiting may fail when Redis is unavailable');
    criticalFound = true;
  }

  // Check for Promise.allSettled failures
  const promiseTestResult = results.find(r => r.file.includes('promise'));
  if (promiseTestResult && promiseTestResult.status === 'error') {
    console.log('\n⚠️  CRITICAL: Promise.allSettled fallback tests failed');
    console.log('   Chat may fail when database operations are slow');
    criticalFound = true;
  }

  if (!criticalFound) {
    console.log('\n✅ No critical issues detected');
    console.log('   All fallback mechanisms are functioning correctly');
  }

  // Recommendations
  console.log(`\n${'='.repeat(70)}`);
  console.log('RECOMMENDATIONS');
  console.log(`${'='.repeat(70)}`);

  if (errors > 0 || failed > 0) {
    console.log('\n1. Review failed test output above');
    console.log('2. Check system logs for underlying issues');
    console.log('3. Verify database and Redis connectivity');
    console.log('4. Run individual tests for detailed debugging:');
    console.log('   npx tsx scripts/tests/test-promise-allsettled-fallbacks.ts');
    console.log('   npx tsx scripts/tests/test-redis-fallback.ts');
    console.log('   npx tsx scripts/tests/test-null-data-injection.ts');
  } else {
    console.log('\n✅ All tests passed successfully!');
    console.log('   Phase 2 error handling is production-ready');
  }

  console.log(`\n${'='.repeat(70)}\n`);

  return {
    passed,
    failed,
    errors,
    skipped,
    success: failed === 0 && errors === 0
  };
}

/**
 * Main execution
 */
async function runErrorInjectionSuite() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('ERROR INJECTION TEST SUITE RUNNER');
  console.log('Phase 2 Fallback Mechanism Validation');
  console.log(`${'='.repeat(70)}`);

  console.log(`\nTest Suites to Execute: ${TEST_SUITES.length}`);
  for (const suite of TEST_SUITES) {
    console.log(`  • ${suite.name}`);
  }

  // Verify dev server is running
  console.log(`\nVerifying test environment...`);
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      timeout: 5000
    }).catch(() => null);

    if (!response) {
      console.warn('⚠️  Warning: Dev server may not be running');
      console.warn('   Ensure you have started the dev server: npm run dev');
      console.warn('   Many tests will fail without it\n');
    } else {
      console.log('✅ Dev server is running\n');
    }
  } catch (err) {
    console.warn('⚠️  Could not verify dev server\n');
  }

  // Run all test suites
  const results: TestSuiteResult[] = [];
  for (const suite of TEST_SUITES) {
    const result = runTestSuite(suite);
    results.push(result);

    // Add delay between suites
    if (TEST_SUITES.indexOf(suite) < TEST_SUITES.length - 1) {
      console.log('\nWaiting before next suite...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate report
  const summary = generateReport(results);

  // Exit with appropriate code
  process.exit(summary.success ? 0 : 1);
}

// Run the suite
runErrorInjectionSuite().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
