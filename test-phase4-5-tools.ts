/**
 * Quick Smoke Test for Phase 4 & 5 WooCommerce Tools
 * Tests all 10 new operations with basic scenarios
 */

import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';

const DOMAIN = 'thompsonseparts.co.uk';

interface TestResult {
  tool: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  message: string;
  error?: string;
}

const results: TestResult[] = [];

async function testTool(
  name: string,
  operation: string,
  params: any
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`\n🧪 Testing: ${name}...`);

    const result = await executeWooCommerceOperation(operation, params, DOMAIN);
    const duration = Date.now() - start;

    if (result.success) {
      console.log(`✅ PASS (${duration}ms): ${result.message?.substring(0, 100)}...`);
      return {
        tool: name,
        status: 'PASS',
        duration,
        message: result.message || 'Success'
      };
    } else {
      console.log(`❌ FAIL (${duration}ms): ${result.message}`);
      return {
        tool: name,
        status: 'FAIL',
        duration,
        message: result.message || 'Unknown error',
        error: result.message
      };
    }
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`❌ FAIL (${duration}ms): ${errorMsg}`);
    return {
      tool: name,
      status: 'FAIL',
      duration,
      message: 'Exception thrown',
      error: errorMsg
    };
  }
}

async function runTests() {
  console.log('🚀 Starting WooCommerce Tools Smoke Test\n');
  console.log('📍 Domain:', DOMAIN);
  console.log('📦 Testing 10 new tools from Phases 4 & 5\n');
  console.log('='.repeat(60));

  // Phase 4: Business Intelligence Tools
  console.log('\n\n📊 PHASE 4: BUSINESS INTELLIGENCE TOOLS');
  console.log('='.repeat(60));

  // Test 1: Low Stock Products
  results.push(await testTool(
    'get_low_stock_products',
    'get_low_stock_products',
    { threshold: 10, limit: 10 }
  ));

  // Test 2: Sales Report
  results.push(await testTool(
    'get_sales_report',
    'get_sales_report',
    { period: 'week' }
  ));

  // Test 3: Customer Insights
  results.push(await testTool(
    'get_customer_insights',
    'get_customer_insights',
    { limit: 5 }
  ));

  // Phase 5: Critical Customer Tools
  console.log('\n\n🛒 PHASE 5: CRITICAL CUSTOMER TOOLS');
  console.log('='.repeat(60));

  // Test 4: Search Products (already verified, but test again)
  results.push(await testTool(
    'search_products',
    'search_products',
    { query: 'pump', limit: 5 }
  ));

  // Test 5: Cancel Order (use a fake order ID to test validation)
  results.push(await testTool(
    'cancel_order',
    'cancel_order',
    { orderId: '99999', reason: 'Test cancellation' }
  ));

  // Test 6: Add to Cart (need a real product ID)
  // First, get a product ID from search
  console.log('\n🔍 Finding a product ID for cart tests...');
  const searchResult = await executeWooCommerceOperation('search_products', { query: 'pump', limit: 1 }, DOMAIN);

  let productId = null;
  if (searchResult.success && searchResult.data?.products?.[0]) {
    productId = searchResult.data.products[0].id;
    console.log(`✅ Found product ID: ${productId}`);
  } else {
    console.log('⚠️  Could not find product, using ID 1 as fallback');
    productId = 1;
  }

  results.push(await testTool(
    'add_to_cart',
    'add_to_cart',
    { productId: String(productId), quantity: 2, domain: DOMAIN }
  ));

  // Test 7: Get Cart
  results.push(await testTool(
    'get_cart',
    'get_cart',
    { domain: DOMAIN }
  ));

  // Test 8: Remove from Cart
  results.push(await testTool(
    'remove_from_cart',
    'remove_from_cart',
    { domain: DOMAIN }
  ));

  // Test 9: Update Cart Quantity
  results.push(await testTool(
    'update_cart_quantity',
    'update_cart_quantity',
    { domain: DOMAIN }
  ));

  // Test 10: Apply Coupon (test with a fake coupon to verify validation)
  results.push(await testTool(
    'apply_coupon_to_cart',
    'apply_coupon_to_cart',
    { couponCode: 'TESTCODE', domain: DOMAIN }
  ));

  // Generate Report
  console.log('\n\n📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✅ Passed: ${passed}/10`);
  console.log(`❌ Failed: ${failed}/10`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Success Rate: ${((passed / 10) * 100).toFixed(1)}%\n`);

  // Detailed Results
  console.log('\n📋 DETAILED RESULTS');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${index + 1}. ${icon} ${result.tool}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Message: ${result.message.substring(0, 100)}${result.message.length > 100 ? '...' : ''}`);
    if (result.error) {
      console.log(`   Error: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`);
    }
  });

  // Failures Detail
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('\n\n⚠️  FAILED TESTS DETAILS');
    console.log('='.repeat(60));
    failures.forEach(failure => {
      console.log(`\n❌ ${failure.tool}`);
      console.log(`   ${failure.message}`);
      if (failure.error) {
        console.log(`   ${failure.error}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Test Complete: ${passed}/10 tools working correctly\n`);

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal Error:', error);
  process.exit(1);
});
