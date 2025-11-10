import { sendQuery } from './send-query';
import { testCases } from './test-cases';

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  hallucinations: number;
}

export async function runHallucinationTests(delayMs = 500): Promise<TestSummary> {
  console.log('🧪 Comprehensive Hallucination Prevention Test Suite\n');
  console.log('='.repeat(70));

  const summary: TestSummary = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    hallucinations: 0,
  };

  for (const [index, test] of testCases.entries()) {
    console.log(`\n📝 Test ${index + 1}/${testCases.length}: ${test.name}`);
    console.log(`Query: "${test.query}"`);

    const response = await sendQuery(test.query);
    if (!response) {
      console.log('❌ Failed to get response');
      summary.failed += 1;
      continue;
    }

    console.log('\nResponse preview:');
    console.log(response.substring(0, 200) + (response.length > 200 ? '...' : '') + '\n');

    const verdict = test.checkForHallucination(response);
    if (verdict.passed) {
      console.log(`✅ PASSED: ${verdict.reason}`);
      summary.passed += 1;
    } else {
      console.log(`❌ FAILED: ${verdict.reason}`);
      summary.failed += 1;
      if (verdict.hallucinationDetected) {
        summary.hallucinations += 1;
        console.log('⚠️  HALLUCINATION DETECTED!');
      }
    }

    console.log('-'.repeat(70));
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  logSummary(summary);
  return summary;
}

function logSummary(summary: TestSummary) {
  const { total, passed, failed, hallucinations } = summary;
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`Hallucinations Detected: ${hallucinations}`);

  if (hallucinations > 0) {
    console.log('\n⚠️  WARNING: The AI is still hallucinating in some cases!');
    console.log('Review the failed tests above to identify patterns.');
  } else if (failed === 0) {
    console.log('\n🎉 SUCCESS: All hallucination prevention tests passed!');
  }

  console.log('\n' + '='.repeat(70));
}
