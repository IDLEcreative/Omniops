import { cleanupTestRecords } from './supabase-helpers';
import { insertTestRecords, testActualCleanup, testDryRun } from './scenario-records';
import { testBatchProcessing } from './scenario-batch';
import { testSQLFunction } from './scenario-sql';
import type { TestResult } from './types';

export async function runTelemetryCleanupSuite() {
  console.log('🧪 Telemetry Cleanup Test Suite\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results: TestResult[] = [];

  try {
    console.log('\n📝 Setup: Inserting test records...');
    const setupResult = await insertTestRecords();
    console.log(`   ${setupResult.passed ? '✅' : '❌'} ${setupResult.message}`);

    if (!setupResult.passed) {
      console.error('   Setup failed - aborting tests');
      process.exit(1);
    }

    const tests = [testDryRun, testActualCleanup, testBatchProcessing, testSQLFunction];
    for (const test of tests) {
      const result = await test();
      results.push(result);
      console.log(`   ${result.passed ? '✅' : '❌'} ${result.message}`);
    }

    console.log('\n🧹 Cleanup: Removing test records...');
    await cleanupTestRecords();
    console.log('   ✅ Test records cleaned up');

    printSummary(results);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await cleanupTestRecords();
    process.exit(1);
  }
}

function printSummary(results: TestResult[]) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const passed = results.filter(result => result.passed).length;
  console.log(`\nTests Passed: ${passed}/${results.length}`);

  results.forEach((result, idx) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} Test ${idx + 1}: ${result.message}`);
  });

  if (passed === results.length) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed - see details above\n');
    process.exit(1);
  }
}
