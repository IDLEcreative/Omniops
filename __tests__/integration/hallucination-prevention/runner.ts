import { sendQuery } from './client';
import { testCases } from './test-cases';
import { RunOptions, TestCase, TestResult } from './types';

const RESPONSE_SEPARATOR = '─'.repeat(70);

export async function runHallucinationTests(options: RunOptions) {
  console.log(`\nStarting hallucination prevention tests for domain: ${options.domain}\n`);

  const testsToRun = resolveTests(options.category);
  const results: TestResult[] = [];

  for (const [index, testCase] of testsToRun.entries()) {
    console.log(`Running test ${index + 1}/${testsToRun.length}: ${testCase.name}`);
    console.log(`Category: ${testCase.category}`);
    console.log(`Query: ${testCase.query}\n`);

    const { response, duration } = await sendQuery(testCase.query, options.domain);
    logResponse(response, options.verbose);

    const verdict = testCase.checkForHallucination(response);
    logVerdict(verdict, duration);

    results.push({
      testCase,
      response,
      passed: verdict.passed,
      reason: verdict.reason,
      hallucinationDetected: verdict.hallucinationDetected || false,
      duration,
    });

    console.log(RESPONSE_SEPARATOR);

    const isLastTest = index === testsToRun.length - 1;
    if (!isLastTest) {
      await pause(500);
    }
  }

  printSummary(results);
}

function resolveTests(category?: string): TestCase[] {
  if (!category) {
    return testCases;
  }

  const filtered = testCases.filter((test) => test.category === category);

  if (filtered.length === 0) {
    console.warn(`⚠️  No tests found for category "${category}", running all tests instead.`);
    return testCases;
  }

  return filtered;
}

function logResponse(response: string, verbose: boolean) {
  if (verbose) {
    console.log('\nFull response:');
    console.log(RESPONSE_SEPARATOR);
    console.log(response);
    console.log(RESPONSE_SEPARATOR);
    return;
  }

  console.log('\nResponse preview:');
  const preview = response.substring(0, 200);
  console.log(preview + (response.length > 200 ? '...' : ''));
}

function logVerdict(
  verdict: { passed: boolean; reason: string; hallucinationDetected?: boolean },
  duration: number
) {
  console.log(`\nDuration: ${duration}ms`);
  if (verdict.passed) {
    console.log(`✅ PASSED: ${verdict.reason}`);
    return;
  }

  console.log(`❌ FAILED: ${verdict.reason}`);
  if (verdict.hallucinationDetected) {
    console.log('⚠️  HALLUCINATION DETECTED!');
  }
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY\n');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const hallucinations = results.filter((r) => r.hallucinationDetected).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`Total Tests:              ${total}`);
  console.log(`Passed:                   ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed:                   ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`Hallucinations Detected:  ${hallucinations}`);
  console.log(`Average Response Time:    ${avgDuration.toFixed(0)}ms`);

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.testCase.name}: ${r.reason}`);
      });
  }

  if (hallucinations > 0) {
    console.log('\n❌ WARNING: The AI is still hallucinating in some cases!');
    console.log('Review the failed tests above to identify patterns.');
    console.log('Consider updating system prompts in app/api/chat/route.ts');
  } else if (failed === 0) {
    console.log('\n🎉 SUCCESS: All hallucination prevention tests passed!');
    console.log('The AI is correctly admitting uncertainty when information is missing.');
  } else {
    console.log('\n⚠️  Some tests failed but no hallucinations detected.');
    console.log('Review failed tests for other issues.');
  }

  console.log('\n' + '='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}
