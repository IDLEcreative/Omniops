import { v4 as uuidv4 } from 'uuid';
import { API_URL, TEST_DOMAIN, REDIS_TIMEOUT_MS } from './config';
import { redisFailureScenarios } from './scenarios';
import { sendChatRequest } from './request';
import { startRedisContainer } from './redis-helpers';
import type { RedisFailureTest, TestResult } from './types';

async function runRedisFailureTest(test: RedisFailureTest): Promise<TestResult> {
  console.log(`\n[TEST] ${test.name}`);
  console.log(`       ${test.description}`);

  try {
    await test.injectFailure();
    await new Promise(resolve => setTimeout(resolve, 500));

    const responses: Array<Awaited<ReturnType<typeof sendChatRequest>>> = [];
    let successCount = 0;
    let rateLimitedCount = 0;

    for (let i = 0; i < 3; i++) {
      const result = await sendChatRequest(test.name, uuidv4());
      responses.push(result);

      if (result.statusCode === 429) {
        rateLimitedCount++;
      } else if (result.statusCode === 200 || result.statusCode === 0) {
        successCount++;
      }

      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const validation = test.validateBehavior(responses[0].response);

    console.log(`       Responses Received: ${responses.length}`);
    console.log(`       Success: ${successCount}, Rate Limited: ${rateLimitedCount}`);
    console.log(`       Fail-Open Behavior: ${validation.failOpenBehavior ? 'YES' : 'NO'}`);
    console.log(`       Status: ${validation.reason}`);

    return {
      scenario: test.name,
      status: validation.passed ? 'pass' : 'fail',
      failOpenActivated: validation.failOpenBehavior,
      requestsAllowed: successCount,
      details: {
        failureType: test.failureType,
        totalRequests: responses.length,
        successCount,
        rateLimitedCount,
        avgDuration: responses.reduce((sum, r) => sum + r.duration, 0) / responses.length
      }
    };
  } catch (error) {
    console.log(`       Status: ERROR - ${error instanceof Error ? error.message : 'Unknown'}`);

    return {
      scenario: test.name,
      status: 'fail',
      failOpenActivated: false,
      requestsAllowed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        failureType: test.failureType
      }
    };
  }
}

export async function runRedisFallbackTests() {
  console.log('\n' + '='.repeat(70));
  console.log('ERROR INJECTION TESTS: Redis Fallback Mechanisms');
  console.log('='.repeat(70));

  console.log('\nTest Environment:');
  console.log(`  Domain: ${TEST_DOMAIN}`);
  console.log(`  API Endpoint: ${API_URL}`);
  console.log(`  Redis Timeout Threshold: ${REDIS_TIMEOUT_MS}ms`);

  const results: TestResult[] = [];

  for (const test of redisFailureScenarios) {
    const result = await runRedisFailureTest(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n[INFO] Attempting to restore Redis...');
  await startRedisContainer();

  printDetailedResults(results);
  printSummary(results);
}

function printDetailedResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(70));

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`\n${icon} ${result.scenario}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Fail-Open Activated: ${result.failOpenActivated}`);
    console.log(`   Requests Allowed: ${result.requestsAllowed}`);

    if (result.details.avgDuration) {
      console.log(`   Avg Duration: ${result.details.avgDuration.toFixed(2)}ms`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  const failOpenResults = results.filter(r => r.failOpenActivated);
  console.log(`\n🔄 Fail-Open Behavior Activated: ${failOpenResults.length}/${results.length}`);
  failOpenResults.forEach(result => console.log(`   ✓ ${result.scenario}`));

  const totalAllowed = results.reduce((sum, r) => sum + r.requestsAllowed, 0);
  console.log(`\n📨 Total Requests Allowed: ${totalAllowed}`);

  const success = failed === 0 && failOpenResults.length === results.length;
  console.log(`\n${success ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
  console.log('='.repeat(70) + '\n');

  process.exitCode = success ? 0 : 1;
}
