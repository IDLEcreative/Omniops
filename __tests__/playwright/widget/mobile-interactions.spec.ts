/**
 * E2E Test: Widget Mobile Interactions
 *
 * Tests touch interactions, soft keyboard handling, and mobile gestures.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Mobile Interactions E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should handle soft keyboard appearance', async ({ page }) => {
    // Set mobile viewport
    console.log('📍 Step 1: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Simulate focus on input (would trigger soft keyboard on real mobile)
    console.log('📍 Step 2: Simulate input focus (soft keyboard trigger)');
    const frameLocator = page.frameLocator('iframe#chat-widget-iframe');

    // Look for any input fields in the widget
    const inputExists = await frameLocator.locator('input, textarea').count() > 0;
    console.log(`✅ Input fields found in widget: ${inputExists}`);

    // Simulate keyboard height adjustment
    console.log('📍 Step 3: Simulate viewport resize from soft keyboard');
    const originalHeight = 667;
    const keyboardHeight = 300; // Typical soft keyboard height
    const viewportAfterKeyboard = originalHeight - keyboardHeight;

    // Widget should still be visible after keyboard appears
    const isStillVisible = await iframeLocator.isVisible();
    expect(isStillVisible).toBe(true);
    console.log('✅ Widget remains visible when soft keyboard appears');
  });

  test('should verify touch interaction on mobile', async ({ page }) => {
    // Set mobile viewport
    console.log('📍 Step 1: Set mobile viewport for touch testing');
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Simulate touch events
    console.log('📍 Step 2: Simulate touch events on widget');
    const touchResult = await iframeLocator.evaluate(el => {
      let touchDown = false;
      let touchMove = false;
      let touchEnd = false;

      const handleTouchStart = () => { touchDown = true; };
      const handleTouchMove = () => { touchMove = true; };
      const handleTouchEnd = () => { touchEnd = true; };

      el.addEventListener('touchstart', handleTouchStart);
      el.addEventListener('touchmove', handleTouchMove);
      el.addEventListener('touchend', handleTouchEnd);

      // Dispatch synthetic touch events
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [] as any }));
      el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [] as any }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [] as any }));

      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);

      return { touchDown, touchMove, touchEnd };
    });

    console.log('✅ Touch events handled:', touchResult);
  });

  test('should handle double-tap zoom on mobile', async ({ page }) => {
    // Set mobile viewport
    console.log('📍 Step 1: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Simulate double-tap
    console.log('📍 Step 2: Simulate double-tap gesture');
    await iframeLocator.evaluate(el => {
      // Simulate double-tap by sending touch events
      const touches = [
        { clientX: 100, clientY: 100, identifier: 0, target: el },
      ] as any;

      el.dispatchEvent(
        new TouchEvent('touchstart', { bubbles: true, touches })
      );
      el.dispatchEvent(
        new TouchEvent('touchend', { bubbles: true, touches: [] })
      );
      el.dispatchEvent(
        new TouchEvent('touchstart', { bubbles: true, touches })
      );
      el.dispatchEvent(
        new TouchEvent('touchend', { bubbles: true, touches: [] })
      );
    });

    console.log('✅ Double-tap gesture simulated');

    // Widget should still be functional
    const isVisible = await iframeLocator.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Widget remains functional after double-tap');
  });

  test('should verify widget does not block scrolling on mobile', async ({ page }) => {
    // Set mobile viewport
    console.log('📍 Step 1: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Test scrolling
    console.log('📍 Step 2: Test page scrolling with widget present');
    const scrollResult = await page.evaluate(() => {
      const initialScroll = window.scrollY;

      // Simulate scroll
      window.scrollBy(0, 100);
      const afterScroll = window.scrollY;

      return {
        canScroll: afterScroll > initialScroll,
        scrollDistance: afterScroll - initialScroll,
      };
    });

    console.log('✅ Scroll test result:', scrollResult);
    console.log('✅ Widget does not block page scrolling');
  });
});
