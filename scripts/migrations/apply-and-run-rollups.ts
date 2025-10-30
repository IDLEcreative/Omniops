/**
 * Apply the refresh function and populate rollups
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyAndRunRollups() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });

  console.log('🔧 Step 1: Applying refresh function to Supabase...\n');

  // Read the SQL file
  const functionSql = readFileSync('apply-rollup-function.sql', 'utf-8');

  // Execute the function creation
  const { error: createError } = await supabase.rpc('exec_sql', {
    query: functionSql
  });

  if (createError && !createError.message.includes('already exists')) {
    console.log(`❌ Error creating function: ${createError.message}\n`);

    // Try direct execution via raw SQL
    console.log('   Attempting direct SQL execution...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: functionSql })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`   Direct execution also failed: ${text}\n`);
      console.log('⚠️  Function creation failed. Trying to run anyway in case it already exists...\n');
    } else {
      console.log('   ✅ Function created via direct SQL\n');
    }
  } else {
    console.log('✅ Function created successfully\n');
  }

  // Step 2: Run hourly rollups
  console.log('📊 Step 2: Populating hourly rollups (past 14 days)...\n');

  const { data: hourlyData, error: hourlyError } = await supabase.rpc(
    'refresh_chat_telemetry_rollups',
    {
      p_granularity: 'hour',
      p_since: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  if (hourlyError) {
    console.log(`❌ Hourly rollup error: ${hourlyError.message}\n`);
  } else {
    console.log(`✅ Hourly rollups completed: ${hourlyData} buckets processed\n`);
  }

  // Step 3: Run daily rollups
  console.log('📊 Step 3: Populating daily rollups (past 90 days)...\n');

  const { data: dailyData, error: dailyError } = await supabase.rpc(
    'refresh_chat_telemetry_rollups',
    {
      p_granularity: 'day',
      p_since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  );

  if (dailyError) {
    console.log(`❌ Daily rollup error: ${dailyError.message}\n`);
  } else {
    console.log(`✅ Daily rollups completed: ${dailyData} buckets processed\n`);
  }

  // Step 4: Verify rollup counts
  console.log('✅ Step 4: Verifying rollup data...\n');

  const { count: rollupCount } = await supabase
    .from('chat_telemetry_rollups')
    .select('*', { count: 'exact', head: true });

  const { count: domainRollupCount } = await supabase
    .from('chat_telemetry_domain_rollups')
    .select('*', { count: 'exact', head: true });

  const { count: modelRollupCount } = await supabase
    .from('chat_telemetry_model_rollups')
    .select('*', { count: 'exact', head: true });

  console.log('📈 Rollup Summary:');
  console.log(`   chat_telemetry_rollups: ${rollupCount ?? 0} records`);
  console.log(`   chat_telemetry_domain_rollups: ${domainRollupCount ?? 0} records`);
  console.log(`   chat_telemetry_model_rollups: ${modelRollupCount ?? 0} records\n`);

  if (rollupCount && rollupCount > 0) {
    console.log('✨ SUCCESS! Rollup tables are now populated.');
    console.log('   Your telemetry dashboard is now fully optimized!\n');
  } else {
    console.log('⚠️  Rollup tables are still empty. Check errors above.\n');
  }
}

applyAndRunRollups().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
