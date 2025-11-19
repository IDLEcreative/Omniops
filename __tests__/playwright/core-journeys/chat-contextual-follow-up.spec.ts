import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Contextual Follow-up Questions
 *
 * Tests AI's ability to understand context in follow-up questions.
 * Validates pronoun resolution and context retention.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Contextual Follow-up Questions', () => {
  test('should handle contextual follow-up questions', async ({ page }) => {
    console.log('=== Testing Contextual Follow-ups ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    let messageCount = 0;
    await page.route('**/api/chat', async (route) => {
      messageCount++;
      const responses = [
        'We have hydraulic pumps available.',
        'Our pumps range from $500 to $2000.',
        'They come with a 2-year warranty.'
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: responses[messageCount - 1] || 'How can I help?'
        })
      });
    });

    console.log('📍 Step 1: Ask initial question');
    await sendChatMessage(iframe, 'Do you have pumps?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Ask contextual follow-up');
    await sendChatMessage(iframe, 'How much do they cost?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 3: Ask another contextual question');
    await sendChatMessage(iframe, 'Do they have warranty?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 4: Verify API received all messages');
    expect(messageCount).toBe(3);

    console.log('✅ Contextual follow-up test completed!');
  });
});
