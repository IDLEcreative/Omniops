/**
 * Verify Telemetry Test Data
 *
 * Quick verification of inserted test data
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

async function main() {
  const supabase = createServiceRoleClientSync();

  console.log('🔍 Verifying telemetry test data...\n');

  // Get all records from last 7 days
  const { data, error } = await supabase
    .from('lookup_failures')
    .select('error_type, query_type, platform')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  // Count by error type
  const errorCounts: Record<string, number> = {};
  const queryTypeCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};

  data?.forEach(row => {
    errorCounts[row.error_type] = (errorCounts[row.error_type] || 0) + 1;
    queryTypeCounts[row.query_type] = (queryTypeCounts[row.query_type] || 0) + 1;
    platformCounts[row.platform] = (platformCounts[row.platform] || 0) + 1;
  });

  console.log('📊 Test Data Summary:');
  console.log(`Total records: ${data?.length || 0}\n`);

  console.log('Error Types:');
  Object.entries(errorCounts).forEach(([type, count]) => {
    const pct = ((count / (data?.length || 1)) * 100).toFixed(1);
    console.log(`  ${type}: ${count} (${pct}%)`);
  });

  console.log('\nQuery Types:');
  Object.entries(queryTypeCounts).forEach(([type, count]) => {
    const pct = ((count / (data?.length || 1)) * 100).toFixed(1);
    console.log(`  ${type}: ${count} (${pct}%)`);
  });

  console.log('\nPlatforms:');
  Object.entries(platformCounts).forEach(([platform, count]) => {
    const pct = ((count / (data?.length || 1)) * 100).toFixed(1);
    console.log(`  ${platform}: ${count} (${pct}%)`);
  });

  console.log('\n✅ Verification complete!');
}

main().catch(console.error);
