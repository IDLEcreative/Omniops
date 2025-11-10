/**
 * Chat Widget E2E Test Helpers
 *
 * Reusable utilities for chat widget testing
 */

import { Page, FrameLocator } from '@playwright/test';

export interface ChatResponse {
  success: boolean;
  response: string;
  sources?: Array<{ url: string; title: string }>;
  message_count?: number;
  messages_remaining?: number;
}

/**
 * Wait for chat widget to load
 */
export async function waitForChatWidget(page: Page, timeout = 15000): Promise<FrameLocator> {
  const iframeLocator = page.locator('iframe#chat-widget-iframe');
  await iframeLocator.waitFor({ state: 'attached', timeout });
  await page.waitForTimeout(3000); // Give widget time to initialize
  return page.frameLocator('iframe#chat-widget-iframe');
}

/**
 * Send chat message and wait for response
 */
export async function sendChatMessage(
  iframe: FrameLocator,
  message: string
): Promise<void> {
  const inputField = iframe.locator('input[type="text"], textarea').first();
  await inputField.waitFor({ state: 'visible', timeout: 10000 });
  await inputField.fill(message);

  const sendButton = iframe.locator('button[type="submit"], button[aria-label*="send" i]').first();
  await sendButton.click();

  console.log(`✅ Sent message: "${message}"`);
}

/**
 * Mock chat API with custom response
 */
export async function mockChatAPI(
  page: Page,
  responseGenerator: (message: string) => ChatResponse
): Promise<{ response: ChatResponse | null }> {
  const state = { response: null as ChatResponse | null };

  await page.route('**/api/chat', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('🔍 Chat request:', { message: requestData.message });

    const response = responseGenerator(requestData.message);
    state.response = response;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });

  return state;
}

/**
 * Mock demo chat API
 */
export async function mockDemoChatAPI(
  page: Page,
  domain: string
): Promise<{ response: ChatResponse | null }> {
  return mockChatAPI(page, (message) => ({
    success: true,
    response: `Based on the content from ${domain}, I can help you with information about the website. The site contains various pages and content that I've analyzed. What would you like to know more about?`,
    message_count: 1,
    messages_remaining: 19
  }));
}
