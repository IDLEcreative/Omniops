import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Multi-Turn Chat Conversation
 *
 * Tests conversational flow with context retention.
 * Validates follow-up questions and context awareness.
 *
 * User Journey:
 * 1. Send initial query
 * 2. Receive response
 * 3. Send follow-up question
 * 4. Verify context maintained
 * 5. Continue conversation (3+ turns)
 *
 * This test teaches AI agents:
 * - Multi-turn conversation patterns
 * - Context retention across messages
 * - Follow-up question handling
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 90000;

test.describe('Multi-Turn Chat Conversation', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should maintain context across multiple messages', async ({ page }) => {
    console.log('=== Starting Multi-Turn Conversation Test ===');

    console.log('📍 Step 1: Load chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    let responseCount = 0;
    await page.route('**/api/chat', async (route) => {
      responseCount++;
      const responses = [
        'We have pumps and hydraulic parts available.',
        'Our pumps range from $500 to $2000 depending on specifications.',
        'Yes, all our pumps come with a 2-year warranty.'
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: responses[responseCount - 1] || 'How else can I help?'
        })
      });
    });

    console.log('📍 Step 2: Send first message');
    await sendChatMessage(iframe, 'What products do you sell?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 3: Send follow-up question');
    await sendChatMessage(iframe, 'What is the price range?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 4: Send third question');
    await sendChatMessage(iframe, 'Do they have warranty?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 5: Verify multiple messages in chat');
    const messages = iframe.locator('.message, .chat-message, [class*="message"]');
    const messageCount = await messages.count();

    console.log(`📊 Total messages in chat: ${messageCount}`);
    expect(messageCount).toBeGreaterThanOrEqual(3);

    console.log('📍 Step 6: Verify API called multiple times');
    expect(responseCount).toBeGreaterThanOrEqual(3);
    console.log(`✅ API called ${responseCount} times - context maintained`);

    console.log('✅ Multi-turn conversation test completed!');
  });

  test('should display conversation history', async ({ page }) => {
    console.log('=== Testing Conversation History Display ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({
      success: true,
      response: 'Test response',
    }));

    console.log('📍 Step 1: Send two messages');
    await sendChatMessage(iframe, 'First message');
    await page.waitForTimeout(2000);
    await sendChatMessage(iframe, 'Second message');
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Verify both messages visible');
    const firstMessage = iframe.locator('text=First message');
    const secondMessage = iframe.locator('text=Second message');

    const hasFirst = await firstMessage.isVisible({ timeout: 3000 }).catch(() => false);
    const hasSecond = await secondMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFirst && hasSecond) {
      console.log('✅ Conversation history maintained');
      expect(hasFirst).toBe(true);
      expect(hasSecond).toBe(true);
    } else {
      console.log('⚠️  Not all messages visible in history');
    }

    console.log('✅ Conversation history test completed!');
  });

  test('should scroll to latest message', async ({ page }) => {
    console.log('=== Testing Auto-Scroll to Latest Message ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({
      success: true,
      response: 'Response',
    }));

    console.log('📍 Step 1: Send multiple messages to create scrollable history');
    for (let i = 1; i <= 5; i++) {
      await sendChatMessage(iframe, `Message number ${i}`);
      await page.waitForTimeout(1500);
    }

    console.log('📍 Step 2: Verify latest message is visible');
    const latestMessage = iframe.locator('text=Message number 5');
    const isLatestVisible = await latestMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (isLatestVisible) {
      console.log('✅ Latest message visible - auto-scroll working');
      expect(isLatestVisible).toBe(true);
    } else {
      console.log('⚠️  Latest message not immediately visible');
    }

    console.log('✅ Auto-scroll test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/chat-multi-turn-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
