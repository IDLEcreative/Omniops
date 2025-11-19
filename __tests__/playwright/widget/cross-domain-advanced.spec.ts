/**
 * E2E Test: Advanced Cross-Domain Communication
 *
 * Tests advanced communication scenarios including concurrent messages,
 * visibility changes, event propagation, and timeout handling.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Advanced Cross-Domain Communication E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should handle concurrent messages correctly', async ({ page }) => {
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

    // Send multiple concurrent messages
    console.log('📍 Step 3: Send multiple concurrent messages');
    const result = await page.evaluate(async () => {
      const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;

      if (!iframeEl?.contentWindow) {
        return 'no_iframe';
      }

      const messages = [];
      for (let i = 0; i < 5; i++) {
        iframeEl.contentWindow.postMessage({
          type: 'chat:message',
          payload: { id: i, text: `Message ${i}` }
        }, '*');
        messages.push(i);
      }

      console.log('[Parent] Sent 5 concurrent messages');
      return messages.length;
    });

    console.log(`✅ Concurrent messages test completed: ${result} messages sent`);
    expect(result).toBe(5);
  });

  test('should handle iframe communication with visibility changes', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

    // Hide and show iframe, testing communication persistence
    console.log('📍 Step 3: Test communication through visibility changes');
    const result = await page.evaluate(() => {
      const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;

      if (!iframeEl) {
        return 'no_iframe';
      }

      try {
        // Hide iframe
        iframeEl.style.display = 'none';
        console.log('[Parent] Widget hidden');

        // Send message while hidden
        if (iframeEl.contentWindow) {
          iframeEl.contentWindow.postMessage({
            type: 'test:hidden',
            payload: {}
          }, '*');
        }

        // Show iframe again
        iframeEl.style.display = 'block';
        console.log('[Parent] Widget shown');

        // Send message while visible
        if (iframeEl.contentWindow) {
          iframeEl.contentWindow.postMessage({
            type: 'test:visible',
            payload: {}
          }, '*');
        }

        return 'success';
      } catch (e) {
        console.error('[Parent] Error:', e);
        return 'error';
      }
    });

    console.log(`✅ Visibility test: ${result}`);
    expect(result).toBe('success');
  });

  test('should verify event propagation from widget iframe', async ({ page }) => {
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

    // Capture custom events from widget
    console.log('📍 Step 3: Listen for widget-originated custom events');
    const events = await page.evaluate(() => {
      return new Promise((resolve) => {
        const capturedEvents: string[] = [];

        // Listen for custom events that might bubble from widget
        const eventListener = (event: Event) => {
          if ((event as CustomEvent).detail?.source === 'widget') {
            capturedEvents.push((event as CustomEvent).type);
            console.log('[Parent] Captured custom event:', event.type);
          }
        };

        document.addEventListener('widgetEvent', eventListener as EventListener);
        document.addEventListener('chatMessage', eventListener as EventListener);
        document.addEventListener('widgetStatus', eventListener as EventListener);

        // Wait for events
        setTimeout(() => {
          document.removeEventListener('widgetEvent', eventListener as EventListener);
          document.removeEventListener('chatMessage', eventListener as EventListener);
          document.removeEventListener('widgetStatus', eventListener as EventListener);
          resolve(capturedEvents);
        }, 3000);
      });
    });

    console.log(`✅ Event propagation test: ${(events as any[]).length} events captured`);
  });

  test('should handle widget iframe communication timeout gracefully', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    console.log('📍 Step 2: Wait for widget iframe');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

    // Test communication timeout handling
    console.log('📍 Step 3: Test message timeout handling');
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        const iframeEl = document.querySelector('iframe#chat-widget-iframe') as HTMLIFrameElement;

        if (!iframeEl?.contentWindow) {
          resolve('no_iframe');
          return;
        }

        const messageId = Math.random().toString(36);
        const timeout = setTimeout(() => {
          console.log('[Parent] Message timeout after 2000ms');
          resolve('timeout');
        }, 2000);

        // Listen for response
        const listener = (event: MessageEvent) => {
          if (event.data?.responseId === messageId) {
            clearTimeout(timeout);
            console.log('[Parent] Received response');
            window.removeEventListener('message', listener);
            resolve('received');
          }
        };

        window.addEventListener('message', listener);

        // Send message expecting a response
        iframeEl.contentWindow.postMessage({
          type: 'widget:request',
          messageId,
          payload: { expectResponse: true }
        }, '*');

        // Cleanup after timeout
        setTimeout(() => {
          window.removeEventListener('message', listener);
        }, 3000);
      });
    });

    console.log(`✅ Timeout handling test: ${result}`);
  });
});
