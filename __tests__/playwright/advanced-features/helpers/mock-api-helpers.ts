/**
 * Mock API helpers for Playwright tests
 */

import { Page } from '@playwright/test';

export interface ActiveChat {
  id: string;
  customer_name: string;
  customer_email: string;
  started_at: string;
  last_message: string;
  message_count: number;
  status: 'active' | 'waiting' | 'agent_assigned';
  agent_id?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: string;
}

export async function mockActiveChatsAPI(page: Page, chats: ActiveChat[]): Promise<void> {
  console.log('🔧 Setting up active chats API mock');
  await page.route('**/api/chats/active**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        chats,
        total: chats.length
      })
    });
  });
  console.log('✅ Active chats API mock ready');
}

export async function mockChatMessagesAPI(
  page: Page,
  chatId: string,
  initialMessages: ChatMessage[]
): Promise<{ addMessage: (message: ChatMessage) => void }> {
  console.log('🔧 Setting up chat messages API mock');
  const messagesState = { messages: [...initialMessages] };

  await page.route(`**/api/chats/${chatId}/messages**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        messages: messagesState.messages,
        chat_id: chatId
      })
    });
  });

  console.log('✅ Chat messages API mock ready');
  return {
    addMessage: (message: ChatMessage) => {
      messagesState.messages.push(message);
      console.log('📨 New message added:', message.content.substring(0, 50));
    }
  };
}

export async function mockAgentTakeoverAPI(page: Page): Promise<{ getTakeoverData: () => any }> {
  console.log('🔧 Setting up agent takeover API mock');
  const takeoverState = { takeoverData: null as any };

  await page.route('**/api/chats/*/takeover', async (route) => {
    const requestData = route.request().postDataJSON();
    const chatId = route.request().url().split('/').slice(-2, -1)[0];

    takeoverState.takeoverData = {
      chat_id: chatId,
      agent_id: requestData.agent_id,
      timestamp: new Date().toISOString()
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Agent takeover successful',
        agent_id: requestData.agent_id
      })
    });
  });

  console.log('✅ Agent takeover API mock ready');
  return {
    getTakeoverData: () => takeoverState.takeoverData
  };
}

export async function mockCustomerNotificationAPI(page: Page): Promise<{ getNotifications: () => any[] }> {
  console.log('🔧 Setting up customer notification API mock');
  const notificationState = { notifications: [] as any[] };

  await page.route('**/api/notifications/send', async (route) => {
    const requestData = route.request().postDataJSON();
    notificationState.notifications.push({
      type: requestData.type,
      recipient: requestData.recipient,
      message: requestData.message,
      timestamp: new Date().toISOString()
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  console.log('✅ Customer notification API mock ready');
  return {
    getNotifications: () => notificationState.notifications
  };
}
