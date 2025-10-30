#!/usr/bin/env tsx
/**
 * Test WooCommerce analytics tracking
 * 1. Checks current metrics count
 * 2. Triggers a WooCommerce operation via the tool
 * 3. Verifies new metric was recorded
 */

import { createClient } from '@supabase/supabase-js';
import { executeWooCommerceOperation } from '@/lib/chat/woocommerce-tool';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log('🧪 Testing WooCommerce Analytics Tracking\n');

  // 1. Get current metrics count
  console.log('1️⃣ Checking current metrics...');
  const { count: beforeCount } = await supabase
    .from('woocommerce_usage_metrics')
    .select('*', { count: 'exact', head: true });

  console.log(`   Current metrics count: ${beforeCount || 0}`);

  // 2. Execute a WooCommerce operation
  console.log('\n2️⃣ Executing test operation (search_products)...');
  const testDomain = 'thompsonseparts.co.uk'; // From handover doc

  try {
    const result = await executeWooCommerceOperation(
      'search_products',
      { search: 'test', per_page: 5 },
      testDomain
    );
    console.log(`   Operation result: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.message) {
      console.log(`   Message: ${result.message.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Operation failed (expected if no WooCommerce config): ${error.message}`);
    console.log('   This is OK - we just want to verify tracking works!');
  }

  // 3. Wait a moment for async insert
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Check if new metric was recorded
  console.log('\n3️⃣ Verifying new metric was recorded...');
  const { count: afterCount } = await supabase
    .from('woocommerce_usage_metrics')
    .select('*', { count: 'exact', head: true });

  console.log(`   New metrics count: ${afterCount || 0}`);

  if ((afterCount || 0) > (beforeCount || 0)) {
    console.log(`   ✅ Tracking works! (+${(afterCount || 0) - (beforeCount || 0)} new metrics)`);

    // Show the latest metric
    const { data: latestMetric } = await supabase
      .from('woocommerce_usage_metrics')
      .select('operation, success, duration_ms, domain, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestMetric) {
      console.log('\n📊 Latest metric:');
      console.log(`   - Operation: ${latestMetric.operation}`);
      console.log(`   - Success: ${latestMetric.success}`);
      console.log(`   - Duration: ${latestMetric.duration_ms}ms`);
      console.log(`   - Domain: ${latestMetric.domain}`);
      console.log(`   - Time: ${new Date(latestMetric.created_at).toLocaleString()}`);
    }
  } else {
    console.log('   ❌ No new metrics recorded - tracking may not be working');
  }

  // 5. Summary
  console.log('\n🎉 Analytics tracking test complete!');
}

test().catch(console.error);
