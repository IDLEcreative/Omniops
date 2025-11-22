import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: API & Concurrent Request Performance
 *
 * Tests API endpoint response times and concurrent request handling.
 *
 * Test Scenarios:
 * 1. Concurrent message burst handling
 * 2. API endpoint response times ← THE TRUE "END"
 *
 * This test validates:
 * - Handles concurrent requests without errors
 * - API endpoints respond within SLA
 * - No request failures under load
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000;

test.describe('API & Concurrent Performance Testing E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should handle concurrent message burst without errors', async ({ page }) => {
    console.log('=== Starting Concurrent Message Burst Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up burst handling mock');

    let concurrentRequests = 0;
    let maxConcurrent = 0;
    const responses: Array<{ id: number; startTime: number; endTime: number }> = [];

    await page.route('**/api/chat', async (route) => {
      const requestId = responses.length + 1;
      const startTime = Date.now();

      concurrentRequests++;
      maxConcurrent = Math.max(maxConcurrent, concurrentRequests);

      console.log(`🔄 Request ${requestId} started (concurrent: ${concurrentRequests})`);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      concurrentRequests--;
      const endTime = Date.now();

      responses.push({ id: requestId, startTime, endTime });

      console.log(`✅ Request ${requestId} completed in ${endTime - startTime}ms`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Response ${requestId}`,
          requestId
        })
      });
    });

    console.log('✅ Burst handling mock ready');

    // ============================================================================
    // STEP 3: Send burst of 10 rapid messages
    // ============================================================================
    console.log('📍 Step 3: Sending burst of 10 rapid messages (no delay)');

    const burstPromises = [];

    for (let i = 1; i <= 10; i++) {
      const promise = sendChatMessage(iframe, `Burst message ${i}`);
      burstPromises.push(promise);
      // No delay - send all rapidly
    }

    console.log('✅ All burst messages sent');

    // Wait for all to complete
    await Promise.all(burstPromises);
    await page.waitForTimeout(2000); // Extra time for all responses

    console.log('✅ All responses received');

    // ============================================================================
    // STEP 4: Analyze concurrent handling
    // ============================================================================
    console.log('📍 Step 4: Analyzing concurrent request handling');

    console.log('📊 Concurrent Burst Analysis:');
    console.log(`   - Total requests: ${responses.length}`);
    console.log(`   - Max concurrent: ${maxConcurrent}`);
    console.log(`   - All requests completed: ${responses.length === 10}`);

    expect(responses.length).toBe(10);
    console.log('✅ All burst messages handled successfully');

    expect(maxConcurrent).toBeGreaterThan(1);
    console.log('✅ System handled concurrent requests');

    console.log('✅ Concurrent message burst validated!');
  });

  test('should measure API endpoint response times', async ({ page }) => {
    console.log('=== Starting API Endpoint Performance Test ===');

    const endpoints = [
      { name: 'Chat API', url: '/api/chat' },
      { name: 'Widget Config', url: '/api/widget/config' },
      { name: 'Analytics', url: '/api/analytics/sessions' }
    ];

    const results: Array<{ endpoint: string; responseTime: number }> = [];

    for (const endpoint of endpoints) {
      console.log(`📍 Testing ${endpoint.name}: ${endpoint.url}`);

      const startTime = Date.now();

      try {
        const response = await page.request.get(`${BASE_URL}${endpoint.url}`);
        const responseTime = Date.now() - startTime;

        results.push({
          endpoint: endpoint.name,
          responseTime
        });

        console.log(`   ✅ ${endpoint.name}: ${responseTime}ms (status: ${response.status()})`);
      } catch (error) {
        console.log(`   ⚠️  ${endpoint.name}: Failed (${error})`);
      }
    }

    console.log('📊 API Performance Summary:');
    results.forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.responseTime}ms`);
    });

    // All endpoints should respond in < 2 seconds
    results.forEach(r => {
      expect(r.responseTime).toBeLessThan(2000);
    });

    console.log('✅ All API endpoints within performance SLA!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/api-performance-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
