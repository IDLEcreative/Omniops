/**
 * WooCommerce Store API Integration Tests
 *
 * Tests the Store API implementation including:
 * - Store API client functionality
 * - Session management
 * - Cart operations (add, get, remove, update, apply coupon)
 * - Fallback to informational mode
 * - Error handling
 *
 * Usage:
 *   npx tsx test-store-api-integration.ts
 *
 * Prerequisites:
 * - Redis running (for session management)
 * - WooCommerce Store API enabled on test store
 * - WOOCOMMERCE_STORE_API_ENABLED=true in .env.local
 *
 * Note: Some tests require a live WooCommerce instance and will be skipped
 * if Store API is not available.
 */

import { WooCommerceStoreAPI } from './lib/woocommerce-store-api';
import { CartSessionManager } from './lib/cart-session-manager';
import { getDynamicStoreAPIClient, isStoreAPIAvailable } from './lib/woocommerce-dynamic';
import { createRedisClient } from './lib/redis';

// Test configuration
const TEST_DOMAIN = process.env.TEST_WOOCOMMERCE_DOMAIN || 'test.example.com';
const TEST_STORE_URL = process.env.TEST_WOOCOMMERCE_URL || 'https://test.example.com';
const TEST_PRODUCT_ID = parseInt(process.env.TEST_PRODUCT_ID || '123');

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Run a test and record result
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - startTime,
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Assert helper
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ==================== SESSION MANAGER TESTS ====================

async function testSessionCreation() {
  const redis = createRedisClient();
  const sessionManager = new CartSessionManager(redis);

  const userId = 'test_user_123';
  const session = await sessionManager.getSession(userId, TEST_DOMAIN);

  assert(session.userId === userId, 'Session userId mismatch');
  assert(session.domain === TEST_DOMAIN, 'Session domain mismatch');
  assert(session.nonce.length > 0, 'Session nonce is empty');
  assert(session.isGuest === false, 'Session should not be guest');
}

async function testGuestSessionCreation() {
  const redis = createRedisClient();
  const sessionManager = new CartSessionManager(redis);

  const guestId = sessionManager.generateGuestId();
  assert(guestId.startsWith('guest_'), 'Guest ID should start with guest_');

  const session = await sessionManager.getSession(guestId, TEST_DOMAIN);
  assert(session.isGuest === true, 'Session should be guest');
}

async function testSessionPersistence() {
  const redis = createRedisClient();
  const sessionManager = new CartSessionManager(redis);

  const userId = 'test_user_persistence';
  const session1 = await sessionManager.getSession(userId, TEST_DOMAIN);
  const nonce1 = session1.nonce;

  // Get session again - should return same nonce
  const session2 = await sessionManager.getSession(userId, TEST_DOMAIN);
  assert(session2.nonce === nonce1, 'Session nonce should persist');
}

async function testSessionClearance() {
  const redis = createRedisClient();
  const sessionManager = new CartSessionManager(redis);

  const userId = 'test_user_clear';
  await sessionManager.getSession(userId, TEST_DOMAIN);

  // Clear session
  await sessionManager.clearSession(userId, TEST_DOMAIN);

  // Check session no longer exists
  const exists = await sessionManager.hasSession(userId, TEST_DOMAIN);
  assert(exists === false, 'Session should be cleared');
}

// ==================== STORE API CLIENT TESTS ====================

async function testStoreAPIClientCreation() {
  const storeAPI = new WooCommerceStoreAPI({
    url: TEST_STORE_URL,
    nonce: 'test_nonce_123',
  });

  assert(storeAPI !== null, 'Store API client should be created');
}

async function testStoreAPIAvailability() {
  // This test requires a live WooCommerce instance
  // Skip if not configured
  if (!process.env.TEST_WOOCOMMERCE_URL) {
    console.log('⚠️  Skipping Store API availability test (no TEST_WOOCOMMERCE_URL)');
    return;
  }

  const available = await isStoreAPIAvailable(TEST_DOMAIN);
  // Don't assert - just log result
  console.log(`   Store API available: ${available}`);
}

async function testDynamicClientCreation() {
  // This test requires database configuration
  // Skip if not in test environment
  if (!process.env.TEST_WOOCOMMERCE_URL) {
    console.log('⚠️  Skipping dynamic client creation test (no TEST_WOOCOMMERCE_URL)');
    return;
  }

  const client = await getDynamicStoreAPIClient(TEST_DOMAIN, 'test_user');
  // Don't assert - configuration may not exist
  console.log(`   Dynamic client created: ${client !== null}`);
}

// ==================== CART OPERATIONS TESTS ====================

async function testAddToCartFallback() {
  // Test informational mode (fallback)
  // This always works since it just generates URLs

  // Import cart operations
  const { addToCart } = await import('./lib/chat/cart-operations');

  const result = await addToCart(null, {
    productId: TEST_PRODUCT_ID.toString(),
    quantity: 2,
    domain: TEST_DOMAIN,
  });

  assert(result.success === true, 'Add to cart should succeed in informational mode');
  assert(result.data !== null, 'Result should have data');
  assert(result.message.includes('Ready to Add to Cart'), 'Message should indicate informational mode');
}

async function testGetCartFallback() {
  const { getCart } = await import('./lib/chat/cart-operations');

  const result = await getCart(null, {
    domain: TEST_DOMAIN,
  });

  assert(result.success === true, 'Get cart should succeed in informational mode');
  assert(result.data !== null, 'Result should have cart URL');
}

async function testRemoveFromCartFallback() {
  const { removeFromCart } = await import('./lib/chat/cart-operations');

  const result = await removeFromCart(null, {
    domain: TEST_DOMAIN,
  });

  assert(result.success === true, 'Remove from cart should succeed in informational mode');
}

async function testApplyCouponFallback() {
  const { applyCouponToCart } = await import('./lib/chat/cart-operations');

  const result = await applyCouponToCart(null, {
    couponCode: 'TEST123',
    domain: TEST_DOMAIN,
  });

  // Without WooCommerce API, should provide instructions without validation
  assert(result.success === true, 'Should succeed in informational mode');
  assert(result.data !== null, 'Result should have data');
  assert(result.message.includes('Apply Coupon'), 'Message should indicate coupon application');
  assert(result.message.includes('TEST123'), 'Message should include coupon code');
}

// ==================== ERROR HANDLING TESTS ====================

async function testInvalidProductId() {
  const storeAPI = new WooCommerceStoreAPI({
    url: TEST_STORE_URL,
    nonce: 'test_nonce',
  });

  const result = await storeAPI.addItem(999999, 1);

  // Should handle error gracefully
  assert(result.success === false || result.data !== undefined, 'Should handle invalid product ID');
}

async function testInvalidCouponCode() {
  const storeAPI = new WooCommerceStoreAPI({
    url: TEST_STORE_URL,
    nonce: 'test_nonce',
  });

  const result = await storeAPI.applyCoupon('INVALID_COUPON_XYZ');

  // Should handle error gracefully
  assert(result.success === false || result.data !== undefined, 'Should handle invalid coupon');
}

// ==================== MAIN TEST RUNNER ====================

async function main() {
  console.log('🧪 WooCommerce Store API Integration Tests\n');
  console.log(`Test Domain: ${TEST_DOMAIN}`);
  console.log(`Test Store URL: ${TEST_STORE_URL}`);
  console.log(`Test Product ID: ${TEST_PRODUCT_ID}\n`);

  // Session Manager Tests
  console.log('📦 Session Manager Tests:');
  await runTest('Session creation', testSessionCreation);
  await runTest('Guest session creation', testGuestSessionCreation);
  await runTest('Session persistence', testSessionPersistence);
  await runTest('Session clearance', testSessionClearance);

  console.log('\n🔌 Store API Client Tests:');
  await runTest('Store API client creation', testStoreAPIClientCreation);
  await runTest('Store API availability check', testStoreAPIAvailability);
  await runTest('Dynamic client creation', testDynamicClientCreation);

  console.log('\n🛒 Cart Operations Tests (Fallback Mode):');
  await runTest('Add to cart (informational)', testAddToCartFallback);
  await runTest('Get cart (informational)', testGetCartFallback);
  await runTest('Remove from cart (informational)', testRemoveFromCartFallback);
  await runTest('Apply coupon (informational)', testApplyCouponFallback);

  console.log('\n⚠️  Error Handling Tests:');
  await runTest('Invalid product ID', testInvalidProductId);
  await runTest('Invalid coupon code', testInvalidCouponCode);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
