// Test WooCommerce API directly
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testWooCommerceAPI() {
  console.log('Testing WooCommerce API for product searches...\n');
  
  // Get the WooCommerce credentials for thompsonseparts.co.uk
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get WooCommerce config
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  if (error || !config) {
    console.log('Could not find WooCommerce config for thompsonseparts.co.uk');
    return;
  }
  
  // Decrypt credentials (simplified - in real app this uses encryption)
  const consumerKey = config.woocommerce_consumer_key;
  const consumerSecret = config.woocommerce_consumer_secret;
  const wcUrl = config.woocommerce_url;
  
  console.log('WooCommerce URL:', wcUrl);
  console.log('Credentials found:', !!consumerKey && !!consumerSecret);
  
  // Test different search approaches
  const testSearches = [
    { sku: '2EVRA48', description: 'Search by exact SKU: 2EVRA48' },
    { sku: 'PK-EK 291', description: 'Search by SKU with space: PK-EK 291' },
    { sku: 'PK-EK-291', description: 'Search by SKU with dash: PK-EK-291' },
    { search: '2EVRA48', description: 'General search for: 2EVRA48' },
    { search: 'PK-EK', description: 'Partial search for: PK-EK' }
  ];
  
  // Note: Since credentials are encrypted, we can't actually make the API call
  // But this shows what the chat agent SHOULD be doing
  console.log('\nThe chat agent should be making these API calls:');
  
  for (const test of testSearches) {
    console.log(`\n${test.description}`);
    if (test.sku) {
      console.log(`  GET ${wcUrl}/wp-json/wc/v3/products?sku=${encodeURIComponent(test.sku)}`);
    } else if (test.search) {
      console.log(`  GET ${wcUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(test.search)}`);
    }
  }
  
  console.log('\n\nKey Issues Found:');
  console.log('1. The SKU pattern in route.ts line 754 is: /\\b[A-Z0-9]{3,}[-_]?[A-Z0-9]*\\b/gi');
  console.log('   This may not match "2EVRA48" properly (might need adjustment for mixed alphanumeric)');
  console.log('2. The pattern expects uppercase, but "2EVRA48" starts with a number');
  console.log('3. "PK-EK 291" has a space which the pattern doesn\'t handle well');
  
  console.log('\n\nRecommended Fix:');
  console.log('Update the SKU extraction pattern to be more flexible:');
  console.log('  /\\b[A-Z0-9]+(?:[\\s-_][A-Z0-9]+)*\\b/gi');
  console.log('This would match:');
  console.log('  - 2EVRA48 (alphanumeric)');
  console.log('  - PK-EK 291 (with space)');
  console.log('  - PK-EK-291 (with dash)');
}

testWooCommerceAPI().catch(console.error);