/**
 * Force-apply refresh function by dropping and recreating
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { getSupabaseConfig } from '../supabase-config.js';

config({ path: '.env.local' });

// Get Supabase configuration from environment variables
const supabaseConfig = getSupabaseConfig();
const { projectRef, managementToken } = supabaseConfig;

async function executeSQL(sql: string): Promise<any> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  return result;
}

async function main() {
  console.log('🗑️  Step 1: Dropping old function...\n');

  try {
    await executeSQL('DROP FUNCTION IF EXISTS public.refresh_chat_telemetry_rollups(TEXT, TIMESTAMPTZ) CASCADE;');
    console.log('✅ Old function dropped\n');
  } catch (error: any) {
    console.log(`⚠️  Drop warning: ${error.message}\n`);
  }

  console.log('🔧 Step 2: Creating new function with WITH clauses intact...\n');

  const functionSql = readFileSync('apply-rollup-function.sql', 'utf-8');

  try {
    await executeSQL(functionSql);
    console.log('✅ Function created with complete SQL!\n');
  } catch (error: any) {
    console.log(`❌ Function creation error: ${error.message}\n`);
    console.log('This is critical - the function must be created for rollups to work.\n');
    return;
  }

  console.log('🧪 Step 3: Testing function by calling it...\n');

  try {
    const testResult = await executeSQL(
      `SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '1 day');`
    );
    const rows = testResult?.[0]?.refresh_chat_telemetry_rollups ?? '?';
    console.log(`✅ Test successful! Processed ${rows} buckets\n`);
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}\n`);
    console.log('The function still has errors. Checking the actual function definition...\n');

    // Query the function definition
    try {
      const funcDef = await executeSQL(
        `SELECT pg_get_functiondef('public.refresh_chat_telemetry_rollups'::regproc);`
      );
      console.log('Current function definition:\n');
      console.log(funcDef[0]?.pg_get_functiondef?.substring(0, 500) + '...\n');
    } catch (e: any) {
      console.log(`Could not retrieve function definition: ${e.message}\n`);
    }
    return;
  }

  console.log('📊 Step 4: Populating all rollups...\n');

  console.log('   Hourly rollups (14 days)...');
  const hourly = await executeSQL(
    `SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '14 days');`
  );
  console.log(`   ✅ ${hourly[0]?.refresh_chat_telemetry_rollups} buckets\n`);

  console.log('   Daily rollups (90 days)...');
  const daily = await executeSQL(
    `SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '90 days');`
  );
  console.log(`   ✅ ${daily[0]?.refresh_chat_telemetry_rollups} buckets\n`);

  console.log('✅ Step 5: Final verification...\n');

  const counts = await Promise.all([
    executeSQL('SELECT COUNT(*) FROM chat_telemetry_rollups;'),
    executeSQL('SELECT COUNT(*) FROM chat_telemetry_domain_rollups;'),
    executeSQL('SELECT COUNT(*) FROM chat_telemetry_model_rollups;'),
  ]);

  console.log('📈 Final Rollup Counts:');
  console.log(`   chat_telemetry_rollups: ${counts[0][0]?.count}`);
  console.log(`   chat_telemetry_domain_rollups: ${counts[1][0]?.count}`);
  console.log(`   chat_telemetry_model_rollups: ${counts[2][0]?.count}\n`);

  console.log('✨ COMPLETE! Telemetry dashboard is now fully optimized!');
}

main().catch(console.error);
