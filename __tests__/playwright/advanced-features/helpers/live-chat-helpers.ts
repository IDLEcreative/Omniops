/**
 * Helper functions for live chat monitoring tests
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export async function navigateToLiveChatMonitoring(page: Page): Promise<void> {
  console.log('📍 Navigating to live chat monitoring page');
  await page.goto(`${BASE_URL}/dashboard/live-chats`, { waitUntil: 'networkidle' });
  const pageTitle = page.locator('h1:has-text("Live Chats"), h1:has-text("Active Conversations")').first();
  await expect(pageTitle).toBeVisible({ timeout: 10000 });
  console.log('✅ Live chat monitoring page loaded');
}

export async function verifyActiveChatsDisplayed(page: Page, expectedCount: number): Promise<void> {
  console.log('📍 Verifying active chats list');
  const chatItems = page.locator('[data-testid="active-chat"], .active-chat-item, .chat-row');
  await page.waitForTimeout(1500);
  const count = await chatItems.count();
  expect(count).toBe(expectedCount);
  console.log(`✅ Found ${count} active chats`);
}

export async function openChatForMonitoring(page: Page, chatId: string): Promise<void> {
  console.log(`📍 Opening chat for monitoring: ${chatId}`);
  const chatItem = page.locator(`[data-chat-id="${chatId}"], .chat-row:has-text("${chatId}")`).first();

  if (await chatItem.isVisible({ timeout: 5000 })) {
    await chatItem.click();
  } else {
    await page.goto(`${BASE_URL}/dashboard/live-chats/${chatId}`, { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(2000);
  const messagesPanel = page.locator('[data-testid="messages-panel"], .messages-container, .chat-messages').first();
  await expect(messagesPanel).toBeVisible({ timeout: 5000 });
  console.log('✅ Chat opened for monitoring');
}

export async function verifyMessagesDisplayed(page: Page, expectedCount: number): Promise<void> {
  console.log('📍 Verifying messages displayed');
  const messages = page.locator('[data-testid="chat-message"], .chat-message, .message-item');
  await page.waitForTimeout(1000);
  const count = await messages.count();
  expect(count).toBeGreaterThanOrEqual(expectedCount);
  console.log(`✅ ${count} messages displayed`);
}

export async function initiateAgentTakeover(page: Page, agentName: string): Promise<void> {
  console.log(`📍 Initiating agent takeover as: ${agentName}`);
  const takeoverButton = page.locator('button:has-text("Take Over"), button:has-text("Join Chat"), [data-testid="takeover-button"]').first();
  await takeoverButton.click();
  await page.waitForTimeout(1500);

  const agentNameInput = page.locator('input[name="agent_name"], input[placeholder*="name" i]').first();
  if (await agentNameInput.isVisible({ timeout: 2000 })) {
    await agentNameInput.fill(agentName);
    const confirmButton = page.locator('button:has-text("Confirm"), button[type="submit"]').first();
    await confirmButton.click();
  }

  await page.waitForTimeout(2000);
  console.log('✅ Agent takeover initiated');
}

export async function verifyAgentTakeoverSuccessful(page: Page): Promise<void> {
  console.log('📍 Verifying agent takeover successful');
  const takeoverIndicator = page.locator(
    'text=/agent joined/i, text=/takeover successful/i, [data-testid="agent-active"]'
  ).first();
  await expect(takeoverIndicator).toBeVisible({ timeout: 5000 });

  const agentInput = page.locator('textarea[placeholder*="message" i], input[placeholder*="type" i]').first();
  await expect(agentInput).toBeVisible({ timeout: 5000 });
  await expect(agentInput).toBeEnabled();
  console.log('✅ Agent takeover successful');
}

export async function sendAgentMessage(page: Page, message: string): Promise<void> {
  console.log(`📍 Sending agent message: "${message}"`);
  const messageInput = page.locator('textarea[placeholder*="message" i], input[placeholder*="type" i]').first();
  await messageInput.fill(message);
  const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
  await sendButton.click();
  await page.waitForTimeout(1500);
  console.log('✅ Agent message sent');
}
