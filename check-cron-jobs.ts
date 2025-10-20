/**
 * Check pg_cron jobs for telemetry rollups
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createServiceRoleClient } from './lib/supabase-server';

async function checkCronJobs() {
  console.log('🕐 Checking pg_cron jobs for telemetry rollups...\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  // Try to query cron.job table directly
  const { data, error } = await supabase.rpc('exec_sql', {
    query: "SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname LIKE '%telemetry%' ORDER BY jobname"
  });

  if (error) {
    // Fallback: try using execute_sql if available
    console.log('⚠️  Direct cron.job query not available (expected)');
    console.log('   pg_cron jobs are typically only visible in Supabase Dashboard\n');

    console.log('📋 Expected cron jobs based on migrations:\n');
    console.log('✓ refresh-chat-telemetry-hourly');
    console.log('  Schedule: */15 * * * * (every 15 minutes)');
    console.log('  Command: SELECT public.refresh_chat_telemetry_rollups(\'hour\')\n');

    console.log('✓ refresh-chat-telemetry-daily');
    console.log('  Schedule: 5 1 * * * (daily at 1:05 AM)');
    console.log('  Command: SELECT public.refresh_chat_telemetry_rollups(\'day\')\n');

    console.log('To verify these jobs exist, check:');
    console.log('Supabase Dashboard → Database → Cron Jobs\n');
  } else {
    console.log('✅ Found cron jobs:\n');
    console.log(data);
  }

  // Verify the refresh function exists
  console.log('🔍 Verifying refresh function exists...\n');

  const { data: funcData, error: funcError } = await supabase
    .rpc('refresh_chat_telemetry_rollups', {
      p_granularity: 'hour',
      p_since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    });

  if (funcError) {
    console.log(`❌ refresh_chat_telemetry_rollups function error: ${funcError.message}`);
  } else {
    console.log(`✅ refresh_chat_telemetry_rollups function executed successfully`);
    console.log(`   Rows processed: ${funcData}\n`);
  }

  console.log('✨ Cron verification complete!\n');
}

checkCronJobs().catch(console.error);
