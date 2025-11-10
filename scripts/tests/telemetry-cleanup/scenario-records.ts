import { getSupabaseClient, verifyRecordExists } from './supabase-helpers';
import type { TestResult } from './types';

export async function insertTestRecords(): Promise<TestResult> {
  const supabase = getSupabaseClient();
  const now = Date.now();

  const testRecords = [
    { query: 'test-order-old-1', age: 95 },
    { query: 'test-order-old-2', age: 91 },
    { query: 'test-order-recent-1', age: 30 },
    { query: 'test-order-recent-2', age: 1 }
  ].map(record => ({
    query: record.query,
    query_type: 'sku',
    error_type: 'not_found',
    platform: 'woocommerce',
    timestamp: new Date(now - record.age * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { data, error } = await supabase.from('lookup_failures').insert(testRecords).select();
  if (error) {
    return { passed: false, message: 'Failed to insert test records', details: error };
  }

  return { passed: true, message: `Inserted ${testRecords.length} test records`, details: data };
}

export async function testDryRun(): Promise<TestResult> {
  console.log('\n🧪 Test 1: Dry Run Mode');
  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');

  const result = await cleanupOldTelemetry({ retentionDays: 90, batchSize: 1000, dryRun: true, verbose: false });
  const oldRecordStillExists = await verifyRecordExists('test-order-old-1');

  if (!oldRecordStillExists) {
    return { passed: false, message: 'Dry run deleted records (should not delete)', details: result };
  }

  return { passed: result.success, message: `Dry run successful - reported ${result.deletedCount} records would be deleted`, details: result };
}

export async function testActualCleanup(): Promise<TestResult> {
  console.log('\n🧪 Test 2: Actual Cleanup');
  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');

  const result = await cleanupOldTelemetry({ retentionDays: 90, batchSize: 10, dryRun: false, verbose: true });
  if (!result.success) {
    return { passed: false, message: 'Cleanup failed', details: result };
  }

  const oldRecordsExist = await Promise.all([
    verifyRecordExists('test-order-old-1'),
    verifyRecordExists('test-order-old-2')
  ]);

  if (oldRecordsExist.some(Boolean)) {
    return { passed: false, message: 'Old records were not deleted', details: oldRecordsExist };
  }

  const recentRecordsExist = await Promise.all([
    verifyRecordExists('test-order-recent-1'),
    verifyRecordExists('test-order-recent-2')
  ]);

  if (recentRecordsExist.some(exists => !exists)) {
    return { passed: false, message: 'Recent records were incorrectly deleted', details: recentRecordsExist };
  }

  return { passed: true, message: 'Cleanup successful - old records deleted, recent records preserved', details: result };
}
