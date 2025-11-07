/**
 * Test runner utilities for analytics security tests
 */

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

export function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logResult(result: TestResult) {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? 'green' : 'red';
  log(`${icon} ${result.name} (${result.duration}ms)`, color);
  if (!result.passed) {
    log(`  ${result.message}`, 'red');
  }
}

export async function runTest(
  name: string,
  testFn: () => Promise<boolean | { passed: boolean; message: string }>,
  results: TestResult[]
): Promise<void> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;

    if (typeof result === 'boolean') {
      results.push({
        name,
        passed: result,
        message: result ? 'Passed' : 'Failed',
        duration
      });
    } else {
      results.push({
        name,
        passed: result.passed,
        message: result.message,
        duration
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration
    });
  }
}

export function printSummary(results: TestResult[]) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  log('\n' + '='.repeat(60), 'blue');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`, 'bold');
  log(`Total Duration: ${totalDuration}ms`, 'blue');
  log('='.repeat(60), 'blue');

  if (failed > 0) {
    process.exit(1);
  }
}
