/**
 * Production Test Helper
 * Shared utilities for E2E production readiness tests
 */

export const PRODUCTION_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testDomain: 'production-readiness-test.com',
  performanceThresholds: {
    widgetLoad: 500,
    firstMessage: 2000,
    subsequentMessages: 1000,
    storageOperation: 50,
    tabSync: 200,
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
  },
};

export class ProductionTestHelper {
  private sessionId: string;
  private conversationId?: string;
  private startTime?: number;

  constructor() {
    this.sessionId = `prod-test-${Date.now()}`;
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  getElapsedTime(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  async sendMessage(message: string): Promise<any> {
    this.startTimer();

    const response = await fetch(`${PRODUCTION_CONFIG.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        domain: PRODUCTION_CONFIG.testDomain,
        conversation_id: this.conversationId,
      }),
    });

    const duration = this.getElapsedTime();

    if (!response.ok) {
      throw new Error(`Message failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.conversationId = data.conversation_id;

    return { data, duration };
  }

  async getConversation(): Promise<any> {
    if (!this.conversationId) {
      throw new Error('No conversation ID');
    }

    const response = await fetch(
      `${PRODUCTION_CONFIG.apiUrl}/api/conversations/${this.conversationId}`,
      { headers: { 'x-session-id': this.sessionId } }
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return response.json();
  }

  simulateStorageOperation(key: string, value: any): number {
    this.startTimer();
    localStorage.setItem(key, JSON.stringify(value));
    return this.getElapsedTime();
  }

  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = PRODUCTION_CONFIG.retryConfig.maxRetries
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, PRODUCTION_CONFIG.retryConfig.retryDelay)
          );
        }
      }
    }

    throw lastError;
  }
}
