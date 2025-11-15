/**
 * Page Object: Cart Widget
 *
 * Encapsulates chat widget interactions for cart operations.
 * Provides reusable methods for sending messages and verifying responses.
 */

import { Page, FrameLocator } from '@playwright/test';

export class CartWidgetPage {
  constructor(
    private page: Page,
    private iframe: FrameLocator
  ) {}

  async sendMessage(message: string): Promise<void> {
    const inputField = this.iframe.locator('input[type="text"], textarea').first();
    await inputField.waitFor({ state: 'visible', timeout: 10000 });
    await inputField.clear();
    await inputField.fill(message);

    const sendButton = this.iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    console.log(`✅ Sent: "${message}"`);
    await this.page.waitForTimeout(2000);
  }

  async getLastMessage(): Promise<string> {
    const chatMessages = this.iframe.locator('[class*="message"]');
    const lastMessage = chatMessages.last();
    const text = await lastMessage.textContent();
    return text || '';
  }

  async getAllMessages(): Promise<string[]> {
    const chatMessages = this.iframe.locator('[class*="message"]');
    const count = await chatMessages.count();
    const messages: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await chatMessages.nth(i).textContent();
      if (text) messages.push(text);
    }

    return messages;
  }
}
