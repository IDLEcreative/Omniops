import { API_URL, TEST_DOMAIN } from './config';
import { nullInjectionScenarios } from './scenarios';
import { sendChatRequest } from './request';
import type { NullInjectionTest, TestResult } from './types';

async function runNullInjectionTest(test: NullInjectionTest): Promise<TestResult> {
  console.log(`\n[TEST] ${test.name}`);
  console.log(`       ${test.description}`);
  console.log(`       Query: "${test.query}"`);

  const startTime = performance.now();

  try {
    const result = await sendChatRequest(test);
    const duration = performance.now() - startTime;
    const validation = test.validateResponse(result.response);

    console.log(`       Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`       Status Code: ${result.status}`);
    console.log(`       Type Error Detected: ${result.hasTypeError ? 'YES' : 'NO'}`);
    console.log(`       Graceful Handling: ${validation.gracefulHandling ? 'YES' : 'NO'}`);
    console.log(`       Reason: ${validation.reason}`);

    return {
      scenario: test.name,
      status: validation.passed ? 'pass' : 'fail',
      hadTypeError: result.hasTypeError,
      gracefulHandling: validation.gracefulHandling,
      details: {
        injectionPoint: test.injectionPoint,
        status: result.status,
        duration: result.duration,
        hasTypeError: validation.hasTypeError,
        validationDuration: duration
      }
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    console.log(`       Duration: ${duration.toFixed(2)}ms`);
    console.log(`       Status: ERROR - ${error instanceof Error ? error.message : 'Unknown'}`);

    return {
      scenario: test.name,
      status: 'fail',
      hadTypeError: true,
      gracefulHandling: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        injectionPoint: test.injectionPoint
      }
    };
  }
}

function printDetailedResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(70));

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`\n${icon} ${result.scenario}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Had TypeError: ${result.hadTypeError ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`   Graceful Handling: ${result.gracefulHandling ? 'YES ✓' : 'NO'}`);

    if (result.details.duration) {
      console.log(`   Duration: ${result.details.duration.toFixed(2)}ms`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const typeErrors = results.filter(r => r.hadTypeError).length;
  const graceful = results.filter(r => r.gracefulHandling).length;

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  console.log(`\n⚠️  TypeErrors Detected: ${typeErrors}/${results.length}`);
  if (typeErrors > 0) {
    console.log('   The following scenarios threw TypeErrors:');
    for (const result of results.filter(r => r.hadTypeError)) {
      console.log(`   ❌ ${result.scenario}`);
    }
  }

  console.log(`\n✓ Graceful Handling: ${graceful}/${results.length}`);
  for (const result of results.filter(r => r.gracefulHandling)) {
    console.log(`  ✓ ${result.scenario}`);
  }

  const success = failed === 0 && typeErrors === 0;
  console.log(`\n${success ? '✅ ALL TESTS PASSED' : '❌ CRITICAL ISSUES FOUND'}`);
  console.log('='.repeat(70) + '\n');

  process.exitCode = success ? 0 : 1;
}

export async function runNullDataInjectionSuite() {
  console.log('\n' + '='.repeat(70));
  console.log('ERROR INJECTION TESTS: Null/Undefined Data Injection');
  console.log('='.repeat(70));

  console.log('\nTest Environment:');
  console.log(`  Domain: ${TEST_DOMAIN}`);
  console.log(`  API Endpoint: ${API_URL}`);

  const results: TestResult[] = [];

  for (const test of nullInjectionScenarios) {
    const result = await runNullInjectionTest(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  printDetailedResults(results);
  printSummary(results);
}
