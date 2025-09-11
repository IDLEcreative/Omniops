import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWooCommerceTengSearch() {
  console.log('🔍 Searching WooCommerce API directly for Teng products...\n');

  // Get WooCommerce credentials
  const { data: config } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, encrypted_woocommerce_consumer_key, encrypted_woocommerce_consumer_secret')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (!config) {
    console.error('No WooCommerce config found');
    return;
  }

  // Decrypt credentials (assuming they're not encrypted for this test)
  const wooConfig = {
    url: config.woocommerce_url || 'https://www.thompsonseparts.co.uk',
    consumerKey: config.encrypted_woocommerce_consumer_key,
    consumerSecret: config.encrypted_woocommerce_consumer_secret,
    version: 'wc/v3'
  };

  try {
    const WooCommerce = new WooCommerceRestApi(wooConfig);

    // 1. Search for "Teng"
    console.log('1️⃣ Searching for "Teng":');
    const tengSearch = await WooCommerce.get('products', {
      search: 'Teng',
      per_page: 20,
      status: 'publish'
    });
    
    console.log(`Found ${tengSearch.data.length} products matching "Teng"`);
    if (tengSearch.data.length > 0) {
      tengSearch.data.forEach((p: any, i: number) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   SKU: ${p.sku}`);
        console.log(`   Price: £${p.price}`);
        console.log(`   URL: ${p.permalink}`);
      });
    }

    // 2. Search for "Teng torque"
    console.log('\n2️⃣ Searching for "Teng torque":');
    const tengTorqueSearch = await WooCommerce.get('products', {
      search: 'Teng torque',
      per_page: 20,
      status: 'publish'
    });
    
    console.log(`Found ${tengTorqueSearch.data.length} products matching "Teng torque"`);
    if (tengTorqueSearch.data.length > 0) {
      tengTorqueSearch.data.forEach((p: any, i: number) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   SKU: ${p.sku}`);
        console.log(`   Price: £${p.price}`);
        console.log(`   URL: ${p.permalink}`);
      });
    }

    // 3. Search for just "torque" to see what's available
    console.log('\n3️⃣ Searching for "torque" (to see available torque products):');
    const torqueSearch = await WooCommerce.get('products', {
      search: 'torque',
      per_page: 10,
      status: 'publish'
    });
    
    console.log(`Found ${torqueSearch.data.length} torque products`);
    if (torqueSearch.data.length > 0) {
      torqueSearch.data.forEach((p: any, i: number) => {
        const isTeng = p.name.toLowerCase().includes('teng');
        console.log(`\n${i + 1}. ${p.name} ${isTeng ? '⚡ TENG PRODUCT' : ''}`);
        console.log(`   SKU: ${p.sku}`);
        console.log(`   Price: £${p.price}`);
      });
    }

  } catch (error: any) {
    console.error('WooCommerce API Error:', error.response?.data || error.message);
  }
}

testWooCommerceTengSearch().catch(console.error);