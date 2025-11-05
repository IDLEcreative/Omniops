#!/usr/bin/env tsx
/**
 * Test Telemetry Cleanup Functionality
 *
 * Tests the cleanup script with old test records to verify:
 * 1. Old records are deleted
 * 2. Recent records are preserved
 * 3. Batch processing works correctly
 * 4. Dry run mode works
 *
 * Usage:
 *   npx tsx scripts/tests/test-telemetry-cleanup.ts
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function insertTestRecords(): Promise<TestResult> {
  const supabase = createServiceRoleClientSync();

  // Insert records with different ages
  const now = new Date();
  const testRecords = [
    {
      query: 'test-order-old-1',
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(), // 95 days old
    },
    {
      query: 'test-order-old-2',
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000).toISOString(), // 91 days old
    },
    {
      query: 'test-order-recent-1',
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
    },
    {
      query: 'test-order-recent-2',
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day old
    },
  ];

  const { data, error } = await supabase
    .from('lookup_failures')
    .insert(testRecords)
    .select();

  if (error) {
    return {
      passed: false,
      message: 'Failed to insert test records',
      details: error,
    };
  }

  return {
    passed: true,
    message: `Inserted ${testRecords.length} test records`,
    details: data,
  };
}

async function verifyRecordExists(query: string): Promise<boolean> {
  const supabase = createServiceRoleClientSync();

  const { data, error } = await supabase
    .from('lookup_failures')
    .select('id')
    .eq('query', query)
    .single();

  return !error && data !== null;
}

async function cleanupTestRecords(): Promise<void> {
  const supabase = createServiceRoleClientSync();

  // Delete all test records
  await supabase
    .from('lookup_failures')
    .delete()
    .like('query', 'test-order-%');

  await supabase
    .from('lookup_failures')
    .delete()
    .like('query', 'batch-test-order-%');

  await supabase
    .from('lookup_failures')
    .delete()
    .eq('query', 'sql-function-test');
}

async function testDryRun(): Promise<TestResult> {
  console.log('\n🧪 Test 1: Dry Run Mode');

  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');

  const result = await cleanupOldTelemetry({
    retentionDays: 90,
    batchSize: 1000,
    dryRun: true,
    verbose: false,
  });

  // In dry run, should report what would be deleted but not actually delete
  const oldRecordStillExists = await verifyRecordExists('test-order-old-1');

  if (!oldRecordStillExists) {
    return {
      passed: false,
      message: 'Dry run deleted records (should not delete)',
      details: result,
    };
  }

  return {
    passed: result.success,
    message: `Dry run successful - reported ${result.deletedCount} records would be deleted`,
    details: result,
  };
}

async function testActualCleanup(): Promise<TestResult> {
  console.log('\n🧪 Test 2: Actual Cleanup');

  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');

  const result = await cleanupOldTelemetry({
    retentionDays: 90,
    batchSize: 10, // Small batch to test batch processing
    dryRun: false,
    verbose: true,
  });

  if (!result.success) {
    return {
      passed: false,
      message: 'Cleanup failed',
      details: result,
    };
  }

  // Verify old records were deleted
  const oldRecord1Exists = await verifyRecordExists('test-order-old-1');
  const oldRecord2Exists = await verifyRecordExists('test-order-old-2');

  // Verify recent records were preserved
  const recentRecord1Exists = await verifyRecordExists('test-order-recent-1');
  const recentRecord2Exists = await verifyRecordExists('test-order-recent-2');

  if (oldRecord1Exists || oldRecord2Exists) {
    return {
      passed: false,
      message: 'Old records were not deleted',
      details: { oldRecord1Exists, oldRecord2Exists },
    };
  }

  if (!recentRecord1Exists || !recentRecord2Exists) {
    return {
      passed: false,
      message: 'Recent records were incorrectly deleted',
      details: { recentRecord1Exists, recentRecord2Exists },
    };
  }

  return {
    passed: true,
    message: 'Cleanup successful - old records deleted, recent records preserved',
    details: result,
  };
}

async function testBatchProcessing(): Promise<TestResult> {
  console.log('\n🧪 Test 3: Batch Processing');

  // Insert 25 old records to test batch processing
  const supabase = createServiceRoleClientSync();
  const now = new Date();
  const batchTestRecords = [];

  for (let i = 0; i < 25; i++) {
    batchTestRecords.push({
      query: `batch-test-order-${i}`,
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const { error: insertError } = await supabase
    .from('lookup_failures')
    .insert(batchTestRecords);

  if (insertError) {
    return {
      passed: false,
      message: 'Failed to insert batch test records',
      details: insertError,
    };
  }

  // Run cleanup with small batch size
  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');

  const result = await cleanupOldTelemetry({
    retentionDays: 90,
    batchSize: 10, // Force multiple batches
    dryRun: false,
    verbose: false,
  });

  if (!result.success) {
    return {
      passed: false,
      message: 'Batch cleanup failed',
      details: result,
    };
  }

  // Verify all batch records were deleted
  const { count } = await supabase
    .from('lookup_failures')
    .select('*', { count: 'exact', head: true })
    .like('query', 'batch-test-order-%');

  if (count && count > 0) {
    return {
      passed: false,
      message: `Batch processing incomplete - ${count} records remaining`,
      details: { count, result },
    };
  }

  return {
    passed: true,
    message: 'Batch processing successful - all records deleted across multiple batches',
    details: result,
  };
}

async function testSQLFunction(): Promise<TestResult> {
  console.log('\n🧪 Test 4: SQL Function');

  const supabase = createServiceRoleClientSync();

  // Insert a test record
  const now = new Date();
  const { error: insertError } = await supabase
    .from('lookup_failures')
    .insert({
      query: 'sql-function-test',
      query_type: 'sku',
      error_type: 'not_found',
      platform: 'woocommerce',
      timestamp: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (insertError) {
    return {
      passed: false,
      message: 'Failed to insert SQL function test record',
      details: insertError,
    };
  }

  // Try to call the SQL function
  const { data, error } = await supabase.rpc('cleanup_old_telemetry', {
    retention_days: 90,
  });

  if (error) {
    return {
      passed: false,
      message: 'SQL function failed (may not be deployed yet)',
      details: error,
    };
  }

  // Verify record was deleted
  const recordExists = await verifyRecordExists('sql-function-test');

  if (recordExists) {
    return {
      passed: false,
      message: 'SQL function did not delete old record',
      details: data,
    };
  }

  return {
    passed: true,
    message: 'SQL function successful',
    details: data,
  };
}

async function main() {
  console.log('🧪 Telemetry Cleanup Test Suite\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results: TestResult[] = [];

  try {
    // Setup: Insert test records
    console.log('\n📝 Setup: Inserting test records...');
    const setupResult = await insertTestRecords();
    console.log(`   ${setupResult.passed ? '✅' : '❌'} ${setupResult.message}`);

    if (!setupResult.passed) {
      console.error('   Setup failed - aborting tests');
      process.exit(1);
    }

    // Test 1: Dry run
    const test1 = await testDryRun();
    results.push(test1);
    console.log(`   ${test1.passed ? '✅' : '❌'} ${test1.message}`);

    // Test 2: Actual cleanup
    const test2 = await testActualCleanup();
    results.push(test2);
    console.log(`   ${test2.passed ? '✅' : '❌'} ${test2.message}`);

    // Test 3: Batch processing
    const test3 = await testBatchProcessing();
    results.push(test3);
    console.log(`   ${test3.passed ? '✅' : '❌'} ${test3.message}`);

    // Test 4: SQL function (may fail if not deployed)
    const test4 = await testSQLFunction();
    results.push(test4);
    console.log(`   ${test4.passed ? '✅' : '❌'} ${test4.message}`);

    // Cleanup test records
    console.log('\n🧹 Cleanup: Removing test records...');
    await cleanupTestRecords();
    console.log('   ✅ Test records cleaned up');

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log(`\nTests Passed: ${passed}/${total}`);

    results.forEach((result, idx) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`  ${icon} Test ${idx + 1}: ${result.message}`);
    });

    if (passed === total) {
      console.log('\n🎉 All tests passed!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed - see details above\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await cleanupTestRecords();
    process.exit(1);
  }
}

main();
