/**
 * Test Shop API Endpoint
 *
 * This script tests the actual shop dashboard API to see what's failing
 */

async function testShopAPI() {
  console.log('\n🧪 Testing Shop Dashboard API\n');
  console.log('=' .repeat(60));

  const BASE_URL = 'http://localhost:3000';
  const domains = ['localhost', 'omniops.co.uk', '127.0.0.1'];

  for (const domain of domains) {
    console.log(`\n📡 Testing with domain: "${domain}"\n`);

    try {
      const response = await fetch(`${BASE_URL}/api/woocommerce/dashboard`, {
        method: 'GET',
        headers: {
          'Host': domain,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response:`, JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ API call successful!');
        console.log(`   Revenue: ${data.kpis?.revenue?.currencySymbol}${data.kpis?.revenue?.today || 0}`);
        console.log(`   Orders: ${data.kpis?.orders?.total || 0}`);
        console.log(`   Abandoned Carts: ${data.kpis?.abandonedCarts?.count || 0}`);
      } else if (data.needsConfiguration) {
        console.log('⚠️  API says WooCommerce needs configuration');
        console.log(`   Error: ${data.error}`);
      } else {
        console.log('❌ API call failed');
        console.log(`   Error: ${data.error}`);
      }

    } catch (error: any) {
      console.log('❌ Request failed');
      console.log(`   Error: ${error.message}`);
      console.log(`   This usually means:`);
      console.log(`     - Development server is not running on port 3000`);
      console.log(`     - Run: npm run dev`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Next Steps:\n');
  console.log('1. If you see "needsConfiguration": The API can\'t find your config');
  console.log('   - Check that you\'re accessing localhost:3000');
  console.log('   - Try clearing browser cache/cookies');
  console.log('   - Check Network tab in browser DevTools\n');
  console.log('2. If you see an error: Check the error message above');
  console.log('3. If you see success: The API works! Check browser console\n');
  console.log('4. If connection refused: Start dev server with `npm run dev`\n');
}

testShopAPI().catch(console.error);
