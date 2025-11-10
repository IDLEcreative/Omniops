import { expect, Page } from '@playwright/test';
import { BASE_URL } from './constants';
import { ConversationData } from './types';

export async function startConversation(page: Page): Promise<ConversationData> {
  await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

  const iframe = page.frameLocator('iframe#chat-widget-iframe');
  await expect(iframe.locator('body')).toBeVisible({ timeout: 10000 });

  const inputField = iframe.locator('input[type=\"text\"], textarea').first();
  await inputField.waitFor({ state: 'visible', timeout: 5000 });
  await inputField.click();

  const userMessage = 'I need help with setting up automated follow-ups';
  await inputField.fill(userMessage);
  await inputField.press('Enter');

  await page.waitForTimeout(2000);

  return {
    conversation_id: `conv_${Date.now()}`,
    session_id: await page.evaluate(() => {
      return localStorage.getItem('session_id') || `session_${Date.now()}`;
    }),
    last_message: userMessage,
  };
}

export async function abandonConversation(page: Page, conversation: ConversationData) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeunload'));
  });
  await page.waitForTimeout(1000);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  conversation.abandoned_at = new Date().toISOString();
  await page.waitForTimeout(2000);
}

export async function respondToFollowUp(page: Page) {
  const iframe = page.frameLocator('iframe#chat-widget-iframe');
  await expect(iframe.locator('body')).toBeVisible({ timeout: 10000 });

  const followUpMessage = iframe.locator('text=/need help|continue the conversation/i').first();
  await followUpMessage.isVisible({ timeout: 5000 }).catch(() => null);

  const inputField = iframe.locator('input[type=\"text\"], textarea').first();
  await inputField.waitFor({ state: 'visible', timeout: 5000 });
  await inputField.click();

  const responseMessage = 'Yes, I still need help with the follow-ups feature';
  await inputField.fill(responseMessage);
  await inputField.press('Enter');
  await page.waitForTimeout(2000);
}
