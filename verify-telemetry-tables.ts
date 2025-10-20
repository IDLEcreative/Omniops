/**
 * Verification script to check if telemetry tables exist in Supabase
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createServiceRoleClient } from './lib/supabase-server';

async function verifyTelemetryTables() {
  console.log('🔍 Verifying Supabase telemetry tables...\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Failed to create Supabase client - check environment variables');
    process.exit(1);
  }

  const tablesToCheck = [
    'chat_telemetry',
    'chat_telemetry_rollups',
    'chat_telemetry_domain_rollups',
    'chat_telemetry_model_rollups'
  ];

  console.log('Checking tables:\n');

  for (const tableName of tablesToCheck) {
    try {
      // Try to query table schema
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${tableName} - DOES NOT EXIST`);
          console.log(`   Error: ${error.message}\n`);
        } else {
          console.log(`⚠️  ${tableName} - EXISTS but error: ${error.message}\n`);
        }
      } else {
        console.log(`✅ ${tableName} - EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ERROR: ${err}\n`);
    }
  }

  // Check for pg_cron jobs
  console.log('\n🕐 Checking pg_cron jobs:\n');

  try {
    const { data: jobs, error } = await supabase.rpc('get_cron_jobs').select('*');

    if (error) {
      console.log('⚠️  Cannot check cron jobs (this is normal if pg_cron is not exposed)');
      console.log(`   Try running: SELECT * FROM cron.job WHERE jobname LIKE '%telemetry%';`);
    } else {
      console.log('✅ Cron jobs query succeeded');
      console.log(jobs);
    }
  } catch (err) {
    // Expected - pg_cron typically not exposed via RPC
    console.log('⚠️  Cannot verify cron jobs programmatically (expected behavior)');
    console.log('   Verify manually via Supabase Dashboard > Database > Cron Jobs');
  }

  // Check for sample data
  console.log('\n📊 Checking for telemetry data:\n');

  const { data: telemetryCount, error: countError } = await supabase
    .from('chat_telemetry')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log(`❌ Could not count telemetry records: ${countError.message}`);
  } else {
    console.log(`✅ chat_telemetry table is queryable`);
  }

  const { data: rollupCount, error: rollupError } = await supabase
    .from('chat_telemetry_rollups')
    .select('*', { count: 'exact', head: true });

  if (rollupError) {
    console.log(`❌ Could not count rollup records: ${rollupError.message}`);
  } else {
    console.log(`✅ chat_telemetry_rollups table is queryable`);
  }

  console.log('\n✨ Verification complete!\n');
}

verifyTelemetryTables().catch(console.error);
