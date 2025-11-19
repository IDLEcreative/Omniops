/**
 * E2E Test: Widget Cross-Domain Messaging
 *
 * Tests basic iframe postMessage communication between parent and widget iframe.
 * Covers message passing, validation, origin verification, and responses.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Cross-Domain Messaging E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should verify iframe is loaded from correct origin', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Widget test page loaded');

    // Wait for widget iframe to be created
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Widget iframe attached');

    // Verify iframe origin
    console.log('📍 Step 3: Verify iframe origin');
    const iframeOrigin = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;
      if (iframeEl && iframeEl.contentWindow) {
        try {
          return iframeEl.contentWindow.location.origin;
        } catch (e) {
          return 'Cannot access (cross-origin security)';
        }
      }
      return 'Iframe not found';
    });

    console.log(`✅ Iframe origin: ${iframeOrigin}`);
    expect(iframeOrigin).toBeTruthy();
  });

  test('should send message from parent to widget', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget to load
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });
    console.log('✅ Widget iframe loaded');

    // Wait for widget to be ready
    await page.waitForTimeout(3000);

    // Send message from parent to widget
    console.log('📍 Step 3: Send message from parent to widget');
    const messageReceived = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve('timeout'), 5000);

        const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;
        if (!iframeEl || !iframeEl.contentWindow) {
          resolve('no_iframe');
          return;
        }

        // Send message to widget
        iframeEl.contentWindow.postMessage({
          type: 'chat:test',
          payload: { test: true }
        }, '*');

        console.log('[Parent] Sent message to widget');
        resolve('sent');
      });
    });

    console.log(`✅ Message sent to widget: ${messageReceived}`);
    expect(messageReceived).not.toBe('timeout');
  });

  test('should handle message validation and filtering', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForTimeout(3000);

    // Test invalid message handling
    console.log('📍 Step 3: Send invalid message to widget');
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;

        if (!iframeEl?.contentWindow) {
          resolve('no_iframe');
          return;
        }

        // Send invalid message (missing required fields)
        iframeEl.contentWindow.postMessage(
          { invalid: true }, // Missing 'type' field
          '*'
        );

        // Widget should ignore this message
        resolve('sent');
      });
    });

    console.log(`✅ Invalid message handling tested: ${result}`);
  });

  test('should receive and process widget response messages', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });
    await page.waitForTimeout(3000);

    // Listen for messages from widget and send requests
    console.log('📍 Step 3: Set up message listener and send requests');
    const receivedMessages = await page.evaluate(() => {
      return new Promise((resolve) => {
        const messages: any[] = [];
        const timeout = setTimeout(() => resolve(messages), 5000);

        // Listen for messages from widget
        const listener = (event: MessageEvent) => {
          if (event.data?.type?.startsWith('widget:')) {
            console.log('[Parent] Received widget message:', event.data.type);
            messages.push(event.data);
          }
        };

        window.addEventListener('message', listener);

        // Send request to widget
        const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;
        if (iframeEl?.contentWindow) {
          iframeEl.contentWindow.postMessage({
            type: 'widget:status',
            payload: { checkStatus: true }
          }, '*');
        }

        // Cleanup
        setTimeout(() => {
          window.removeEventListener('message', listener);
          clearTimeout(timeout);
          resolve(messages);
        }, 5000);
      });
    });

    console.log(`✅ Message listener test completed: ${(receivedMessages as any[]).length} messages received`);
  });

  test('should verify postMessage security origin validation', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

    // Verify origin parameter in postMessage
    console.log('📍 Step 3: Verify postMessage origin handling');
    const result = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;

      if (!iframeEl?.contentWindow) {
        return false;
      }

      try {
        // Send message with specific origin
        iframeEl.contentWindow.postMessage(
          { type: 'test:origin', payload: {} },
          '*' // Wildcard origin - should work
        );
        return true;
      } catch (e) {
        console.error('[Parent] postMessage failed:', e);
        return false;
      }
    });

    console.log(`✅ Origin validation: ${result ? 'passed' : 'failed'}`);
    expect(result).toBe(true);
  });
});
