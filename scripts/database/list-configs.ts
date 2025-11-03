/**
 * List all customer configurations
 *
 * Usage: npx tsx scripts/database/list-configs.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listConfigs() {
  console.log('📋 Fetching all customer configurations...\n');

  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching configs:', error);
    process.exit(1);
  }

  if (!configs || configs.length === 0) {
    console.log('ℹ️  No configurations found');
    return;
  }

  console.log(`✅ Found ${configs.length} configuration(s):\n`);

  configs.forEach((config, index) => {
    console.log(`${index + 1}. ${config.business_name || 'Unnamed Business'}`);
    console.log(`   ID: ${config.id}`);
    console.log(`   Domain: ${config.domain}`);
    console.log(`   Created: ${new Date(config.created_at).toLocaleString()}`);
    console.log(`   Features:`);
    console.log(`     - Website Scraping: ${config.features?.websiteScraping?.enabled ? '✅' : '❌'}`);
    console.log(`     - WooCommerce: ${config.features?.woocommerce?.enabled ? '✅' : '❌'}`);
    console.log('');
  });
}

listConfigs().catch(console.error);
