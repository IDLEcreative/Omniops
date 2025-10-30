#!/usr/bin/env npx tsx

/**
 * Check Thompson's Configuration in Database
 */

import { createServiceRoleClient } from './lib/supabase-server';

async function checkThompsonConfig() {
  console.log('🔍 Checking Thompson\'s Configuration\n');
  console.log('═'.repeat(60));

  const domain = 'thompsonseparts.co.uk';

  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('❌ Failed to create Supabase client');
      process.exit(1);
    }

    // Check customer_configs
    console.log('\n📋 Checking customer_configs table...');
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', domain)
      .single();

    if (configError) {
      console.error('❌ Error fetching config:', configError.message);
      if (configError.code === 'PGRST116') {
        console.log('   No configuration found for:', domain);
        console.log('\n💡 Need to create configuration entry');
      }
    } else {
      console.log('✅ Configuration found:');
      console.log('   Domain:', config.domain);
      console.log('   WooCommerce Enabled:', config.woocommerce_enabled);
      console.log('   WooCommerce URL:', config.woocommerce_url);
      console.log('   Shopify Enabled:', config.shopify_enabled);
      console.log('   Has encrypted consumer key:', !!config.woocommerce_consumer_key_encrypted);
      console.log('   Has encrypted consumer secret:', !!config.woocommerce_consumer_secret_encrypted);
    }

    // Check domains table
    console.log('\n📋 Checking domains table...');
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('*')
      .eq('domain', domain);

    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError.message);
    } else if (domains && domains.length > 0) {
      console.log('✅ Domain entries found:', domains.length);
      domains.forEach((d, idx) => {
        console.log(`   ${idx + 1}. ID: ${d.id}, Created: ${d.created_at}`);
      });
    } else {
      console.log('⚠️  No domain entries found');
    }

    // Check environment variables fallback
    console.log('\n🔑 Checking environment variable fallback...');
    const hasEnvWooCommerce = Boolean(
      process.env.WOOCOMMERCE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET
    );
    console.log('   Has WooCommerce env vars:', hasEnvWooCommerce);
    if (hasEnvWooCommerce) {
      console.log('   WOOCOMMERCE_URL:', process.env.WOOCOMMERCE_URL);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkThompsonConfig().catch(console.error);
