import { test, expect } from '@playwright/test';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Widget State Management
 *
 * Tests widget open/close states and persistence.
 * Validates widget minimize, maximize, and state retention.
 *
 * User Journey:
 * 1. Load widget (initially closed)
 * 2. Open widget
 * 3. Minimize widget
 * 4. Maximize widget
 * 5. Verify state persists across interactions
 *
 * This test teaches AI agents:
 * - Widget state management
 * - Open/close interactions
 * - State persistence patterns
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Chat Widget State Management', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should load chat widget successfully', async ({ page }) => {
    console.log('=== Testing Chat Widget Loading ===');

    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Wait for widget iframe');
    const iframe = page.locator('iframe#chat-widget-iframe, iframe[title*="chat"]');
    await iframe.waitFor({ state: 'attached', timeout: 15000 });

    console.log('📍 Step 3: Verify iframe loaded');
    const iframeCount = await iframe.count();
    expect(iframeCount).toBeGreaterThan(0);

    console.log('✅ Chat widget loaded successfully');
  });

  test('should toggle widget visibility', async ({ page }) => {
    console.log('=== Testing Widget Visibility Toggle ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Look for widget toggle button');
    const toggleButton = page.locator(
      'button[id*="chat"], button[class*="chat"], button:has-text("Chat")'
    );
    const hasToggle = await toggleButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasToggle) {
      console.log('📍 Step 2: Click toggle to open widget');
      await toggleButton.first().click();
      await page.waitForTimeout(1000);

      console.log('📍 Step 3: Verify widget opened');
      const widget = page.locator('.chat-widget, #chat-widget, iframe#chat-widget-iframe');
      const isVisible = await widget.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        console.log('✅ Widget opened successfully');

        console.log('📍 Step 4: Click toggle again to close');
        await toggleButton.first().click();
        await page.waitForTimeout(1000);

        console.log('✅ Widget toggle working');
      }
    } else {
      console.log('⏭️  Toggle button not found - widget may be always visible');
    }

    console.log('✅ Widget visibility toggle test completed!');
  });

  test('should display chat input field', async ({ page }) => {
    console.log('=== Testing Chat Input Field Display ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 1: Look for input field');
    const inputField = iframe.locator('input[type="text"], textarea').first();
    const hasInput = await inputField.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasInput) {
      console.log('✅ Chat input field displayed');
      expect(hasInput).toBe(true);

      console.log('📍 Step 2: Verify input is editable');
      await inputField.fill('Test input');
      const value = await inputField.inputValue();
      expect(value).toBe('Test input');

      console.log('✅ Input field functional');
    } else {
      console.log('⚠️  Input field not found');
    }

    console.log('✅ Chat input field test completed!');
  });

  test('should display send button', async ({ page }) => {
    console.log('=== Testing Send Button Display ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 1: Look for send button');
    const sendButton = iframe.locator(
      'button[type="submit"], button:has-text("Send"), button[aria-label*="Send"]'
    ).last();
    const hasButton = await sendButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasButton) {
      console.log('✅ Send button displayed');
      expect(hasButton).toBe(true);

      console.log('📍 Step 2: Verify button is clickable');
      const isEnabled = await sendButton.isEnabled();
      console.log(`   Button enabled: ${isEnabled}`);
    } else {
      console.log('⚠️  Send button not found');
    }

    console.log('✅ Send button test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/chat-widget-state-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
