import { getSupabaseClient, verifyRecordExists } from './supabase-helpers';
import type { TestResult } from './types';

export async function testSQLFunction(): Promise<TestResult> {
  console.log('\n🧪 Test 4: SQL Function');

  const supabase = getSupabaseClient();
  const now = Date.now();

  const { error: insertError } = await supabase.from('lookup_failures').insert({
    query: 'sql-function-test',
    query_type: 'sku',
    error_type: 'not_found',
    platform: 'woocommerce',
    timestamp: new Date(now - 95 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (insertError) {
    return { passed: false, message: 'Failed to insert SQL function test record', details: insertError };
  }

  const { data, error } = await supabase.rpc('cleanup_old_telemetry', { retention_days: 90 });
  if (error) {
    return { passed: false, message: 'SQL function failed (may not be deployed yet)', details: error };
  }

  const recordExists = await verifyRecordExists('sql-function-test');
  if (recordExists) {
    return { passed: false, message: 'SQL function did not delete old record', details: data };
  }

  return { passed: true, message: 'SQL function successful', details: data };
}
