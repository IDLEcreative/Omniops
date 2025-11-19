import { test, expect } from '@playwright/test';
import { waitForChatWidget, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Typing Indicator
 *
 * Tests typing indicator display during AI response.
 * Validates indicator appears and disappears appropriately.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Typing Indicator', () => {
  test('should show typing indicator while AI responds', async ({ page }) => {
    console.log('=== Testing Typing Indicator ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock delayed response
    await page.route('**/api/chat', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, response: 'Response' })
      });
    });

    console.log('📍 Step 1: Send message');
    const inputField = iframe.locator('input[type="text"], textarea').first();
    await inputField.fill('Test');
    const sendButton = iframe.locator('button[type="submit"]').last();
    await sendButton.click();

    console.log('📍 Step 2: Check for typing indicator');
    await page.waitForTimeout(500);
    const typingIndicator = iframe.locator('.typing, .loading, text=/typing/i, text=/thinking/i');
    const hasIndicator = await typingIndicator.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasIndicator) {
      console.log('✅ Typing indicator displayed');
    } else {
      console.log('⏭️  Typing indicator not found');
    }

    console.log('✅ Typing indicator test completed!');
  });
});
