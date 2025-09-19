// Test different URL variations for WooCommerce
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

const urlVariations = [
  'https://thompsonseparts.co.uk',
  'https://www.thompsonseparts.co.uk',
  'http://thompsonseparts.co.uk',
  'https://thompsonseparts.co.uk/shop'
];

console.log('=== Testing URL Variations ===\n');

async function testUrl(baseUrl) {
  console.log(`Testing: ${baseUrl}`);
  
  try {
    // First check if WooCommerce API exists
    const apiCheckUrl = `${baseUrl}/wp-json/wc/v3/`;
    const checkRes = await fetch(apiCheckUrl);
    console.log(`  API check: ${checkRes.status} ${checkRes.statusText}`);
    
    // Try with credentials
    const testUrl = `${baseUrl}/wp-json/wc/v3/orders?per_page=1&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
    const res = await fetch(testUrl);
    console.log(`  Orders endpoint: ${res.status} ${res.statusText}`);
    
    if (res.status === 200) {
      const data = await res.json();
      console.log(`  ✓ SUCCESS! Found ${Array.isArray(data) ? data.length : 0} orders`);
      return true;
    } else if (res.status === 401) {
      const data = await res.json();
      console.log(`  ✗ Auth failed: ${data.message}`);
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
  }
  
  console.log('');
  return false;
}

async function runTests() {
  for (const url of urlVariations) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n✅ Working URL found: ${url}`);
      console.log('Update your .env.local file with:');
      console.log(`WOOCOMMERCE_URL=${url}`);
      break;
    }
  }
}

runTests();