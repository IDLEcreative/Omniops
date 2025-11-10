import { getSupabaseClient } from './supabase-helpers';
import type { TestResult } from './types';

export async function testBatchProcessing(): Promise<TestResult> {
  console.log('\n🧪 Test 3: Batch Processing');

  const supabase = getSupabaseClient();
  const now = Date.now();
  const records = Array.from({ length: 25 }, (_, i) => ({
    query: `batch-test-order-${i}`,
    query_type: 'sku',
    error_type: 'not_found',
    platform: 'woocommerce',
    timestamp: new Date(now - 95 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error: insertError } = await supabase.from('lookup_failures').insert(records);
  if (insertError) {
    return { passed: false, message: 'Failed to insert batch test records', details: insertError };
  }

  const { cleanupOldTelemetry } = await import('@/scripts/maintenance/cleanup-old-telemetry');
  const result = await cleanupOldTelemetry({ retentionDays: 90, batchSize: 10, dryRun: false, verbose: false });

  if (!result.success) {
    return { passed: false, message: 'Batch cleanup failed', details: result };
  }

  const { count } = await supabase
    .from('lookup_failures')
    .select('*', { count: 'exact', head: true })
    .like('query', 'batch-test-order-%');

  if (count && count > 0) {
    return { passed: false, message: `Batch processing incomplete - ${count} records remaining`, details: { count, result } };
  }

  return { passed: true, message: 'Batch processing successful - all records deleted across multiple batches', details: result };
}
