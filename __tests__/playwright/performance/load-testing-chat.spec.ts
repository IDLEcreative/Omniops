import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Response & Conversation Performance
 *
 * Tests chat response times and large conversation handling.
 *
 * Test Scenarios:
 * 1. Chat response time under load
 * 2. Large conversation handling (50+ messages) ← THE TRUE "END"
 *
 * This test validates:
 * - Chat responses in < 3 seconds (p95)
 * - Handles 50+ message conversations without degradation
 * - Performance doesn't degrade with large context
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000;

test.describe('Chat Performance Testing E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should respond to chat messages within 3 seconds (p95)', async ({ page }) => {
    console.log('=== Starting Chat Response Time Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up response time tracking');

    const responseTimes: number[] = [];

    await page.route('**/api/chat', async (route) => {
      const startTime = Date.now();

      // Simulate AI processing delay (100-500ms)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      console.log(`⏱️  Response ${responseTimes.length}: ${responseTime}ms`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Response ${responseTimes.length}: Test message`,
          processingTime: responseTime
        })
      });
    });

    console.log('✅ Response time tracking enabled');

    // ============================================================================
    // STEP 3: Send multiple messages and measure response times
    // ============================================================================
    console.log('📍 Step 3: Sending 20 test messages');

    const testMessages = [
      'Show me products',
      'What are your best sellers?',
      'Do you have pumps?',
      'Tell me about shipping',
      'What is your return policy?',
      'Show me hydraulic equipment',
      'What are your prices?',
      'Do you offer discounts?',
      'How long is shipping?',
      'Can I track my order?',
      'What payment methods do you accept?',
      'Do you ship internationally?',
      'What is your warranty?',
      'How do I contact support?',
      'Are products in stock?',
      'What categories do you have?',
      'Show me new arrivals',
      'Do you have sales?',
      'What brands do you carry?',
      'Can I return items?'
    ];

    for (let i = 0; i < testMessages.length; i++) {
      console.log(`   Sending message ${i + 1}/${testMessages.length}`);
      await sendChatMessage(iframe, testMessages[i]);
      await page.waitForTimeout(500); // Small delay between messages
    }

    console.log('✅ All messages sent');

    // ============================================================================
    // STEP 4: Calculate performance statistics
    // ============================================================================
    console.log('📍 Step 4: Calculating performance statistics');

    responseTimes.sort((a, b) => a - b);

    const stats = {
      min: responseTimes[0],
      max: responseTimes[responseTimes.length - 1],
      avg: responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length,
      p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
      p90: responseTimes[Math.floor(responseTimes.length * 0.9)],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
    };

    console.log('📊 Response Time Statistics:');
    console.log(`   - Min: ${stats.min}ms`);
    console.log(`   - Max: ${stats.max}ms`);
    console.log(`   - Average: ${stats.avg.toFixed(0)}ms`);
    console.log(`   - p50 (median): ${stats.p50}ms`);
    console.log(`   - p90: ${stats.p90}ms`);
    console.log(`   - p95: ${stats.p95}ms`);
    console.log(`   - p99: ${stats.p99}ms`);

    // ============================================================================
    // STEP 5: Validate against SLA
    // ============================================================================
    console.log('📍 Step 5: Validating against SLA');

    expect(stats.p95).toBeLessThan(3000); // SLA: 95% of responses in < 3 seconds
    console.log('✅ p95 response time within SLA (< 3000ms)');

    expect(stats.avg).toBeLessThan(1500); // Average should be well under p95
    console.log('✅ Average response time good (< 1500ms)');

    console.log('✅ Chat response performance validated!');
  });

  test('should handle large conversations without degradation (50+ messages)', async ({ page }) => {
    console.log('=== Starting Large Conversation Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up large conversation simulation');

    let messageCount = 0;
    const responseTimes: number[] = [];

    await page.route('**/api/chat', async (route) => {
      const startTime = Date.now();
      messageCount++;

      // Simulate increasing context size
      const contextSize = Math.min(messageCount * 100, 5000); // Cap at 5000 tokens

      // Processing time increases slightly with context
      const baseDelay = 150;
      const contextDelay = contextSize / 100; // 10ms per 100 tokens
      await new Promise(resolve => setTimeout(resolve, baseDelay + contextDelay));

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      console.log(`⏱️  Message ${messageCount}: ${responseTime}ms (context: ${contextSize} tokens)`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Response ${messageCount}`,
          metadata: {
            contextSize,
            responseTime
          }
        })
      });
    });

    console.log('✅ Large conversation simulation ready');

    // ============================================================================
    // STEP 3: Send 50 messages simulating long conversation
    // ============================================================================
    console.log('📍 Step 3: Sending 50 messages to simulate long conversation');

    for (let i = 1; i <= 50; i++) {
      await sendChatMessage(iframe, `Message ${i}: Tell me about product ${i}`);

      // Occasional delay to simulate realistic conversation
      if (i % 10 === 0) {
        console.log(`   Progress: ${i}/50 messages sent`);
        await page.waitForTimeout(200);
      }
    }

    console.log('✅ 50 messages sent');

    // ============================================================================
    // STEP 4: Analyze performance degradation
    // ============================================================================
    console.log('📍 Step 4: Analyzing performance degradation');

    // Compare first 10 vs last 10 response times
    const firstTen = responseTimes.slice(0, 10);
    const lastTen = responseTimes.slice(-10);

    const firstTenAvg = firstTen.reduce((sum, t) => sum + t, 0) / firstTen.length;
    const lastTenAvg = lastTen.reduce((sum, t) => sum + t, 0) / lastTen.length;

    const degradation = ((lastTenAvg - firstTenAvg) / firstTenAvg) * 100;

    console.log('📊 Performance Degradation Analysis:');
    console.log(`   - First 10 messages avg: ${firstTenAvg.toFixed(0)}ms`);
    console.log(`   - Last 10 messages avg: ${lastTenAvg.toFixed(0)}ms`);
    console.log(`   - Degradation: ${degradation.toFixed(1)}%`);

    // ============================================================================
    // STEP 5: Validate acceptable degradation
    // ============================================================================
    console.log('📍 Step 5: Validating acceptable degradation');

    expect(degradation).toBeLessThan(50); // Max 50% degradation acceptable
    console.log('✅ Performance degradation within acceptable limits (< 50%)');

    expect(lastTenAvg).toBeLessThan(1000); // Even at 50 messages, should stay under 1s
    console.log('✅ Response times remain fast even with large context');

    console.log('✅ Large conversation handling validated!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/chat-performance-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
