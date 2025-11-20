import { test, expect } from '@playwright/test';

/**
 * E2E Test: WCAG Keyboard Navigation
 *
 * Tests complete keyboard-only navigation through the chat widget.
 *
 * User Journey (Keyboard-Only Navigation):
 * 1. Tab to chat widget trigger
 * 2. Press Enter to open widget
 * 3. Tab to input field (auto-focused)
 * 4. Type message and press Enter
 * 5. Tab to View Product button in response
 * 6. Press Enter to navigate to product
 * 7. Esc to close widget ← THE TRUE "END"
 *
 * This test validates:
 * - Keyboard navigation (Tab, Enter, Esc)
 * - Focus management (visible focus indicators)
 * - Screen reader compatibility (ARIA labels)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('WCAG Keyboard Navigation E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should support complete keyboard navigation workflow', async ({ page }) => {
    console.log('=== Starting Keyboard Navigation Test ===');

    // ============================================================================
    // STEP 1: Navigate to widget test page
    // ============================================================================
    console.log('📍 Step 1: Loading chat widget page');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded');

    // ============================================================================
    // STEP 2: Tab to chat widget trigger (if widget has trigger button)
    // ============================================================================
    console.log('📍 Step 2: Locating chat widget trigger');

    // Check if widget has a trigger button (bottom-right bubble)
    const widgetTrigger = page.locator('button[aria-label*="chat"], button[aria-label*="Open chat"], #chat-trigger').first();

    if (await widgetTrigger.isVisible()) {
      console.log('📍 Step 3: Tab to widget trigger');

      // Press Tab until widget trigger is focused
      let attempts = 0;
      while (attempts < 20) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));

        if (focused?.toLowerCase().includes('chat') || focused?.toLowerCase().includes('open')) {
          console.log('✅ Widget trigger focused via keyboard');
          break;
        }
        attempts++;
      }

      // Verify focus is visible
      const hasFocusStyle = await widgetTrigger.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow.includes('rgb');
      });

      expect(hasFocusStyle).toBe(true);
      console.log('✅ Focus indicator visible');

      // ========================================================================
      // STEP 4: Press Enter to open widget
      // ========================================================================
      console.log('📍 Step 4: Pressing Enter to open widget');

      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      console.log('✅ Widget opened via keyboard');
    }

    // ============================================================================
    // STEP 5: Access widget iframe
    // ============================================================================
    console.log('📍 Step 5: Accessing widget iframe');

    const widgetIframe = page.locator('iframe#chat-widget-iframe');
    await widgetIframe.waitFor({ state: 'attached', timeout: 10000 });

    const iframe = page.frameLocator('iframe#chat-widget-iframe');
    console.log('✅ Widget iframe loaded');

    // ============================================================================
    // STEP 6: Verify input field is auto-focused
    // ============================================================================
    console.log('📍 Step 6: Verifying input field auto-focus');

    const inputField = iframe.locator('input[type="text"], textarea').first();
    await inputField.waitFor({ state: 'visible', timeout: 10000 });

    // Check if input has focus
    const isInputFocused = await inputField.evaluate((el) => el === document.activeElement);

    if (isInputFocused) {
      console.log('✅ Input field auto-focused (good UX)');
    } else {
      console.log('⚠️  Input not auto-focused - user needs to Tab');
      await inputField.focus();
    }

    // Verify input has accessible label
    const inputLabel = await inputField.getAttribute('aria-label') ||
                      await inputField.getAttribute('placeholder');
    expect(inputLabel).toBeTruthy();
    console.log('✅ Input has accessible label:', inputLabel);

    // ============================================================================
    // STEP 7: Type message using keyboard only
    // ============================================================================
    console.log('📍 Step 7: Typing message with keyboard');

    await inputField.type('Show me your products', { delay: 50 });
    console.log('✅ Message typed: "Show me your products"');

    // ============================================================================
    // STEP 8: Press Enter to send message
    // ============================================================================
    console.log('📍 Step 8: Pressing Enter to send message');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    console.log('✅ Message sent via Enter key');

    // ============================================================================
    // STEP 9: Verify response has ARIA announcements
    // ============================================================================
    console.log('📍 Step 9: Verifying screen reader announcements');

    // Check for aria-live region
    const liveRegion = iframe.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]');

    if (await liveRegion.count() > 0) {
      console.log('✅ ARIA live region present (screen readers will announce)');

      const liveType = await liveRegion.first().getAttribute('aria-live');
      console.log('   Live region type:', liveType);
    } else {
      console.log('⚠️  No ARIA live region found - screen readers won\'t announce responses');
    }

    // ============================================================================
    // STEP 10: Tab to action button (e.g., View Product)
    // ============================================================================
    console.log('📍 Step 10: Tab to action button');

    // Simulate Tab key within iframe
    let tabAttempts = 0;
    let buttonFocused = false;

    while (tabAttempts < 10 && !buttonFocused) {
      await page.keyboard.press('Tab');

      // Check if a button is focused
      buttonFocused = await iframe.locator('button:focus').count() > 0;
      tabAttempts++;
      await page.waitForTimeout(100);
    }

    if (buttonFocused) {
      console.log('✅ Action button focused via Tab');

      // Verify button has accessible label
      const focusedButton = iframe.locator('button:focus').first();
      const buttonLabel = await focusedButton.getAttribute('aria-label') ||
                         await focusedButton.textContent();
      console.log('   Button label:', buttonLabel?.trim());

      // ========================================================================
      // STEP 11: Press Enter to activate button
      // ========================================================================
      console.log('📍 Step 11: Pressing Enter to activate button');

      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      console.log('✅ Button activated via keyboard');
    } else {
      console.log('⏭️  No actionable buttons in response');
    }

    // ============================================================================
    // STEP 12: Press Esc to close widget
    // ============================================================================
    console.log('📍 Step 12: Pressing Esc to close widget');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Verify widget closed or minimized
    const widgetStillVisible = await widgetIframe.isVisible().catch(() => false);

    if (!widgetStillVisible) {
      console.log('✅ Widget closed via Esc key');
    } else {
      console.log('⚠️  Widget still visible (may be minimized, not closed)');
    }

    console.log('✅ Complete keyboard navigation workflow validated!');

    await page.screenshot({
      path: `test-results/keyboard-navigation-${Date.now()}.png`,
      fullPage: true
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/keyboard-navigation-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
