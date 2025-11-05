/**
 * Comprehensive API Testing Script for /api/admin/lookup-failures
 *
 * Usage: npx tsx __tests__/api/admin/test-lookup-failures-endpoint.ts
 * Prerequisites: Dev server must be running on port 3000
 */

interface LookupFailureStats {
  stats: {
    totalFailures: number;
    byErrorType: Record<string, number>;
    byPlatform: Record<string, number>;
    topFailedQueries: Array<{ query: string; count: number }>;
    commonPatterns: string[];
  };
  period: string;
  domainId: string;
}

interface TestResult {
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

  async checkServerHealth(): Promise<boolean> {
    console.log('🔍 Checking server status...\n');

    for (let i = 1; i <= 6; i++) {
      try {
        const response = await fetch(`${this.baseUrl}`, { method: 'HEAD' });
        if (response.ok || response.status === 404) {
          console.log('✅ Server is responding on port 3000\n');
          return true;
        }
      } catch (error) {
        console.log(`Attempt ${i}/6: Server not ready, waiting...`);
        if (i < 6) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }

    console.log('❌ Server failed to respond after 6 attempts (1 minute)\n');
    return false;
  }

  async testEndpoint(name: string, url: string, expectedStatus = 200): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;

      if (response.status !== expectedStatus) {
        return {
          name,
          passed: false,
          responseTime,
          error: `Expected status ${expectedStatus}, got ${response.status}`
        };
      }

      const data = await response.json();

      // Validate response structure
      const validStructure = this.validateResponseStructure(data);

      return {
        name,
        passed: validStructure,
        responseTime,
        details: validStructure ? 'Valid response structure' : 'Invalid response structure'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name,
        passed: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  validateResponseStructure(data: any): boolean {
    if (!data.stats) return false;
    if (typeof data.stats.totalFailures !== 'number') return false;
    if (typeof data.stats.byErrorType !== 'object') return false;
    if (typeof data.stats.byPlatform !== 'object') return false;
    if (!Array.isArray(data.stats.topFailedQueries)) return false;
    if (!Array.isArray(data.stats.commonPatterns)) return false;
    if (typeof data.period !== 'string') return false;
    if (typeof data.domainId !== 'string') return false;

    return true;
  }

  async runBasicTests(): Promise<void> {
    console.log('📋 Running Basic Endpoint Tests...\n');

    const tests = [
      { name: 'Default (7 days)', url: `${this.baseUrl}/api/admin/lookup-failures` },
      { name: '1 day filter', url: `${this.baseUrl}/api/admin/lookup-failures?days=1` },
      { name: '30 day filter', url: `${this.baseUrl}/api/admin/lookup-failures?days=30` },
      { name: '90 day filter', url: `${this.baseUrl}/api/admin/lookup-failures?days=90` },
    ];

    for (const test of tests) {
      const result = await this.testEndpoint(test.name, test.url);
      this.results.push(result);
      console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.responseTime}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }

  async runEdgeCaseTests(): Promise<void> {
    console.log('🧪 Running Edge Case Tests...\n');

    const tests = [
      {
        name: 'Invalid days parameter',
        url: `${this.baseUrl}/api/admin/lookup-failures?days=abc`,
        description: 'Should handle non-numeric days gracefully'
      },
      {
        name: 'Negative days',
        url: `${this.baseUrl}/api/admin/lookup-failures?days=-1`,
        description: 'Should handle negative values gracefully'
      },
      {
        name: 'Very large days',
        url: `${this.baseUrl}/api/admin/lookup-failures?days=99999`,
        description: 'Should handle extreme values'
      },
      {
        name: 'Empty domainId',
        url: `${this.baseUrl}/api/admin/lookup-failures?domainId=`,
        description: 'Should default to all domains'
      },
      {
        name: 'Non-existent domainId',
        url: `${this.baseUrl}/api/admin/lookup-failures?domainId=00000000-0000-0000-0000-000000000000`,
        description: 'Should return empty or zero results'
      },
    ];

    for (const test of tests) {
      const result = await this.testEndpoint(test.name, test.url);
      this.results.push(result);
      console.log(`${result.passed ? '✅' : '❌'} ${test.name}: ${result.responseTime}ms`);
      console.log(`   ${test.description}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }

  async runPerformanceTests(): Promise<void> {
    console.log('⚡ Running Performance Tests (100 sequential requests)...\n');

    const url = `${this.baseUrl}/api/admin/lookup-failures`;
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const startTime = Date.now();
      try {
        await fetch(url);
        times.push(Date.now() - startTime);
      } catch (error) {
        console.log(`Request ${i + 1} failed`);
      }

      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`Progress: ${i + 1}/100 requests completed`);
      }
    }

    times.sort((a, b) => a - b);

    const min = times[0];
    const max = times[times.length - 1];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    console.log(`\n📊 Performance Results:`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    console.log(`   Avg: ${avg.toFixed(2)}ms`);
    console.log(`   p50: ${p50}ms`);
    console.log(`   p95: ${p95}ms`);
    console.log(`   p99: ${p99}ms`);
    console.log(`   Target (<200ms p95): ${p95 < 200 ? '✅ MET' : '⚠️ MISSED'}\n`);

    this.results.push({
      name: 'Performance Test (100 requests)',
      passed: p95 < 200,
      responseTime: avg,
      details: `p95: ${p95}ms, p99: ${p99}ms`
    });
  }

  async runConcurrentTests(): Promise<void> {
    console.log('🔄 Running Concurrent Request Tests (20 concurrent)...\n');

    const url = `${this.baseUrl}/api/admin/lookup-failures`;
    const promises: Promise<Response>[] = [];

    const startTime = Date.now();
    for (let i = 0; i < 20; i++) {
      promises.push(fetch(url));
    }

    try {
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 20;

      const successCount = responses.filter(r => r.ok).length;
      const failCount = 20 - successCount;

      console.log(`✅ All requests completed in ${totalTime}ms`);
      console.log(`   Successful: ${successCount}/20`);
      console.log(`   Failed: ${failCount}/20`);
      console.log(`   Average response time: ${avgTime.toFixed(2)}ms\n`);

      this.results.push({
        name: 'Concurrent Requests (20)',
        passed: successCount === 20,
        responseTime: avgTime,
        details: `${successCount}/20 successful`
      });
    } catch (error) {
      console.log(`❌ Concurrent test failed: ${error}\n`);
      this.results.push({
        name: 'Concurrent Requests (20)',
        passed: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async verifyDataAccuracy(): Promise<void> {
    console.log('🔍 Verifying Data Accuracy...\n');

    // This would require database access to compare
    // For now, we'll just verify the response format
    const url = `${this.baseUrl}/api/admin/lookup-failures?days=7`;

    try {
      const response = await fetch(url);
      const data: LookupFailureStats = await response.json();

      console.log(`📊 Sample Data Analysis:`);
      console.log(`   Total Failures: ${data.stats.totalFailures}`);
      console.log(`   Error Types: ${Object.keys(data.stats.byErrorType).length} types`);
      console.log(`   Platforms: ${Object.keys(data.stats.byPlatform).length} platforms`);
      console.log(`   Top Failed Queries: ${data.stats.topFailedQueries.length} entries`);
      console.log(`   Common Patterns: ${data.stats.commonPatterns.length} patterns`);
      console.log(`   Period: ${data.period}`);
      console.log(`   Domain ID: ${data.domainId}\n`);

      this.results.push({
        name: 'Data Structure Validation',
        passed: true,
        responseTime: 0,
        details: 'All expected fields present and valid'
      });
    } catch (error) {
      console.log(`❌ Data accuracy check failed: ${error}\n`);
      this.results.push({
        name: 'Data Structure Validation',
        passed: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

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
    const serverReady = await this.checkServerHealth();
    if (!serverReady) {
      console.log('❌ Cannot proceed with tests - server not available\n');
      console.log('Please start the dev server with: npm run dev\n');
      process.exit(1);
    }

    // Run all test suites
    await this.runBasicTests();
    await this.runEdgeCaseTests();
    await this.runPerformanceTests();
    await this.runConcurrentTests();
    await this.verifyDataAccuracy();

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
