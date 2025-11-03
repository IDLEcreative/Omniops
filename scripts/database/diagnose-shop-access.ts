/**
 * Diagnostic Script: Shop Page Access Issues
 *
 * This script checks why the shop page might not be accessible
 * when WooCommerce is configured.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function diagnoseShopAccess() {
  console.log('\n🔍 Shop Access Diagnostic Tool\n');
  console.log('=' .repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Check all customer configs
  console.log('\n1️⃣ Checking customer_configs table...\n');
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .order('created_at', { ascending: false });

  if (configError) {
    console.error('❌ Error fetching configs:', configError);
    return;
  }

  if (!configs || configs.length === 0) {
    console.log('❌ No customer configurations found!');
    console.log('\n💡 Solution: Create a configuration via:');
    console.log('   /dashboard/integrations/woocommerce/configure');
    return;
  }

  console.log(`✅ Found ${configs.length} customer configuration(s):\n`);

  configs.forEach((config, index) => {
    console.log(`Config ${index + 1}:`);
    console.log(`  Domain: ${config.domain || '(not set)'}`);
    console.log(`  WooCommerce URL: ${config.woocommerce_url || '(not set)'}`);
    console.log(`  Consumer Key: ${config.woocommerce_consumer_key ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Consumer Secret: ${config.woocommerce_consumer_secret ? '✅ Set' : '❌ Missing'}`);

    // Check if all required fields are present
    const isComplete = config.woocommerce_url &&
                      config.woocommerce_consumer_key &&
                      config.woocommerce_consumer_secret;

    if (isComplete) {
      console.log(`  Status: ✅ Configuration is complete`);
    } else {
      console.log(`  Status: ⚠️  Configuration is incomplete`);
    }
    console.log('');
  });

  // 2. Check what domain the API would use
  console.log('\n2️⃣ Checking domain detection...\n');
  console.log('The shop API looks for config using:');
  console.log('  - Request host header (e.g., "localhost", "omniops.co.uk")');
  console.log('  - Falls back to "localhost" if not found\n');

  // 3. Simulate API call
  console.log('3️⃣ Simulating shop page load...\n');

  const testDomains = ['localhost', ...configs.map(c => c.domain).filter(Boolean)];

  for (const testDomain of testDomains) {
    console.log(`Testing domain: "${testDomain}"`);
    const matchingConfig = configs.find(c => c.domain === testDomain);

    if (!matchingConfig) {
      console.log(`  ❌ No config found for "${testDomain}"`);
      continue;
    }

    const hasAllFields = matchingConfig.woocommerce_url &&
                        matchingConfig.woocommerce_consumer_key &&
                        matchingConfig.woocommerce_consumer_secret;

    if (hasAllFields) {
      console.log(`  ✅ Config found and complete for "${testDomain}"`);
      console.log(`     Shop page should work at: http://${testDomain}:3000/dashboard/shop`);
    } else {
      console.log(`  ⚠️  Config found but incomplete for "${testDomain}"`);
      console.log(`     Missing: ${!matchingConfig.woocommerce_url ? 'URL ' : ''}${!matchingConfig.woocommerce_consumer_key ? 'Key ' : ''}${!matchingConfig.woocommerce_consumer_secret ? 'Secret' : ''}`);
    }
    console.log('');
  }

  // 4. Recommendations
  console.log('\n4️⃣ Recommendations:\n');

  const completeConfigs = configs.filter(c =>
    c.woocommerce_url &&
    c.woocommerce_consumer_key &&
    c.woocommerce_consumer_secret
  );

  if (completeConfigs.length === 0) {
    console.log('❌ No complete WooCommerce configurations found!');
    console.log('\n📝 To fix:');
    console.log('   1. Go to: http://localhost:3000/dashboard/integrations');
    console.log('   2. Click "Configure" on WooCommerce');
    console.log('   3. Enter your WooCommerce URL and credentials');
    console.log('   4. Click "Save Configuration"');
  } else if (completeConfigs.length === 1) {
    const config = completeConfigs[0];
    console.log('✅ You have a complete WooCommerce configuration!');
    console.log('\n🌐 Access your shop page at:');

    if (config.domain === 'localhost') {
      console.log('   http://localhost:3000/dashboard/shop');
    } else {
      console.log(`   http://${config.domain}/dashboard/shop`);
      console.log('   OR');
      console.log('   http://localhost:3000/dashboard/shop (if testing locally)');
    }

    console.log('\n⚠️  Make sure you\'re accessing the site with the correct domain!');
    console.log(`   Configured domain: "${config.domain}"`);
    console.log(`   If you're seeing "No platforms connected", your browser`);
    console.log(`   might be using a different domain than "${config.domain}"`);
  } else {
    console.log(`✅ You have ${completeConfigs.length} complete WooCommerce configurations!`);
    console.log('\n🌐 Available domains:');
    completeConfigs.forEach(c => {
      console.log(`   - ${c.domain}: http://${c.domain === 'localhost' ? 'localhost:3000' : c.domain}/dashboard/shop`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

diagnoseShopAccess().catch(console.error);
