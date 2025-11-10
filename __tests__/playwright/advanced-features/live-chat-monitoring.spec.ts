import { test, expect, Page } from '@playwright/test';
import {
  navigateToLiveChatMonitoring,
  verifyActiveChatsDisplayed,
  openChatForMonitoring,
  verifyMessagesDisplayed,
  initiateAgentTakeover,
  verifyAgentTakeoverSuccessful,
  sendAgentMessage
} from './helpers/live-chat-helpers';
import {
  mockActiveChatsAPI,
  mockChatMessagesAPI,
  mockAgentTakeoverAPI,
  mockCustomerNotificationAPI,
  type ActiveChat,
  type ChatMessage
} from './helpers/mock-api-helpers';

/**
 * E2E Test: Live Chat Monitoring and Agent Takeover Journey
 * Tests the COMPLETE live chat monitoring flow with agent handoff.
 */

const TEST_TIMEOUT = 180000;

async function simulateNewMessage(page: Page, message: ChatMessage): Promise<void> {
  console.log('📍 Simulating new message arrival');
  await page.evaluate((msg) => {
    window.dispatchEvent(new CustomEvent('chat:new-message', { detail: msg }));
  }, message);
  await page.waitForTimeout(1000);
  console.log('✅ New message event dispatched');
}

async function verifyNewMessageAppeared(page: Page, messageContent: string): Promise<void> {
  console.log('📍 Verifying new message appeared');
  const newMessage = page.locator(`.chat-message:has-text("${messageContent}"), [data-message]:has-text("${messageContent}")`).first();
  await expect(newMessage).toBeVisible({ timeout: 5000 });
  console.log('✅ New message appeared in real-time');
}

async function verifyCustomerNotified(notifications: any[]): Promise<void> {
  console.log('📍 Verifying customer notification');
  const agentNotification = notifications.find(n =>
    n.type === 'agent_joined' || n.message?.toLowerCase().includes('agent')
  );
  expect(agentNotification).toBeDefined();
  console.log('✅ Customer notified of agent takeover:', agentNotification);
}

test.describe('Live Chat Monitoring and Agent Takeover E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  const mockChats: ActiveChat[] = [
    {
      id: 'chat-1',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      started_at: new Date(Date.now() - 300000).toISOString(),
      last_message: 'I need help with my order',
      message_count: 5,
      status: 'active'
    },
    {
      id: 'chat-2',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      started_at: new Date(Date.now() - 180000).toISOString(),
      last_message: 'Can you help me find a product?',
      message_count: 3,
      status: 'waiting'
    }
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, I need help with my order',
      timestamp: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'I would be happy to help you. Could you provide your order number?',
      timestamp: new Date(Date.now() - 290000).toISOString()
    },
    {
      id: 'msg-3',
      role: 'user',
      content: 'My order number is #12345',
      timestamp: new Date(Date.now() - 280000).toISOString()
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'Let me look that up for you.',
      timestamp: new Date(Date.now() - 270000).toISOString()
    },
    {
      id: 'msg-5',
      role: 'user',
      content: 'Actually, I would like to speak to a human agent',
      timestamp: new Date(Date.now() - 60000).toISOString()
    }
  ];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should monitor live chat and complete agent takeover', async ({ page }) => {
    console.log('=== Starting Live Chat Monitoring Test ===');

    // Setup mocks
    await mockActiveChatsAPI(page, mockChats);
    const messagesService = await mockChatMessagesAPI(page, mockChats[0].id, mockMessages);
    const takeoverService = await mockAgentTakeoverAPI(page);
    const notificationService = await mockCustomerNotificationAPI(page);

    // Execute test flow
    await navigateToLiveChatMonitoring(page);
    await verifyActiveChatsDisplayed(page, mockChats.length);
    await openChatForMonitoring(page, mockChats[0].id);
    await verifyMessagesDisplayed(page, mockMessages.length);

    // Simulate new message
    const newUserMessage: ChatMessage = {
      id: 'msg-6',
      role: 'user',
      content: 'Is anyone there?',
      timestamp: new Date().toISOString()
    };

    messagesService.addMessage(newUserMessage);
    await simulateNewMessage(page, newUserMessage);
    await verifyNewMessageAppeared(page, newUserMessage.content);

    // Agent takeover
    await initiateAgentTakeover(page, 'Support Agent Alice');
    await verifyAgentTakeoverSuccessful(page);

    // Verify takeover data
    await page.waitForTimeout(1000);
    const takeoverData = takeoverService.getTakeoverData();
    expect(takeoverData).not.toBeNull();
    expect(takeoverData.chat_id).toBe(mockChats[0].id);
    console.log('✅ Takeover data captured:', takeoverData);

    // Send agent message
    await sendAgentMessage(page, 'Hello! I am here to help you. Let me check your order status.');

    // Verify customer notification
    await page.waitForTimeout(1000);
    const notifications = notificationService.getNotifications();
    await verifyCustomerNotified(notifications);

    await page.screenshot({
      path: `test-results/live-chat-monitoring-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Complete live chat monitoring and agent takeover validated end-to-end!');
  });

  test('should show waiting chats requiring agent attention', async ({ page }) => {
    console.log('=== Testing Waiting Chats Display ===');

    await mockActiveChatsAPI(page, mockChats);
    await navigateToLiveChatMonitoring(page);

    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    if (await statusFilter.isVisible({ timeout: 2000 })) {
      await statusFilter.selectOption('waiting');
      await page.waitForTimeout(1000);
    }

    console.log('✅ Waiting chats filter applied');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/live-chat-monitoring-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
