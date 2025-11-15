/**
 * Edge Case Tester Utility
 * Provides HTTP testing methods for agent edge cases
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain: string;
  config?: any;
}

export class EdgeCaseTester {
  async sendMessage(
    message: string,
    options: Partial<ChatRequest> = {}
  ): Promise<any> {
    const request: ChatRequest = {
      message,
      session_id: uuidv4(),
      domain: TEST_DOMAIN,
      ...options,
    };

    // Create abort controller with 30 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      return { ok: false, error };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { API_URL, TEST_DOMAIN };
