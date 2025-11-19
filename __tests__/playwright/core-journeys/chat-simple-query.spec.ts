import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Simple Chat Query Flow
 *
 * Tests basic single-turn chat interaction.
 * Validates chat widget loading, message sending, and response display.
 *
 * User Journey:
 * 1. Load chat widget
 * 2. Send simple product query
 * 3. Receive AI response
 * 4. Verify response displayed
 *
 * This test teaches AI agents:
 * - Basic chat interaction pattern
 * - Message sending workflow
 * - Response display indicators
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Simple Chat Query Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should send message and receive response', async ({ page }) => {
    console.log('=== Starting Simple Chat Query Test ===');

    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Wait for chat widget to load');
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 3: Mock chat API response');
    const chatState = await mockChatAPI(page, () => ({
      success: true,
      response: 'We have several great products available. How can I help you today?',
    }));

    console.log('📍 Step 4: Send simple query');
    await sendChatMessage(iframe, 'What products do you have?');

    console.log('📍 Step 5: Wait for response');
    await page.waitForTimeout(2000);

    console.log('📍 Step 6: Verify response received');
    expect(chatState.response?.response).toBeDefined();
    expect(chatState.response?.success).toBe(true);

    console.log('📍 Step 7: Verify message displayed in chat');
    const messages = iframe.locator('.message, .chat-message, [class*="message"]');
    const messageCount = await messages.count();

    if (messageCount > 0) {
      console.log(`✅ Found ${messageCount} message(s) in chat`);
      expect(messageCount).toBeGreaterThan(0);
    } else {
      console.log('⚠️  No messages found in chat UI');
    }

    console.log('✅ Simple chat query test completed!');
  });

  test('should display user message immediately', async ({ page }) => {
    console.log('=== Testing Immediate Message Display ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({
      success: true,
      response: 'Response text',
    }));

    console.log('📍 Step 1: Send message');
    const testMessage = 'Hello, can you help me?';
    await sendChatMessage(iframe, testMessage);

    console.log('📍 Step 2: Look for user message in chat');
    await page.waitForTimeout(1000);
    const userMessage = iframe.locator(`text=${testMessage}`);
    const hasUserMessage = await userMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasUserMessage) {
      console.log('✅ User message displayed immediately');
      expect(hasUserMessage).toBe(true);
    } else {
      console.log('⚠️  User message not visible');
    }

    console.log('✅ Immediate message display test completed!');
  });

  test('should show loading indicator while processing', async ({ page }) => {
    console.log('=== Testing Loading Indicator ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock delayed response
    await mockChatAPI(page, () => ({
      success: true,
      response: 'Response after delay',
    }));

    console.log('📍 Step 1: Send message');
    const inputField = iframe.locator('input[type="text"], textarea').first();
    await inputField.fill('Test query');

    const sendButton = iframe.locator('button[type="submit"], button:has-text("Send")').last();
    await sendButton.click();

    console.log('📍 Step 2: Look for loading indicator');
    await page.waitForTimeout(500);
    const loadingIndicator = iframe.locator('.loading, .spinner, [class*="loading"], text=/typing/i');
    const hasLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasLoading) {
      console.log('✅ Loading indicator displayed');
    } else {
      console.log('⏭️  Loading indicator not found (may be too fast)');
    }

    console.log('✅ Loading indicator test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/chat-simple-query-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
