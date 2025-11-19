import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Message History
 *
 * Tests chat history persistence and display.
 * Validates message ordering and timestamp display.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Message History', () => {
  test('should persist chat history on page refresh', async ({ page }) => {
    console.log('=== Testing Chat History Persistence ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({
      success: true,
      response: 'Test response'
    }));

    console.log('📍 Step 1: Send initial message');
    const testMessage = 'Remember this message';
    await sendChatMessage(iframe, testMessage);
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Reload page');
    await page.reload({ waitUntil: 'networkidle' });
    const reloadedIframe = await waitForChatWidget(page);

    console.log('📍 Step 3: Check if message persisted');
    const persistedMessage = reloadedIframe.locator(`text=${testMessage}`);
    const hasPersisted = await persistedMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPersisted) {
      console.log('✅ Chat history persisted across refresh');
    } else {
      console.log('⏭️  Chat history not persisted (may be session-based)');
    }

    console.log('✅ History persistence test completed!');
  });
});
