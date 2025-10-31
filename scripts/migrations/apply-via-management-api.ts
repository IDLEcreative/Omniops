/**
 * Apply refresh function and populate rollups using Supabase Management API
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
    throw new Error(`API Error: ${JSON.stringify(result)}`);
  }

  return result;
}

async function main() {
  console.log('🔧 Step 1: Applying refresh function via Supabase Management API...\n');

  // Read the function SQL
  const functionSql = readFileSync('apply-rollup-function.sql', 'utf-8');

  try {
    await executeSQL(functionSql);
    console.log('✅ Function created successfully!\n');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✅ Function already exists (this is fine)\n');
    } else {
      console.log(`⚠️  Function creation warning: ${error.message}\n`);
      console.log('   Continuing anyway - function may already exist...\n');
    }
  }

  console.log('📊 Step 2: Populating hourly rollups (past 14 days)...\n');

  try {
    const hourlyResult = await executeSQL(
      `SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '14 days');`
    );
    const rowsAffected = hourlyResult?.[0]?.refresh_chat_telemetry_rollups ?? '?';
    console.log(`✅ Hourly rollups completed: ${rowsAffected} buckets processed\n`);
  } catch (error: any) {
    console.log(`❌ Hourly rollup error: ${error.message}\n`);
  }

  console.log('📊 Step 3: Populating daily rollups (past 90 days)...\n');

  try {
    const dailyResult = await executeSQL(
      `SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '90 days');`
    );
    const rowsAffected = dailyResult?.[0]?.refresh_chat_telemetry_rollups ?? '?';
    console.log(`✅ Daily rollups completed: ${rowsAffected} buckets processed\n`);
  } catch (error: any) {
    console.log(`❌ Daily rollup error: ${error.message}\n`);
  }

  console.log('✅ Step 4: Verifying rollup counts...\n');

  const rollupCount = await executeSQL('SELECT COUNT(*) FROM chat_telemetry_rollups;');
  const domainCount = await executeSQL('SELECT COUNT(*) FROM chat_telemetry_domain_rollups;');
  const modelCount = await executeSQL('SELECT COUNT(*) FROM chat_telemetry_model_rollups;');

  console.log('📈 Rollup Summary:');
  console.log(`   chat_telemetry_rollups: ${rollupCount[0]?.count ?? 0} records`);
  console.log(`   chat_telemetry_domain_rollups: ${domainCount[0]?.count ?? 0} records`);
  console.log(`   chat_telemetry_model_rollups: ${modelCount[0]?.count ?? 0} records\n`);

  if (parseInt(rollupCount[0]?.count ?? '0') > 0) {
    console.log('✨ SUCCESS! Rollup tables are now populated!');
    console.log('   Your telemetry dashboard is fully optimized.\n');
    console.log('🎯 Next step: Visit /dashboard/telemetry to see the optimized dashboard!');
  } else {
    console.log('⚠️  Rollup tables are still empty. Check errors above.');
  }
}

main().catch(console.error);
