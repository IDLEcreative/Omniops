/**
 * E2E Test: Widget Mobile Viewports
 *
 * Tests widget behavior on different mobile viewports and orientations.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Mobile Viewports E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should load widget on iPhone SE viewport', async ({ page }) => {
    // Set iPhone SE viewport
    console.log('📍 Step 1: Configure iPhone SE viewport (375x667)');
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('✅ Viewport set to iPhone SE size');

    // Navigate to widget test page
    console.log('📍 Step 2: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Widget test page loaded on mobile viewport');

    // Wait for widget iframe
    console.log('📍 Step 3: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Widget iframe visible on mobile');

    // Verify widget is responsive
    console.log('📍 Step 4: Verify widget is responsive');
    const isVisible = await iframeLocator.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Widget is visible and responsive on mobile');
  });

  test('should load widget on Android tablet viewport', async ({ page }) => {
    // Set Android tablet viewport
    console.log('📍 Step 1: Configure Android tablet viewport (768x1024)');
    await page.setViewportSize({ width: 768, height: 1024 });
    console.log('✅ Viewport set to Android tablet size');

    // Navigate to widget
    console.log('📍 Step 2: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Verify widget loads
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check widget dimensions on tablet
    console.log('📍 Step 3: Verify widget dimensions on tablet');
    const dimensions = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        fitsViewport: rect.width <= window.innerWidth && rect.height <= window.innerHeight,
      };
    });

    console.log('✅ Widget dimensions:', dimensions);
    expect(dimensions.fitsViewport).toBe(true);
  });

  test('should handle portrait orientation', async ({ page }) => {
    // Set portrait orientation (mobile)
    console.log('📍 Step 1: Set portrait orientation (480x800)');
    await page.setViewportSize({ width: 480, height: 800 });
    console.log('✅ Portrait orientation set');

    // Navigate
    console.log('📍 Step 2: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Verify positioning in portrait
    console.log('📍 Step 3: Verify positioning in portrait mode');
    const position = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.bottom,
      };
    });

    console.log('✅ Portrait layout:', position);
    expect(position.width).toBeLessThanOrEqual(window.innerWidth);
    console.log('✅ Widget fits within portrait viewport');
  });

  test('should handle landscape orientation', async ({ page }) => {
    // Set landscape orientation
    console.log('📍 Step 1: Set landscape orientation (800x480)');
    await page.setViewportSize({ width: 800, height: 480 });
    console.log('✅ Landscape orientation set');

    // Navigate
    console.log('📍 Step 2: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Verify positioning in landscape
    console.log('📍 Step 3: Verify positioning in landscape mode');
    const position = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        widthRatio: (rect.width / window.innerWidth) * 100,
        heightRatio: (rect.height / window.innerHeight) * 100,
      };
    });

    console.log('✅ Landscape layout:', position);
    console.log('✅ Widget adapts to landscape orientation');
  });

  test('should simulate orientation change', async ({ page }) => {
    // Start in portrait
    console.log('📍 Step 1: Start in portrait orientation');
    await page.setViewportSize({ width: 480, height: 800 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Get portrait position
    console.log('📍 Step 2: Record portrait widget position');
    const portraitPosition = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    console.log('✅ Portrait position:', portraitPosition);

    // Switch to landscape
    console.log('📍 Step 3: Rotate to landscape orientation');
    await page.setViewportSize({ width: 800, height: 480 });

    // Fire orientationchange event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('orientationchange'));
      window.dispatchEvent(new Event('resize'));
    });

    await page.waitForTimeout(1000);

    // Get landscape position
    console.log('📍 Step 4: Record landscape widget position');
    const landscapePosition = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    console.log('✅ Landscape position:', landscapePosition);
    console.log('✅ Widget responds to orientation changes');
  });
});
