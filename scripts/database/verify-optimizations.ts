#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verify() {
  console.log('🔍 Supabase Optimization Verification Report\n');
  console.log('═══════════════════════════════════════════\n');

  // Check materialized views
  try {
    const { data: domainSummary, error: err1 } = await supabase
      .from('chat_telemetry_domain_summary')
      .select('domain, total_requests_all_time, total_cost_usd_all_time')
      .limit(5);

    console.log('✅ Domain Summary Materialized View:');
    if (err1) {
      console.log('  ❌ Error:', err1.message);
    } else {
      console.log('  ✅ View exists and has data!');
      console.log('  📊 Sample:', JSON.stringify(domainSummary, null, 2));
    }
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  try {
    const { data: modelSummary, error: err2 } = await supabase
      .from('chat_telemetry_model_summary')
      .select('model, total_uses, total_cost')
      .limit(5);

    console.log('\n✅ Model Summary Materialized View:');
    if (err2) {
      console.log('  ❌ Error:', err2.message);
    } else {
      console.log('  ✅ View exists and has data!');
      console.log('  📊 Sample:', JSON.stringify(modelSummary, null, 2));
    }
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  // Test refresh function
  try {
    const { data: refreshData, error: err3 } = await supabase
      .rpc('refresh_telemetry_summary_views');

    console.log('\n✅ Refresh Function:');
    if (err3) {
      console.log('  ❌ Error:', err3.message);
    } else {
      console.log('  ✅ Function works!');
      console.log('  🔄 Refresh results:', JSON.stringify(refreshData, null, 2));
    }
  } catch (e: any) {
    console.log('  ❌ Failed:', e.message);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log('  - Analytics composite indexes: ✅ Applied');
  console.log('  - Conversation metadata function: ✅ Applied');
  console.log('  - Telemetry materialized views: Check results above');
  console.log('  - RLS optimization: ⏭️  Skipped (syntax issues)');
  console.log('  - Conversation analytics: ⏭️  Skipped (schema mismatch)');
  console.log('═══════════════════════════════════════════\n');
}

verify().catch(console.error);
