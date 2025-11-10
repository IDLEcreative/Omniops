/**
 * Chat API client for conversation testing
 * Handles message sending and conversation state management
 */

import { v4 as uuidv4 } from 'uuid';
import type { ChatRequest, ChatResponse } from './conversation-types';

export class ConversationClient {
  private sessionId: string;
  private conversationId?: string;
  private messageHistory: Array<{ input: string; response: string }> = [];
  private apiUrl: string;
  private domain: string;

  constructor(apiUrl: string, domain: string) {
    this.apiUrl = apiUrl;
    this.domain = domain;
    this.sessionId = uuidv4();
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: this.conversationId,
          session_id: this.sessionId,
          domain: this.domain,
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true },
            },
          },
        } as ChatRequest),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      this.conversationId = data.conversation_id;
      this.messageHistory.push({ input: message, response: data.message });
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  getMessageHistory(): Array<{ input: string; response: string }> {
    return this.messageHistory;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
  }

  reset(): void {
    this.sessionId = uuidv4();
    this.conversationId = undefined;
    this.messageHistory = [];
  }
}
