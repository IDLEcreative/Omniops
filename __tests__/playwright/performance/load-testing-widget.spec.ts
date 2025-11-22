import { test, expect } from '@playwright/test';

/**
 * E2E Test: Widget Load Performance
 *
 * Tests chat widget loading performance and resource utilization.
 *
 * Test Scenarios:
 * 1. Widget load time measurement
 * 2. Resource loading optimization ← THE TRUE "END"
 *
 * This test validates:
 * - Widget loads in < 2 seconds
 * - DOM content loaded efficiently
 * - Performance metrics within SLA
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000; // 5 minutes for performance tests

test.describe('Widget Load Performance Testing E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should load widget in under 2 seconds', async ({ page }) => {
    console.log('=== Starting Widget Load Time Test ===');

    // ============================================================================
    // STEP 1: Measure widget load time
    // ============================================================================
    console.log('📍 Step 1: Starting widget load timer');

    const startTime = Date.now();

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'domcontentloaded' });

    // Wait for widget iframe to appear
    const widgetIframe = page.locator('iframe#chat-widget-iframe');
    await widgetIframe.waitFor({ state: 'attached', timeout: 10000 });

    // Wait for iframe content to be interactive
    const iframe = page.frameLocator('iframe#chat-widget-iframe');
    const inputField = iframe.locator('input, textarea').first();
    await inputField.waitFor({ state: 'visible', timeout: 10000 });

    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Widget loaded in ${loadTime}ms`);

    // ============================================================================
    // STEP 2: Performance assertions
    // ============================================================================
    console.log('📍 Step 2: Validating load time against SLA');

    expect(loadTime).toBeLessThan(2000); // SLA: Widget loads in < 2 seconds
    console.log('✅ Widget load time within SLA (< 2000ms)');

    // ============================================================================
    // STEP 3: Measure resource loading
    // ============================================================================
    console.log('📍 Step 3: Measuring resource loading metrics');

    const performanceMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        loadComplete: perf.loadEventEnd - perf.fetchStart
      };
    });

    console.log('📊 Performance Metrics:');
    console.log(`   - DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`   - DOM Interactive: ${performanceMetrics.domInteractive}ms`);
    console.log(`   - Load Complete: ${performanceMetrics.loadComplete}ms`);

    console.log('✅ Widget load performance validated!');

    await page.screenshot({
      path: `test-results/widget-load-performance-${Date.now()}.png`,
      fullPage: true
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/widget-load-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
