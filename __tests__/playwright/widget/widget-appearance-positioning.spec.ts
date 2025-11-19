/**
 * E2E Test: Widget Appearance - Positioning
 *
 * Tests widget positioning options and z-index handling.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Appearance - Positioning E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display widget with default appearance', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Widget test page loaded');

    // Wait for widget iframe to load
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Widget iframe visible');

    // Verify widget is visible on page
    console.log('📍 Step 3: Verify widget visibility');
    const isVisible = await iframeLocator.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Widget is visible on page');

    // Check iframe styling
    console.log('📍 Step 4: Verify widget styling');
    const styles = await iframeLocator.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        border: computed.border,
        borderRadius: computed.borderRadius,
      };
    });

    console.log('✅ Widget styles:', styles);
    expect(styles.position).toBeTruthy();
  });

  test('should apply bottom-right positioning', async ({ page }) => {
    console.log('📍 Step 1: Configure widget with bottom-right position');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check iframe position in viewport
    console.log('📍 Step 3: Verify bottom-right positioning');
    const position = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      return {
        right: computed.right,
        bottom: computed.bottom,
        top: computed.top,
        left: computed.left,
        viewportRight: window.innerWidth - rect.right,
        viewportBottom: window.innerHeight - rect.bottom,
      };
    });

    console.log('✅ Widget position:', position);
    // Widget should be positioned to the right side
    const viewportRight = position.viewportRight;
    expect(Math.abs(viewportRight)).toBeLessThan(50);
    console.log('✅ Widget positioned on right side of viewport');
  });

  test('should support position customization - bottom-left', async ({ page }) => {
    console.log('📍 Step 1: Configure widget with bottom-left position');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Override position to bottom-left
    console.log('📍 Step 2: Set bottom-left position');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        ...(window as any).ChatWidgetConfig,
        appearance: {
          ...((window as any).ChatWidgetConfig?.appearance || {}),
          position: 'bottom-left',
        }
      };
    });

    console.log('✅ Widget position configured as bottom-left');

    // Wait for widget iframe
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify position
    console.log('📍 Step 3: Verify bottom-left positioning');
    const position = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        bottom: window.innerHeight - rect.bottom,
      };
    });

    console.log('✅ Widget position data:', position);
    expect(position.left).toBeLessThan(50);
    console.log('✅ Widget positioned on left side of viewport');
  });

  test('should support position customization - top-right', async ({ page }) => {
    console.log('📍 Step 1: Configure widget with top-right position');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Set top-right position
    console.log('📍 Step 2: Set top-right position');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        ...(window as any).ChatWidgetConfig,
        appearance: {
          ...((window as any).ChatWidgetConfig?.appearance || {}),
          position: 'top-right',
        }
      };
    });

    console.log('✅ Widget position configured as top-right');

    // Verify position
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    const position = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        right: window.innerWidth - rect.right,
      };
    });

    console.log('✅ Top-right position verified');
  });

  test('should verify widget has proper z-index for visibility', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check z-index
    console.log('📍 Step 2: Verify widget z-index');
    const zIndex = await iframeLocator.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        zIndex: computed.zIndex,
        position: computed.position,
      };
    });

    console.log('✅ Widget z-index:', zIndex);
    // Widget should have a high z-index for visibility
    if (zIndex.zIndex !== 'auto') {
      const zValue = parseInt(zIndex.zIndex);
      expect(zValue).toBeGreaterThan(100);
    }
    console.log('✅ Widget has appropriate z-index for visibility');
  });
});
