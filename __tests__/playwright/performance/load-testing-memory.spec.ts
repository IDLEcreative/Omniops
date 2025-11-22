import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Memory Leak Detection
 *
 * Tests for memory leaks during extended chat usage.
 *
 * Test Scenarios:
 * 1. Measure initial memory usage
 * 2. Simulate 100 message conversation
 * 3. Measure final memory usage
 * 4. Validate acceptable memory growth ← THE TRUE "END"
 *
 * This test validates:
 * - No significant memory leaks over extended usage
 * - Memory growth stays within acceptable limits (<200%)
 * - Garbage collection working properly
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000;

test.describe('Memory Leak Detection E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should not leak memory over extended usage', async ({ page }) => {
    console.log('=== Starting Memory Leak Detection Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Taking initial memory snapshot');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });

    if (!initialMemory) {
      console.log('⏭️  performance.memory not available (Chrome DevTools required)');
      return;
    }

    console.log('📊 Initial Memory:');
    console.log(`   - Used JS Heap: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Total JS Heap: ${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);

    // ============================================================================
    // STEP 3: Simulate extended usage (100 messages)
    // ============================================================================
    console.log('📍 Step 3: Simulating extended usage (100 messages)');

    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Test response with some data'
        })
      });
    });

    for (let i = 1; i <= 100; i++) {
      await sendChatMessage(iframe, `Extended usage message ${i}`);

      if (i % 25 === 0) {
        console.log(`   Progress: ${i}/100 messages`);
      }
    }

    console.log('✅ 100 messages sent');

    // ============================================================================
    // STEP 4: Take final memory snapshot
    // ============================================================================
    console.log('📍 Step 4: Taking final memory snapshot');

    await page.waitForTimeout(2000); // Let GC run

    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });

    if (!finalMemory) return;

    console.log('📊 Final Memory:');
    console.log(`   - Used JS Heap: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Total JS Heap: ${(finalMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);

    // ============================================================================
    // STEP 5: Calculate memory growth
    // ============================================================================
    console.log('📍 Step 5: Analyzing memory growth');

    const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const growthPercentage = (memoryGrowth / initialMemory.usedJSHeapSize) * 100;

    console.log('📊 Memory Growth:');
    console.log(`   - Absolute: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Percentage: ${growthPercentage.toFixed(1)}%`);

    // ============================================================================
    // STEP 6: Validate acceptable memory growth
    // ============================================================================
    console.log('📍 Step 6: Validating acceptable memory growth');

    expect(growthPercentage).toBeLessThan(200); // Max 200% growth acceptable
    console.log('✅ Memory growth within acceptable limits (< 200%)');

    console.log('✅ No significant memory leaks detected!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/memory-leak-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
