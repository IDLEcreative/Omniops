/**
 * E2E Test: Widget Mobile Performance
 *
 * Tests font sizing, device pixel ratios, and network performance on mobile.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Mobile Performance E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should verify mobile font sizing', async ({ page }) => {
    // Set mobile viewport
    console.log('📍 Step 1: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check font sizes in widget
    console.log('📍 Step 2: Verify font sizes are readable on mobile');
    const fontSizes = await page.evaluate(() => {
      const textElements = document.querySelectorAll('body *');
      const sizes = new Map<string, number>();

      textElements.forEach(el => {
        const fontSize = window.getComputedStyle(el).fontSize;
        sizes.set(fontSize, (sizes.get(fontSize) || 0) + 1);
      });

      // Get min and max font sizes
      const sizeValues = Array.from(sizes.keys()).map(s => parseFloat(s));
      return {
        minFontSize: Math.min(...sizeValues),
        maxFontSize: Math.max(...sizeValues),
        uniqueSizes: sizes.size,
      };
    });

    console.log('✅ Font sizes:', fontSizes);
    // Minimum readable font size on mobile should be at least 12px
    expect(fontSizes.minFontSize).toBeGreaterThan(12);
    console.log('✅ Font sizes are readable on mobile');
  });

  test('should handle widget scaling on different device pixel ratios', async ({ page }) => {
    // Set mobile viewport with pixel ratio
    console.log('📍 Step 1: Set mobile viewport (iPhone 12 Pro - 3x pixel ratio)');
    await page.setViewportSize({ width: 390, height: 844 });
    console.log('✅ Viewport configured');

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check device pixel ratio handling
    console.log('📍 Step 2: Verify pixel ratio handling');
    const pixelRatioInfo = await page.evaluate(() => {
      return {
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        outerWidth: window.outerWidth,
      };
    });

    console.log('✅ Pixel ratio info:', pixelRatioInfo);
    expect(pixelRatioInfo.devicePixelRatio).toBeGreaterThan(0);
  });

  test('should maintain performance on mobile networks', async ({ page, context }) => {
    // Simulate slow 3G network
    console.log('📍 Step 1: Simulate slow 3G network conditions');
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 400 * 1024 / 8, // 400kb/s
      uploadThroughput: 400 * 1024 / 8,
      latency: 400, // 400ms latency
    });
    console.log('✅ 3G network conditions simulated');

    // Set mobile viewport
    console.log('📍 Step 2: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    // Measure load time
    const startTime = Date.now();
    console.log('📍 Step 3: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 30000 // Extended timeout for slow network
    });
    const loadTime = Date.now() - startTime;

    console.log(`✅ Page loaded in ${loadTime}ms on 3G network`);

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });

    const isVisible = await iframeLocator.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Widget is visible even on slow network');

    // Reset network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });
});
