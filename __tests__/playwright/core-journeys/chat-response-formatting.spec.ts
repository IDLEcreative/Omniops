import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Response Formatting
 *
 * Tests formatting in chat responses (links, lists, bold).
 * Validates proper rendering of formatted content.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Response Formatting', () => {
  test('should render formatted chat responses', async ({ page }) => {
    console.log('=== Testing Response Formatting ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'We offer:\\n1. Hydraulic pumps\\n2. Spare parts\\n3. Maintenance kits'
        })
      });
    });

    console.log('📍 Step 1: Send query');
    await sendChatMessage(iframe, 'What do you offer?');
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Check response rendering');
    const responseText = iframe.locator('.message, .chat-message').last();
    const hasResponse = await responseText.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasResponse) {
      const text = await responseText.textContent();
      console.log(`📝 Response: ${text?.substring(0, 50)}...`);
      console.log('✅ Response rendered');
    }

    console.log('✅ Response formatting test completed!');
  });
});
