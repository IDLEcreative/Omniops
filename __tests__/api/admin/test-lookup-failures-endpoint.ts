/**
 * Comprehensive API Testing Script for /api/admin/lookup-failures
 *
 * Usage: npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
 * Prerequisites: Dev server must be running on port 3000
 *
 * Test suites organized in ./lookup-failures-tests/
 */

import { checkServerHealth, verifyDataAccuracy } from './lookup-failures-tests/server-health';
import { runBasicTests } from './lookup-failures-tests/basic-tests';
import { runEdgeCaseTests } from './lookup-failures-tests/edge-case-tests';
import { runPerformanceTests, runConcurrentTests } from './lookup-failures-tests/performance-tests';

export interface TestResult {
  name: string;
  passed: boolean;
  responseTime: number;
  error?: string;
  details?: string;
}

class APITester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];
  private startTime = Date.now();

  generateReport(): void {
    const totalTime = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;

    console.log('\n' + '='.repeat(80));
    console.log('📊 API TESTING REPORT - /api/admin/lookup-failures');
    console.log('='.repeat(80) + '\n');

    const status = passedTests === totalTests
      ? '✅ ALL TESTS PASSED'
      : passedTests > totalTests * 0.8
        ? '⚠️ SOME ISSUES'
        : '❌ CRITICAL FAILURES';

    console.log(`Status: ${status}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)} seconds\n`);

    console.log('Test Results:\n');
    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.passed ? '✅' : '❌'} ${result.name}`);
      if (result.responseTime > 0) {
        console.log(`   Response Time: ${result.responseTime.toFixed(2)}ms`);
      }
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Recommendations
    console.log('Recommendations:\n');

    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! No immediate actions required.');
    } else {
      console.log('⚠️ Issues to address:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.error || 'Failed validation'}`);
      });
    }

    const slowTests = this.results.filter(r => r.responseTime > 200);
    if (slowTests.length > 0) {
      console.log('\n⏱️ Performance concerns:');
      slowTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.responseTime.toFixed(2)}ms (target: <200ms)`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Comprehensive API Testing\n');
    console.log('Target: /api/admin/lookup-failures');
    console.log('Port: 3000\n');
    console.log('='.repeat(80) + '\n');

    // Check server health
    const serverReady = await checkServerHealth(this.baseUrl);
    if (!serverReady) {
      console.log('❌ Cannot proceed with tests - server not available\n');
      console.log('Please start the dev server with: npm run dev\n');
      process.exit(1);
    }

    // Run all test suites
    this.results.push(...await runBasicTests(this.baseUrl));
    this.results.push(...await runEdgeCaseTests(this.baseUrl));
    this.results.push(...await runPerformanceTests(this.baseUrl));
    this.results.push(...await runConcurrentTests(this.baseUrl));

    // Verify data accuracy
    const accuracyResult = await verifyDataAccuracy(this.baseUrl);
    this.results.push({
      name: 'Data Structure Validation',
      passed: accuracyResult.passed,
      responseTime: 0,
      error: accuracyResult.error,
      details: accuracyResult.passed ? 'All expected fields present and valid' : undefined
    });

    // Generate final report
    this.generateReport();
  }
}

// Main execution
async function main() {
  const tester = new APITester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
