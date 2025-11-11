import { CHAT_API_URL, DOMAIN, TIMEOUT_MS } from './config';
import { ChatRequest, ChatResponse } from './types';

export class ChatClient {
  private conversationId?: string;
  private readonly sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async send(message: string): Promise<{ response: ChatResponse; duration: number }> {
    const startTime = Date.now();

    const request: ChatRequest = {
      message,
      domain: DOMAIN,
      session_id: this.sessionId,
      conversation_id: this.conversationId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ChatResponse;

      if (data.conversation_id) {
        this.conversationId = data.conversation_id;
      }

      return { response: data, duration: Date.now() - startTime };
    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        throw { error: new Error(`Request timeout after ${TIMEOUT_MS / 1000} seconds`), duration };
      }

      throw { error, duration };
    }
  }
}
