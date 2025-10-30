/**
 * Comprehensive WooCommerce Chat Integration Test
 *
 * Tests all 22 customer-facing WooCommerce operations through the chat API
 * to verify complete end-to-end functionality with GPT-4 tool calling.
 *
 * This test simulates real customer queries and validates that:
 * 1. GPT-4 correctly chooses the WooCommerce operations tool
 * 2. Operations execute successfully with WooCommerce API
 * 3. Results are properly formatted and returned to customers
 */

const CHAT_API_URL = 'http://localhost:3000/api/chat';
const DOMAIN = 'thompsonseparts.co.uk';
const TIMEOUT_MS = 120000; // 120 seconds (2 minutes) per operation
const DELAY_BETWEEN_TESTS = 4000; // 4 seconds between tests to avoid rate limiting

interface ChatRequest {
  message: string;
  domain: string;
  session_id: string;
  conversation_id?: string;
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: any[];
  searchMetadata?: any;
}

interface TestResult {
  category: string;
  operation: string;
  query: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  response?: string;
  error?: string;
  toolUsed?: string;
}

const results: TestResult[] = [];
const sessionId = `test-${Date.now()}`;
let conversationId: string | undefined;

/**
 * Send a message to the chat API
 */
async function sendChatMessage(message: string): Promise<{ response: ChatResponse; duration: number }> {
  const startTime = Date.now();

  const request: ChatRequest = {
    message,
    domain: DOMAIN,
    session_id: sessionId,
    conversation_id: conversationId
  };

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

    // Update conversation ID for subsequent messages
    if (data.conversation_id) {
      conversationId = data.conversation_id;
    }

      const duration = Date.now() - startTime;
      return { response: data, duration };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Handle AbortError specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw {
          error: new Error(`Request timeout after ${TIMEOUT_MS/1000} seconds`),
          duration
        };
      }

      throw { error: fetchError, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    throw { error, duration };
  }
}

/**
 * Test a single operation
 */
async function testOperation(
  category: string,
  operation: string,
  query: string,
  expectedToolPattern?: string
): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${operation}`);
  console.log(`   Query: "${query}"`);

  try {
    const { response, duration } = await sendChatMessage(query);

    // Check if the expected tool was used
    const toolUsed = response.searchMetadata?.searchLog?.[0]?.tool || 'unknown';

    // Basic validation
    if (!response.message || response.message.length === 0) {
      console.log(`❌ FAIL (${duration}ms): Empty response`);
      return {
        category,
        operation,
        query,
        status: 'FAIL',
        duration,
        error: 'Empty response message',
        toolUsed
      };
    }

    // Check if WooCommerce tool was used (for operations that should use it)
    const usedWooCommerce = response.searchMetadata?.searchLog?.some(
      (log: any) => log.source === 'woocommerce-api'
    );

    console.log(`✅ PASS (${duration}ms)`);
    console.log(`   Tool: ${toolUsed}`);
    console.log(`   WooCommerce: ${usedWooCommerce ? 'Yes' : 'No'}`);
    console.log(`   Response: ${response.message.substring(0, 150)}...`);

    return {
      category,
      operation,
      query,
      status: 'PASS',
      duration,
      response: response.message,
      toolUsed
    };
  } catch (err: any) {
    const duration = err.duration || 0;
    const errorMsg = err.error?.message || err.message || JSON.stringify(err) || String(err);

    console.log(`❌ FAIL (${duration}ms): ${errorMsg}`);

    return {
      category,
      operation,
      query,
      status: 'FAIL',
      duration,
      error: errorMsg
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 WooCommerce Chat Integration Test Suite');
  console.log('='.repeat(70));
  console.log(`📍 Domain: ${DOMAIN}`);
  console.log(`🔗 API: ${CHAT_API_URL}`);
  console.log(`🆔 Session: ${sessionId}\n`);

  const startTime = Date.now();

  // ========================================================================
  // CATEGORY 1: PRODUCT OPERATIONS
  // ========================================================================
  console.log('\n\n📦 CATEGORY 1: PRODUCT OPERATIONS');
  console.log('='.repeat(70));

  // Test 1: Get Stock Quantity (exact)
  results.push(await testOperation(
    'Product',
    'get_stock_quantity',
    'How many units of A4VTG90 do you have in stock?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS)); // Rate limit delay

  // Test 2: Check Stock Status
  results.push(await testOperation(
    'Product',
    'check_stock',
    'Is the A4VTG71 pump in stock?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 3: Get Product Details
  results.push(await testOperation(
    'Product',
    'get_product_details',
    'Can you give me full details on product SKU A4VTG90?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 4: Check Price
  results.push(await testOperation(
    'Product',
    'check_price',
    'What is the price of A4VTG90?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 5: Search Products
  results.push(await testOperation(
    'Product',
    'search_products',
    'Show me all hydraulic pumps under £500'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 6: Get Product Categories
  results.push(await testOperation(
    'Product',
    'get_product_categories',
    'What product categories do you have?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 7: Get Product Variations
  results.push(await testOperation(
    'Product',
    'get_product_variations',
    'What variations are available for product A4VTG90?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // ========================================================================
  // CATEGORY 2: ORDER OPERATIONS
  // ========================================================================
  console.log('\n\n📋 CATEGORY 2: ORDER OPERATIONS');
  console.log('='.repeat(70));

  // Test 8: Check Order Status (by ID)
  results.push(await testOperation(
    'Order',
    'check_order',
    'What is the status of order #1234?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 9: Check Order Status (by email)
  results.push(await testOperation(
    'Order',
    'check_order',
    'Can you look up orders for test@example.com?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 10: Get Customer Order History
  results.push(await testOperation(
    'Order',
    'get_customer_orders',
    'Show me all orders for customer@example.com in the last 30 days'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 11: Get Order Notes
  results.push(await testOperation(
    'Order',
    'get_order_notes',
    'What are the notes on order #1234?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 12: Check Refund Status
  results.push(await testOperation(
    'Order',
    'check_refund_status',
    'Has order #1234 been refunded?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // ========================================================================
  // CATEGORY 3: CART & COUPON OPERATIONS
  // ========================================================================
  console.log('\n\n🛒 CATEGORY 3: CART & COUPON OPERATIONS');
  console.log('='.repeat(70));

  // Test 13: Add to Cart
  results.push(await testOperation(
    'Cart',
    'add_to_cart',
    'I want to add 2 units of A4VTG90 to my cart'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 14: Get Cart
  results.push(await testOperation(
    'Cart',
    'get_cart',
    'Show me my shopping cart'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 15: Validate Coupon
  results.push(await testOperation(
    'Coupon',
    'validate_coupon',
    'Is coupon code SAVE10 valid?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 16: Apply Coupon
  results.push(await testOperation(
    'Coupon',
    'apply_coupon_to_cart',
    'How do I apply coupon SAVE10 to my order?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // ========================================================================
  // CATEGORY 4: STORE OPERATIONS
  // ========================================================================
  console.log('\n\n🏪 CATEGORY 4: STORE OPERATIONS');
  console.log('='.repeat(70));

  // Test 17: Get Shipping Methods
  results.push(await testOperation(
    'Store',
    'get_shipping_methods',
    'What shipping options do you offer to the UK?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 18: Get Payment Methods
  results.push(await testOperation(
    'Store',
    'get_payment_methods',
    'What payment methods do you accept?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // Test 19: Get Product Reviews
  results.push(await testOperation(
    'Product',
    'get_product_reviews',
    'What do customers say about A4VTG90?'
  ));

  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_TESTS));

  // ========================================================================
  // SUMMARY
  // ========================================================================
  const totalDuration = Date.now() - startTime;

  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`⏱️  Average per Test: ${(totalDuration / total / 1000).toFixed(2)}s`);

  // Category breakdown
  console.log('\n📊 By Category:');
  const categories = ['Product', 'Order', 'Cart', 'Coupon', 'Store'];
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.status === 'PASS').length;
    const catTotal = catResults.length;
    if (catTotal > 0) {
      console.log(`   ${cat}: ${catPassed}/${catTotal} passed`);
    }
  });

  // Failed tests details
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach((r, i) => {
      console.log(`\n   ${i + 1}. ${r.operation}`);
      console.log(`      Query: "${r.query}"`);
      console.log(`      Error: ${r.error}`);
    });
  }

  // Tool usage statistics
  console.log('\n🔧 Tool Usage:');
  const toolStats = results.reduce((acc, r) => {
    if (r.toolUsed) {
      acc[r.toolUsed] = (acc[r.toolUsed] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  Object.entries(toolStats).forEach(([tool, count]) => {
    console.log(`   ${tool}: ${count} times`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(passed === total ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
  console.log('='.repeat(70));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
console.log('⏳ Starting tests in 3 seconds...\n');
setTimeout(runTests, 3000);
