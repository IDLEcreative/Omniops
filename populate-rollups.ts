import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function populate() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  console.log('🔄 Populating rollup tables from historical telemetry data...\n');

  // Run hourly rollups for the past 14 days
  console.log('📊 Running hourly rollups (past 14 days)...');
  const hourlyResult = await supabase.rpc('refresh_chat_telemetry_rollups', {
    p_granularity: 'hour',
    p_since: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (hourlyResult.error) {
    console.log(`❌ Hourly rollup error: ${hourlyResult.error.message}`);
  } else {
    console.log(`✅ Hourly rollups completed: ${hourlyResult.data} rows affected\n`);
  }

  // Run daily rollups for the past 90 days
  console.log('📊 Running daily rollups (past 90 days)...');
  const dailyResult = await supabase.rpc('refresh_chat_telemetry_rollups', {
    p_granularity: 'day',
    p_since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (dailyResult.error) {
    console.log(`❌ Daily rollup error: ${dailyResult.error.message}`);
  } else {
    console.log(`✅ Daily rollups completed: ${dailyResult.data} rows affected\n`);
  }

  // Verify rollup count
  const { count } = await supabase.from('chat_telemetry_rollups').select('*', { count: 'exact', head: true });
  console.log(`📈 Total rollup records now: ${count}`);

  console.log('\n✨ Rollup population complete!');
}

populate().catch(console.error);
