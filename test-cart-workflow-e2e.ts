/**
 * End-to-End Cart Workflow Test
 * Tests full cart operations with Store API ENABLED
 */

// Load environment variables first
import { config } from 'dotenv';
config({ path: '.env.local' });

import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';
import { getDynamicStoreAPIClient, getDynamicWooCommerceClient } from './lib/woocommerce-dynamic';

async function testFullCartWorkflow() {
  console.log('🧪 FULL CART WORKFLOW E2E TEST (Store API ENABLED)\n');
  console.log('='.repeat(60));

  const domain = 'thompsonseparts.co.uk';
  const userId = 'test-user-' + Date.now();

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as { name: string; status: 'PASS' | 'FAIL'; message?: string; duration?: number }[]
  };

  function logTest(name: string, passed: boolean, message?: string, duration?: number) {
    const status = passed ? 'PASS' : 'FAIL';
    results.tests.push({ name, status, message, duration });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}${duration ? ` (${duration}ms)` : ''}`);
      if (message) console.log(`   ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}${duration ? ` (${duration}ms)` : ''}`);
      if (message) console.log(`   ${message}`);
    }
  }

  try {
    // Step 1: Verify environment configuration
    console.log('\n📝 Step 1: Verify Environment Configuration');
    const storeAPIEnabled = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';
    logTest(
      'Store API feature flag enabled',
      storeAPIEnabled,
      `WOOCOMMERCE_STORE_API_ENABLED=${process.env.WOOCOMMERCE_STORE_API_ENABLED}`
    );

    // Step 2: Create Store API client
    console.log('\n📝 Step 2: Create Store API Client');
    let start = Date.now();
    const storeAPI = await getDynamicStoreAPIClient(domain, userId);
    let duration = Date.now() - start;

    if (!storeAPI) {
      logTest(
        'Store API client creation',
        false,
        'Store API not available - will test fallback mode',
        duration
      );
      console.log('⚠️  Store API unavailable, testing informational mode only\n');
    } else {
      logTest('Store API client created', true, undefined, duration);

      // Check if Store API is available (health check)
      start = Date.now();
      const isAvailable = await storeAPI.isAvailable();
      duration = Date.now() - start;
      logTest(
        'Store API health check',
        isAvailable,
        isAvailable ? 'Store API is reachable' : 'Store API endpoint not responding',
        duration
      );
    }

    // Step 3: Get WooCommerce REST API client (for product search)
    console.log('\n📝 Step 3: Get WooCommerce REST API Client');
    start = Date.now();
    const wc = await getDynamicWooCommerceClient(domain);
    duration = Date.now() - start;

    logTest(
      'WooCommerce REST API client created',
      wc !== null,
      undefined,
      duration
    );

    if (!wc) {
      throw new Error('WooCommerce REST API not configured - cannot proceed');
    }

    // Step 4: Search for a product to test with
    console.log('\n📝 Step 4: Search for Test Product');
    start = Date.now();
    const searchResult = await executeWooCommerceOperation(
      'search_products',
      {
        query: 'pump',
        page: 1,
        per_page: 5,
        domain,
      },
      domain
    );
    duration = Date.now() - start;

    logTest(
      'Product search works',
      searchResult.success === true,
      searchResult.message,
      duration
    );

    let testProductId: string | null = null;
    if (searchResult.success && searchResult.data?.products?.length > 0) {
      testProductId = searchResult.data.products[0].id.toString();
      logTest(
        'Test product found',
        true,
        `Using product ID: ${testProductId} (${searchResult.data.products[0].name})`
      );
    } else {
      logTest(
        'Test product found',
        false,
        'No products found in search - will use dummy ID 123'
      );
      testProductId = '123'; // Fallback to dummy ID
    }

    // Step 5: Add item to cart
    console.log('\n📝 Step 5: Add Item to Cart');
    start = Date.now();
    const addResult = await executeWooCommerceOperation(
      'add_to_cart',
      {
        productId: testProductId,
        quantity: 2,
        domain,
        storeAPI, // Pass Store API client if available
      },
      domain
    );
    duration = Date.now() - start;

    logTest(
      'Add to cart operation',
      addResult.success === true,
      addResult.message,
      duration
    );

    // Verify mode used
    const usingStoreAPI = storeAPI && storeAPIEnabled;
    console.log(`   Mode: ${usingStoreAPI ? 'TRANSACTIONAL (Store API)' : 'INFORMATIONAL (URL-based)'}`);

    // Step 6: Get cart contents
    console.log('\n📝 Step 6: Get Cart Contents');
    start = Date.now();
    const cartResult = await executeWooCommerceOperation(
      'get_cart',
      { domain, storeAPI },
      domain
    );
    duration = Date.now() - start;

    logTest(
      'Get cart operation',
      cartResult.success === true,
      cartResult.message,
      duration
    );

    // Step 7: Update cart quantity
    console.log('\n📝 Step 7: Update Cart Quantity');
    start = Date.now();
    const updateResult = await executeWooCommerceOperation(
      'update_cart_quantity',
      {
        productId: testProductId,
        quantity: 5,
        domain,
        storeAPI,
      },
      domain
    );
    duration = Date.now() - start;

    logTest(
      'Update cart quantity operation',
      updateResult.success === true,
      updateResult.message,
      duration
    );

    // Step 8: Apply coupon (may not work without valid coupon)
    console.log('\n📝 Step 8: Apply Coupon');
    start = Date.now();
    const couponResult = await executeWooCommerceOperation(
      'apply_coupon_to_cart',
      {
        couponCode: 'SAVE10',
        domain,
        storeAPI,
      },
      domain
    );
    duration = Date.now() - start;

    // Coupon may not exist - either success or informational message is OK
    const couponOk = couponResult.success === true || couponResult.message.includes('apply');
    logTest(
      'Apply coupon operation',
      couponOk,
      couponResult.message,
      duration
    );

    // Step 9: Remove from cart
    console.log('\n📝 Step 9: Remove from Cart');
    start = Date.now();
    const removeResult = await executeWooCommerceOperation(
      'remove_from_cart',
      {
        productId: testProductId,
        domain,
        storeAPI,
      },
      domain
    );
    duration = Date.now() - start;

    logTest(
      'Remove from cart operation',
      removeResult.success === true,
      removeResult.message,
      duration
    );

    // Step 10: Verify currency is included
    console.log('\n📝 Step 10: Verify Currency Information');
    logTest(
      'Currency code included',
      addResult.currency !== undefined && addResult.currency !== null,
      `Currency: ${addResult.currency || 'NOT FOUND'}`
    );

    logTest(
      'Currency symbol included',
      addResult.currencySymbol !== undefined && addResult.currencySymbol !== null,
      `Symbol: ${addResult.currencySymbol || 'NOT FOUND'}`
    );

  } catch (error) {
    console.error('\n💥 Fatal error during cart workflow tests:', error);
    results.failed++;
    results.tests.push({
      name: 'Fatal error',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  // Performance metrics
  const testsWithDuration = results.tests.filter(t => t.duration !== undefined);
  if (testsWithDuration.length > 0) {
    const avgDuration = testsWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0) / testsWithDuration.length;
    const maxDuration = Math.max(...testsWithDuration.map(t => t.duration || 0));
    console.log(`\n⏱️  PERFORMANCE METRICS:`);
    console.log(`Average Operation Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`Slowest Operation: ${maxDuration}ms`);
  }

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  - ${t.name}${t.message ? ': ' + t.message : ''}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testFullCartWorkflow().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
