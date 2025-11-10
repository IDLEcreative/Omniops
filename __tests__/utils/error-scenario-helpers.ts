/**
 * Shared utilities for error scenario testing
 */

export const TEST_CONFIG = {
  apiBase: process.env.API_BASE || 'http://localhost:3000',
  timeoutMs: 5000,
  retries: 3,
};

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'partial';
  details: string;
  errorType?: string;
  statusCode?: number;
}

export interface TestReport {
  category: string;
  timestamp: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    partial: number;
  };
}

export class ErrorScenarioTester {
  protected results: TestResult[] = [];

  protected async testCase(
    name: string,
    testFn: () => Promise<string>
  ): Promise<void> {
    try {
      const details = await testFn();
      const status = details.startsWith('PARTIAL:') ? 'partial' : 'pass';

      this.results.push({
        name,
        status,
        details,
      });

      console.log(`  ✅ PASS: ${name}`);
      console.log(`     → ${details}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        name,
        status: 'fail',
        details: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      console.log(`  ❌ FAIL: ${name}`);
      console.log(`     → ${errorMessage}`);
    }
  }

  protected generateReport(category: string): TestReport {
    const categoryResults = this.results;
    this.results = [];

    const summary = {
      total: categoryResults.length,
      passed: categoryResults.filter(r => r.status === 'pass').length,
      failed: categoryResults.filter(r => r.status === 'fail').length,
      partial: categoryResults.filter(r => r.status === 'partial').length,
    };

    return {
      category,
      timestamp: new Date().toISOString(),
      results: categoryResults,
      summary,
    };
  }

  public printReport(report: TestReport): void {
    console.log(`\n${report.category}`);
    console.log('─'.repeat(50));
    console.log(`Total: ${report.summary.total} | ✅ ${report.summary.passed} | ❌ ${report.summary.failed} | ⚠️  ${report.summary.partial}`);

    const failures = report.results.filter(r => r.status === 'fail');
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach(f => {
        console.log(`  - ${f.name}`);
        console.log(`    ${f.details}`);
      });
    }
  }
}
