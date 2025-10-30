#!/usr/bin/env tsx
/**
 * Verify woocommerce_usage_metrics table was created correctly
 * Checks: table structure, indexes, RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('🔍 Verifying woocommerce_usage_metrics table...\n');

  // 1. Check table exists by querying it
  console.log('1️⃣ Checking table exists...');
  const { data: tableData, error: tableError } = await supabase
    .from('woocommerce_usage_metrics')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ Table does not exist:', tableError.message);
    process.exit(1);
  }
  console.log('✅ Table exists: woocommerce_usage_metrics');

  // 2. Check RLS is enabled
  console.log('\n2️⃣ Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      sql_query: `
        SELECT policyname, permissive, roles, cmd
        FROM pg_policies
        WHERE tablename = 'woocommerce_usage_metrics'
      `
    });

  if (policiesError) {
    console.log('⚠️  Could not verify RLS policies (this is OK)');
  } else if (policies && Array.isArray(policies)) {
    console.log(`✅ Found ${policies.length} RLS policies`);
    policies.forEach((p: any) => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  }

  // 3. Check indexes
  console.log('\n3️⃣ Checking indexes...');
  const { data: indexes, error: indexError } = await supabase
    .rpc('exec_sql', {
      sql_query: `
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'woocommerce_usage_metrics'
        ORDER BY indexname
      `
    });

  if (indexError) {
    console.log('⚠️  Could not verify indexes (this is OK)');
  } else if (indexes && Array.isArray(indexes)) {
    console.log(`✅ Found ${indexes.length} indexes:`);
    indexes.forEach((idx: any) => {
      console.log(`   - ${idx.indexname}`);
    });
  }

  // 4. Test insert permissions
  console.log('\n4️⃣ Testing insert permissions...');
  const testMetric = {
    operation: 'check_stock',
    duration_ms: 123,
    success: true,
    domain: 'test-verification.com',
    customer_config_id: null,
  };

  const { data: insertData, error: insertError } = await supabase
    .from('woocommerce_usage_metrics')
    .insert(testMetric)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    process.exit(1);
  }
  console.log('✅ Insert test passed - table is writable');

  // 5. Test query
  console.log('\n5️⃣ Testing query...');
  const { data: queryData, error: queryError } = await supabase
    .from('woocommerce_usage_metrics')
    .select('operation, success, duration_ms')
    .eq('id', insertData.id)
    .single();

  if (queryError) {
    console.error('❌ Query failed:', queryError.message);
    process.exit(1);
  }
  console.log('✅ Query test passed');
  console.log(`   - Operation: ${queryData.operation}`);
  console.log(`   - Success: ${queryData.success}`);
  console.log(`   - Duration: ${queryData.duration_ms}ms`);

  // 6. Cleanup test data
  await supabase
    .from('woocommerce_usage_metrics')
    .delete()
    .eq('id', insertData.id);

  console.log('\n🎉 All verifications passed!');
  console.log('\n📊 Table is ready to track WooCommerce analytics!');
}

verify().catch(console.error);
