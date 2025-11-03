/**
 * Add Production Domain to Customer Config
 *
 * This script adds or updates a customer_configs entry for your production domain
 * so that the shop page works in production.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addProductionDomain() {
  console.log('\n🌐 Add Production Domain Configuration\n');
  console.log('=' .repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Show existing configurations
  console.log('\n📋 Current Configurations:\n');
  const { data: existingConfigs } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url')
    .order('created_at', { ascending: false });

  if (existingConfigs && existingConfigs.length > 0) {
    existingConfigs.forEach((config, i) => {
      console.log(`${i + 1}. Domain: ${config.domain || '(not set)'}`);
      console.log(`   WooCommerce URL: ${config.woocommerce_url || '(not set)'}\n`);
    });
  } else {
    console.log('No existing configurations found.\n');
  }

  // 2. Ask for production domain
  console.log('=' .repeat(60));
  console.log('\nWhat is your production domain?');
  console.log('Examples:');
  console.log('  - omniops.co.uk');
  console.log('  - www.omniops.co.uk');
  console.log('  - app.omniops.co.uk');
  console.log('  - omniops.vercel.app\n');

  const productionDomain = await question('Production domain: ');

  if (!productionDomain || productionDomain.trim() === '') {
    console.log('\n❌ No domain provided. Exiting.\n');
    rl.close();
    return;
  }

  const domain = productionDomain.trim().toLowerCase();
  console.log(`\n✅ Using domain: "${domain}"\n`);

  // 3. Check if config already exists for this domain
  const { data: existingConfig } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .maybeSingle();

  if (existingConfig) {
    console.log('⚠️  Configuration already exists for this domain!');
    console.log(`Domain: ${existingConfig.domain}`);
    console.log(`WooCommerce URL: ${existingConfig.woocommerce_url || '(not set)'}\n`);

    const overwrite = await question('Do you want to update it? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled. No changes made.\n');
      rl.close();
      return;
    }
  }

  // 4. Copy from localhost config
  const { data: localhostConfig } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', 'localhost')
    .maybeSingle();

  if (!localhostConfig) {
    console.log('❌ No localhost configuration found to copy from!');
    console.log('\nPlease configure WooCommerce first at:');
    console.log('http://localhost:3000/dashboard/integrations/woocommerce/configure\n');
    rl.close();
    return;
  }

  console.log('\n📋 Copying WooCommerce credentials from localhost config...\n');

  // 5. Insert or update the production config
  const newConfig = {
    domain: domain,
    woocommerce_url: localhostConfig.woocommerce_url,
    woocommerce_consumer_key: localhostConfig.woocommerce_consumer_key,
    woocommerce_consumer_secret: localhostConfig.woocommerce_consumer_secret,
    openai_api_key: localhostConfig.openai_api_key,
    admin_email: localhostConfig.admin_email,
    business_name: localhostConfig.business_name,
    business_description: localhostConfig.business_description,
    rate_limit: localhostConfig.rate_limit,
    updated_at: new Date().toISOString()
  };

  if (existingConfig) {
    // Update existing
    const { error } = await supabase
      .from('customer_configs')
      .update(newConfig)
      .eq('domain', domain);

    if (error) {
      console.log('❌ Error updating configuration:', error);
      rl.close();
      return;
    }

    console.log('✅ Configuration updated successfully!\n');
  } else {
    // Insert new
    const { error } = await supabase
      .from('customer_configs')
      .insert([newConfig]);

    if (error) {
      console.log('❌ Error creating configuration:', error);
      rl.close();
      return;
    }

    console.log('✅ Configuration created successfully!\n');
  }

  // 6. Verify
  console.log('=' .repeat(60));
  console.log('\n🎉 Production Domain Configured!\n');
  console.log(`Domain: ${domain}`);
  console.log(`WooCommerce URL: ${newConfig.woocommerce_url}`);
  console.log(`\n🌐 Your shop page should now work at:`);
  console.log(`https://${domain}/dashboard/shop\n`);

  console.log('💡 Tips:');
  console.log('  1. Clear your browser cache and cookies');
  console.log('  2. Make sure you\'re accessing the site with this exact domain');
  console.log('  3. Check browser DevTools Network tab for any errors');
  console.log('  4. If still not working, check the Host header is correct\n');

  console.log('=' .repeat(60) + '\n');

  rl.close();
}

addProductionDomain().catch((error) => {
  console.error('Error:', error);
  rl.close();
});
