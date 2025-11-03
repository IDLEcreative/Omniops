/**
 * Check Production Domain Configuration
 *
 * This script helps identify why the shop page isn't working in production
 * by checking domain configuration and suggesting fixes.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkProductionDomain() {
  console.log('\n🔍 Production Domain Diagnostic\n');
  console.log('=' .repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get all configurations
  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  if (!configs || configs.length === 0) {
    console.log('❌ No customer configurations found!');
    console.log('\n💡 Solution: Configure WooCommerce first at:');
    console.log('   http://localhost:3000/dashboard/integrations/woocommerce/configure\n');
    return;
  }

  console.log('\n📋 Existing Configurations:\n');

  const validConfigs = configs.filter(c =>
    c.woocommerce_url &&
    c.woocommerce_consumer_key &&
    c.woocommerce_consumer_secret
  );

  configs.forEach((config, i) => {
    const isValid = validConfigs.includes(config);
    console.log(`${i + 1}. Domain: "${config.domain || '(not set)'}"`);
    console.log(`   WooCommerce URL: ${config.woocommerce_url || '(not set)'}`);
    console.log(`   Status: ${isValid ? '✅ Complete' : '⚠️  Incomplete'}\n`);
  });

  console.log('=' .repeat(70));
  console.log('\n🌐 Production Domain Analysis:\n');

  // Check for common production domains
  const commonProductionDomains = [
    'omniops.co.uk',
    'www.omniops.co.uk',
    'app.omniops.co.uk',
    'omniops.vercel.app',
    'www.omniops.vercel.app'
  ];

  const configuredDomains = configs.map(c => c.domain?.toLowerCase()).filter(Boolean);
  const missingDomains = commonProductionDomains.filter(d =>
    !configuredDomains.includes(d)
  );

  if (missingDomains.length > 0) {
    console.log('⚠️  Common production domains NOT configured:');
    missingDomains.forEach(d => console.log(`   - ${d}`));
    console.log('');
  }

  // Show what IS configured
  if (validConfigs.length > 0) {
    console.log('✅ These domains ARE configured and working:');
    validConfigs.forEach(c => {
      console.log(`   - ${c.domain}`);
      console.log(`     Shop URL: https://${c.domain}/dashboard/shop`);
    });
    console.log('');
  }

  console.log('=' .repeat(70));
  console.log('\n🔧 How to Fix:\n');

  console.log('Option 1: Add your production domain');
  console.log('  Run: npx tsx scripts/database/add-production-domain.ts');
  console.log('  This will copy your localhost config to production domain\n');

  console.log('Option 2: Use the configure page in production');
  console.log('  Visit: https://YOUR-DOMAIN/dashboard/integrations/woocommerce/configure');
  console.log('  Enter your WooCommerce credentials\n');

  console.log('Option 3: Manually add SQL (advanced)');
  console.log('  Access Supabase Dashboard → SQL Editor');
  console.log('  Copy the localhost config to your production domain\n');

  console.log('=' .repeat(70));
  console.log('\n💡 Most Likely Issue:\n');
  console.log('Your production domain (e.g., "omniops.co.uk") is not in customer_configs.');
  console.log('The shop API looks for a config matching the Host header.');
  console.log('If it doesn\'t find one, it shows "No platforms connected".\n');

  console.log('🎯 Next Steps:\n');
  console.log('1. Identify your production domain (check browser URL bar)');
  console.log('2. Run: npx tsx scripts/database/add-production-domain.ts');
  console.log('3. Enter your production domain when prompted');
  console.log('4. Visit https://YOUR-DOMAIN/dashboard/shop\n');

  console.log('=' .repeat(70) + '\n');
}

checkProductionDomain().catch(console.error);
