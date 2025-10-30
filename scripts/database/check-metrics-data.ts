#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('🔍 Checking metrics data...\n');

  // Get all metrics
  const { data: metrics, error } = await supabase
    .from('woocommerce_usage_metrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${metrics.length} metrics:\n`);

  metrics.forEach((m, i) => {
    console.log(`${i + 1}. ${m.operation}`);
    console.log(`   Domain: ${m.domain}`);
    console.log(`   Config ID: ${m.customer_config_id || 'NULL'}`);
    console.log(`   Success: ${m.success}`);
    console.log(`   Duration: ${m.duration_ms}ms`);
    console.log(`   Created: ${new Date(m.created_at).toLocaleString()}\n`);
  });

  // Check customer configs for comparison
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('id, domain, organization_id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (configs) {
    console.log('📋 Customer config for thompsonseparts.co.uk:');
    console.log(`   ID: ${configs.id}`);
    console.log(`   Organization ID: ${configs.organization_id || 'NULL'}`);
  } else {
    console.log('⚠️  No customer config found for thompsonseparts.co.uk');
  }
}

check().catch(console.error);
