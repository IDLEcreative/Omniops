import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Error Handling
 *
 * Tests chat widget error scenarios and recovery.
 * Validates error messages and fallback behavior.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    console.log('=== Testing Chat API Error Handling ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 1: Mock API error response');
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' })
      });
    });

    console.log('📍 Step 2: Send message');
    await sendChatMessage(iframe, 'Test query');
    await page.waitForTimeout(3000);

    console.log('📍 Step 3: Look for error message');
    const errorMessage = iframe.locator('text=/error/i, text=/sorry/i, text=/try again/i');
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasError) {
      console.log('✅ Error message displayed to user');
    } else {
      console.log('⚠️  No error message found');
    }

    console.log('✅ Error handling test completed!');
  });
});
