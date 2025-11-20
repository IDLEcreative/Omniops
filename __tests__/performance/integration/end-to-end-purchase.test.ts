/**
 * End-to-End Purchase Flow Performance Tests
 *
 * Tests complete purchase flow timing from chat to checkout
 * Performance Goals:
 * - Complete flow < 5 seconds
 * - Each step < 2 seconds
 * - No blocking operations
 */

import { describe, it, expect } from '@jest/globals';
import { collectMetrics, printMetrics, formatDuration } from '../utils/metrics-collector';
import { assertResponseTime } from '../utils/assertion-helpers';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('End-to-End Purchase Flow Performance', () => {
  const TEST_DOMAIN = 'test-performance.example.com';
  const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
  const describeIf = runTests ? describe : describe.skip;

  describeIf('Complete Purchase Journey', () => {
    it('should complete entire flow in < 5 seconds', async () => {
      const startTime = performance.now();
      const stepTimings: Array<{ step: string; duration: number }> = [];

      // Step 1: Chat - Product Discovery
      const step1Start = performance.now();
      const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me hydraulic pumps under $500',
          domain: TEST_DOMAIN
        })
      });
      expect(chatResponse.ok).toBe(true);
      stepTimings.push({ step: 'Chat - Product Discovery', duration: performance.now() - step1Start });

      // Step 2: Product Search
      const step2Start = performance.now();
      const searchResponse = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'hydraulic pumps',
          domain: TEST_DOMAIN,
          filters: { priceMax: 500 }
        })
      });
      expect(searchResponse.ok).toBe(true);
      const products = await searchResponse.json();
      stepTimings.push({ step: 'Product Search', duration: performance.now() - step2Start });

      // Step 3: Add to Cart
      const step3Start = performance.now();
      const cartResponse = await fetch(`${BASE_URL}/api/woocommerce/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: TEST_DOMAIN,
          productId: products.products?.[0]?.id || 'test-product',
          quantity: 1
        })
      });
      expect(cartResponse.ok).toBe(true);
      stepTimings.push({ step: 'Add to Cart', duration: performance.now() - step3Start });

      // Step 4: Get Cart
      const step4Start = performance.now();
      const getCartResponse = await fetch(`${BASE_URL}/api/woocommerce/cart?domain=${TEST_DOMAIN}`);
      expect(getCartResponse.ok).toBe(true);
      stepTimings.push({ step: 'Get Cart', duration: performance.now() - step4Start });

      // Step 5: Checkout (initiate)
      const step5Start = performance.now();
      const checkoutResponse = await fetch(`${BASE_URL}/api/woocommerce/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: TEST_DOMAIN,
          billingInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }
        })
      });
      stepTimings.push({ step: 'Checkout Initiation', duration: performance.now() - step5Start });

      const totalDuration = performance.now() - startTime;

      // Print detailed timing breakdown
      console.log('\n🛒 Purchase Flow Performance Breakdown:');
      stepTimings.forEach(({ step, duration }) => {
        console.log(`  ${step}: ${formatDuration(duration)}`);
      });
      console.log(`  Total: ${formatDuration(totalDuration)}\n`);

      // Assertions
      expect(totalDuration).toBeLessThan(5000); // Total < 5s
      stepTimings.forEach(({ step, duration }) => {
        expect(duration).toBeLessThan(2000); // Each step < 2s
      });
    }, 30000);
  });

  describeIf('Parallel Operations', () => {
    it('should efficiently handle parallel data fetching', async () => {
      const startTime = performance.now();

      // Fetch multiple data sources in parallel
      const [chatRes, searchRes, cartRes] = await Promise.all([
        fetch(`${BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'What products are available?',
            domain: TEST_DOMAIN
          })
        }),
        fetch(`${BASE_URL}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'products',
            domain: TEST_DOMAIN
          })
        }),
        fetch(`${BASE_URL}/api/woocommerce/cart?domain=${TEST_DOMAIN}`)
      ]);

      const duration = performance.now() - startTime;

      console.log(`\n⚡ Parallel Operations: ${formatDuration(duration)}`);

      expect(chatRes.ok).toBe(true);
      expect(searchRes.ok).toBe(true);
      // Cart might be empty (404 acceptable)

      // Parallel should be faster than sequential (< 3s for all three)
      expect(duration).toBeLessThan(3000);
    }, 15000);
  });

  describeIf('Cache Performance', () => {
    it('should benefit from caching on repeated requests', async () => {
      const query = 'hydraulic pumps';

      // First request (uncached)
      const firstStart = performance.now();
      const firstResponse = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          domain: TEST_DOMAIN
        })
      });
      expect(firstResponse.ok).toBe(true);
      const firstDuration = performance.now() - firstStart;

      // Second request (should be cached)
      const secondStart = performance.now();
      const secondResponse = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          domain: TEST_DOMAIN
        })
      });
      expect(secondResponse.ok).toBe(true);
      const secondDuration = performance.now() - secondStart;

      console.log(`\n💾 Cache Performance:`);
      console.log(`  First request (uncached): ${formatDuration(firstDuration)}`);
      console.log(`  Second request (cached): ${formatDuration(secondDuration)}`);
      console.log(`  Speedup: ${(firstDuration / secondDuration).toFixed(2)}x\n`);

      // Cached request should be significantly faster (at least 2x)
      expect(secondDuration).toBeLessThan(firstDuration * 0.5);
    }, 15000);
  });
});
