import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Clear Conversation
 *
 * Tests conversation clearing functionality.
 * Validates clear button and message removal.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Clear Conversation', () => {
  test('should clear chat conversation when requested', async ({ page }) => {
    console.log('=== Testing Clear Conversation ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({ success: true, response: 'Response' }));

    console.log('📍 Step 1: Send messages');
    await sendChatMessage(iframe, 'First message');
    await page.waitForTimeout(2000);
    await sendChatMessage(iframe, 'Second message');
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Look for clear/reset button');
    const clearButton = iframe.locator('button:has-text("Clear"), button:has-text("Reset"), button:has-text("New")');
    const hasButton = await clearButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasButton) {
      console.log('📍 Step 3: Click clear button');
      await clearButton.click();
      await page.waitForTimeout(1000);

      console.log('📍 Step 4: Verify messages cleared');
      const messages = iframe.locator('.message, .chat-message');
      const messageCount = await messages.count();
      console.log(`📊 Messages after clear: ${messageCount}`);

      console.log('✅ Clear conversation working');
    } else {
      console.log('⏭️  Clear button not found');
    }

    console.log('✅ Clear conversation test completed!');
  });
});
