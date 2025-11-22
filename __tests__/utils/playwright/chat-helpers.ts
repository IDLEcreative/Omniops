import { Page, FrameLocator } from '@playwright/test';

/**
 * Chat Helper Functions for Playwright E2E Tests
 *
 * Reusable utilities for interacting with the chat widget across tests.
 */

/**
 * Wait for chat widget iframe to load and return frame locator
 */
export async function waitForChatWidget(page: Page, timeout = 15000): Promise<FrameLocator> {
  console.log('📍 Waiting for chat widget to load...');

  const widgetIframe = page.locator('iframe#chat-widget-iframe, iframe[title*="chat" i]');

  // First wait for iframe to be attached to DOM
  await widgetIframe.waitFor({ state: 'attached', timeout });
  console.log('✅ Chat widget iframe attached to DOM');

  // Wait for iframe to load (onload event will set display: block)
  // We use a custom wait that checks for visibility since iframe.onload sets display: block
  await page.waitForFunction(
    () => {
      const iframe = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;
      return iframe && iframe.style.display !== 'none';
    },
    { timeout }
  );
  console.log('✅ Chat widget iframe visible');

  // Allow widget to fully initialize
  await page.waitForTimeout(3000);

  const frameLocator = page.frameLocator('iframe#chat-widget-iframe, iframe[title*="chat" i]');

  // Widget starts minimized - click the chat button to open it
  console.log('📍 Opening chat widget...');
  const chatButton = frameLocator.locator('button[aria-label*="chat" i], button[class*="chat-button"], button').first();
  await chatButton.waitFor({ state: 'visible', timeout: 5000 });
  // Use force:true to click even if button is animating
  await chatButton.click({ force: true });
  await page.waitForTimeout(2000); // Wait for open animation

  console.log('✅ Chat widget opened and ready');
  return frameLocator;
}

/**
 * Send a message in the chat widget
 */
export async function sendChatMessage(iframe: FrameLocator, message: string): Promise<void> {
  console.log(`📤 Sending message: "${message}"`);

  const inputField = iframe.locator('input[type="text"], textarea').first();
  await inputField.waitFor({ state: 'visible', timeout: 10000 });
  await inputField.fill(message);

  // Look for send button - try multiple selectors
  const sendButton = iframe.locator(
    'button[type="submit"], button:has-text("Send"), button[aria-label*="Send" i], button:has(img)'
  ).last(); // Use .last() to get the send button (last button in input area)

  await sendButton.waitFor({ state: 'visible', timeout: 10000 });

  // Wait a bit for any animations or state updates
  await iframe.locator('body').evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

  await sendButton.click({ force: true }); // Force click in case there's an overlay

  console.log('✅ Message sent');
}

/**
 * Mock chat API and track responses
 */
export async function mockChatAPI(
  page: Page,
  responseGenerator: () => { success: boolean; response: string; sources?: Array<{ url: string; title: string }> }
): Promise<{ response: any }> {
  console.log('🔧 Setting up chat API mock...');

  const state = { response: null as any };

  await page.route('**/api/chat', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('🔍 Chat request received:', requestData.message?.substring(0, 50));

    const responseData = responseGenerator();
    state.response = responseData;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });

  console.log('✅ Chat API mock ready');
  return state;
}

/**
 * Mock demo chat API (for landing page demo flow)
 */
export async function mockDemoChatAPI(page: Page, demoSite: string): Promise<{ response: any }> {
  console.log('🔧 Setting up demo chat API mock...');

  const state = { response: null as any };

  await page.route('**/api/demo/chat', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('🔍 Demo chat request:', requestData.message?.substring(0, 50));

    const responseData = {
      success: true,
      response: `Based on the content from ${demoSite}, I can help you with information about their products and services.`,
      message_count: 1,
      messages_remaining: 19
    };

    state.response = responseData;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData)
    });
  });

  console.log('✅ Demo chat API mock ready');
  return state;
}
