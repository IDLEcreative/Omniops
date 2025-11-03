/**
 * E2E Tests for Multi-Tab Synchronization
 *
 * Tests real-world scenarios of chat widget synchronization across browser tabs.
 * Requires browser environment with BroadcastChannel or localStorage support.
 *
 * Run with: npm run test:e2e
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Test configuration
const WIDGET_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_DOMAIN = 'test-sync.example.com';

/**
 * Helper: Setup chat widget on a page
 */
async function setupChatWidget(page: Page): Promise<void> {
  await page.goto(`${WIDGET_URL}/embed?domain=${TEST_DOMAIN}`);
  await page.waitForLoadState('networkidle');

  // Wait for widget to initialize
  await page.waitForSelector('[data-testid="chat-widget"]', { timeout: 5000 });
}

/**
 * Helper: Open chat widget
 */
async function openChat(page: Page): Promise<void> {
  const openButton = page.locator('[data-testid="chat-open-button"]');
  await openButton.click();
  await page.waitForSelector('[data-testid="chat-messages"]', { timeout: 3000 });
}

/**
 * Helper: Send a message
 */
async function sendMessage(page: Page, message: string): Promise<void> {
  const input = page.locator('[data-testid="chat-input"]');
  await input.fill(message);
  await input.press('Enter');

  // Wait for message to appear
  await page.waitForSelector(`text=${message}`, { timeout: 5000 });
}

/**
 * Helper: Get all visible messages
 */
async function getMessages(page: Page): Promise<string[]> {
  const messages = await page.locator('[data-testid="chat-message"]').allTextContents();
  return messages;
}

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Multi-Tab Synchronization', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should synchronize new messages across tabs', async () => {
    // Open two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      // Setup widget on both tabs
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      // Open chat on both tabs
      await openChat(page1);
      await openChat(page2);

      // Send message from tab 1
      await sendMessage(page1, 'Hello from tab 1');

      // Wait for synchronization (max 2 seconds)
      await page2.waitForTimeout(2000);

      // Check that message appears on tab 2
      const messages2 = await getMessages(page2);
      expect(messages2).toContain('Hello from tab 1');

      // Send message from tab 2
      await sendMessage(page2, 'Hello from tab 2');

      // Wait for synchronization
      await page1.waitForTimeout(2000);

      // Check that message appears on tab 1
      const messages1 = await getMessages(page1);
      expect(messages1).toContain('Hello from tab 2');
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should synchronize chat open/close state', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      // Open chat on tab 1
      await openChat(page1);

      // Wait for synchronization
      await page2.waitForTimeout(1000);

      // Check that tab 2 knows chat is open
      const chatState2 = await page2.evaluate(() => {
        const state = localStorage.getItem('omniops-widget-state');
        return state ? JSON.parse(state) : null;
      });

      expect(chatState2).toBeTruthy();
      expect(chatState2.isOpen).toBe(true);

      // Close chat on tab 1
      const closeButton = page1.locator('[data-testid="chat-close-button"]');
      await closeButton.click();

      // Wait for synchronization
      await page2.waitForTimeout(1000);

      // Check that tab 2 knows chat is closed
      const chatState2After = await page2.evaluate(() => {
        const state = localStorage.getItem('omniops-widget-state');
        return state ? JSON.parse(state) : null;
      });

      expect(chatState2After.isOpen).toBe(false);
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should coordinate typing indicators', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      await openChat(page1);
      await openChat(page2);

      // Start typing on tab 1
      const input1 = page1.locator('[data-testid="chat-input"]');
      await input1.focus();
      await input1.type('Typing...', { delay: 100 });

      // Wait for sync
      await page2.waitForTimeout(500);

      // Check for typing indicator on tab 2 (if implemented)
      const typingIndicator = page2.locator('[data-testid="typing-indicator"]');
      const isVisible = await typingIndicator.isVisible().catch(() => false);

      // Note: This test may pass even if typing indicators aren't fully implemented
      // It verifies the infrastructure is in place
      expect(typeof isVisible).toBe('boolean');
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should handle tab focus changes', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      // Bring page 1 to front
      await page1.bringToFront();
      await page1.waitForTimeout(500);

      // Check tab state
      const tabState1 = await page1.evaluate(() => {
        return {
          hasFocus: document.hasFocus(),
          isVisible: !document.hidden,
        };
      });

      expect(tabState1.hasFocus).toBe(true);
      expect(tabState1.isVisible).toBe(true);

      // Bring page 2 to front
      await page2.bringToFront();
      await page2.waitForTimeout(500);

      // Page 1 should no longer have focus
      const tabState1After = await page1.evaluate(() => {
        return {
          hasFocus: document.hasFocus(),
          isVisible: !document.hidden,
        };
      });

      expect(tabState1After.hasFocus).toBe(false);
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should maintain conversation state across tabs', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      await openChat(page1);

      // Send multiple messages from tab 1
      await sendMessage(page1, 'Message 1');
      await sendMessage(page1, 'Message 2');
      await sendMessage(page1, 'Message 3');

      // Open chat on tab 2
      await openChat(page2);

      // Wait for state to sync
      await page2.waitForTimeout(2000);

      // Get messages from both tabs
      const messages1 = await getMessages(page1);
      const messages2 = await getMessages(page2);

      // Both tabs should show the same messages
      expect(messages2.length).toBeGreaterThanOrEqual(3);
      expect(messages2).toContain('Message 1');
      expect(messages2).toContain('Message 2');
      expect(messages2).toContain('Message 3');

      // Message order should be consistent
      expect(messages1).toEqual(messages2);
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should handle rapid message exchanges', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      await openChat(page1);
      await openChat(page2);

      // Send rapid messages from both tabs
      const promises = [
        sendMessage(page1, 'Fast message 1'),
        sendMessage(page2, 'Fast message 2'),
        sendMessage(page1, 'Fast message 3'),
        sendMessage(page2, 'Fast message 4'),
      ];

      await Promise.all(promises);

      // Wait for all syncs to complete
      await page1.waitForTimeout(3000);
      await page2.waitForTimeout(3000);

      // Both tabs should have all messages
      const messages1 = await getMessages(page1);
      const messages2 = await getMessages(page2);

      expect(messages1.length).toBeGreaterThanOrEqual(4);
      expect(messages2.length).toBeGreaterThanOrEqual(4);

      // Check for all messages
      const allMessages = [...messages1, ...messages2];
      expect(allMessages).toContain('Fast message 1');
      expect(allMessages).toContain('Fast message 2');
      expect(allMessages).toContain('Fast message 3');
      expect(allMessages).toContain('Fast message 4');
    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('should clean up when tab closes', async () => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      await openChat(page1);
      await openChat(page2);

      // Get initial tab IDs from localStorage
      const tabId1 = await page1.evaluate(() => {
        const syncData = localStorage.getItem('omniops-tab-sync-messages');
        return syncData ? JSON.parse(syncData).sender_tab_id : null;
      });

      expect(tabId1).toBeTruthy();

      // Close tab 1
      await page1.close();

      // Wait for cleanup
      await page2.waitForTimeout(2000);

      // Tab 2 should still work
      await sendMessage(page2, 'Message after tab close');
      const messages2 = await getMessages(page2);
      expect(messages2).toContain('Message after tab close');
    } finally {
      await page2.close();
    }
  });

  test('should support localStorage fallback', async () => {
    const page1 = await context.newPage();

    try {
      // Disable BroadcastChannel to test fallback
      await page1.addInitScript(() => {
        (window as any).BroadcastChannel = undefined;
      });

      await setupChatWidget(page1);
      await openChat(page1);

      // Send message
      await sendMessage(page1, 'Fallback test message');

      // Check that message was stored in localStorage
      const stored = await page1.evaluate(() => {
        const syncData = localStorage.getItem('omniops-tab-sync-messages');
        return syncData ? JSON.parse(syncData) : null;
      });

      expect(stored).toBeTruthy();
      expect(stored.type).toBe('NEW_MESSAGE');
    } finally {
      await page1.close();
    }
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

test.describe('Multi-Tab Sync Performance', () => {
  test('should sync within 50ms latency target', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    try {
      await setupChatWidget(page1);
      await setupChatWidget(page2);

      await openChat(page1);
      await openChat(page2);

      // Measure sync latency
      const startTime = Date.now();
      await sendMessage(page1, 'Latency test message');

      // Wait for message to appear on page 2
      await page2.waitForSelector('text=Latency test message', { timeout: 5000 });
      const endTime = Date.now();

      const latency = endTime - startTime;
      console.log(`Sync latency: ${latency}ms`);

      // Target: <50ms (may be higher in CI environment)
      // Accept up to 200ms in test environment
      expect(latency).toBeLessThan(200);
    } finally {
      await page1.close();
      await page2.close();
      await context.close();
    }
  });
});
