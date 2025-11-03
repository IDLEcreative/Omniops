import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWooConfig() {
  console.log('\n🔍 Checking WooCommerce Configuration\n');
  console.log('─'.repeat(60));

  // Check environment variables
  console.log('\n📝 Environment Variables:');
  console.log(`   WOOCOMMERCE_URL: ${process.env.WOOCOMMERCE_URL || 'NOT SET'}`);
  console.log(`   WOOCOMMERCE_CONSUMER_KEY: ${process.env.WOOCOMMERCE_CONSUMER_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`   WOOCOMMERCE_CONSUMER_SECRET: ${process.env.WOOCOMMERCE_CONSUMER_SECRET ? 'SET' : 'NOT SET'}`);

  // Check database
  console.log('\n💾 Database Configuration:');

  const domains = ['www.thompsonseparts.co.uk', 'thompsonseparts.co.uk'];

  for (const domain of domains) {
    console.log(`\n   Checking domain: ${domain}`);

    const { data, error } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_url, encrypted_woocommerce_consumer_key, shopify_shop')
      .eq('domain', domain)
      .single();

    if (error) {
      console.log(`   ❌ Not found in database`);
      continue;
    }

    if (data) {
      console.log(`   ✅ Found in database:`);
      console.log(`      - woocommerce_url: ${data.woocommerce_url || 'NOT SET'}`);
      console.log(`      - has credentials: ${data.encrypted_woocommerce_consumer_key ? 'YES' : 'NO'}`);
      console.log(`      - shopify_shop: ${data.shopify_shop || 'NOT SET'}`);
    }
  }

  console.log('\n─'.repeat(60));
  console.log('\n💡 Analysis:');
  console.log('   The widget config endpoint checks database.woocommerce_url');
  console.log('   If NOT SET in database, woocommerce_enabled = false');
  console.log('   Even if environment variables are set!');
  console.log('\n✅ Solution: Add WooCommerce URL to customer_configs table');
  console.log('\n');
}

checkWooConfig().catch(console.error);
