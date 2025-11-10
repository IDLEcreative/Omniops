import { ChatRequest, ChatResponse } from '../types/api';
import { TEST_CONFIG, type TestConfig } from './config';

export interface ApiResponse {
  response: ChatResponse;
  time: number;
}

export async function makeApiRequest(
  query: string,
  conversationId?: string,
  config: TestConfig = TEST_CONFIG
): Promise<ApiResponse> {
  const startTime = Date.now();

  const requestBody: ChatRequest = {
    message: query,
    session_id: config.sessionId,
    domain: config.domain,
    conversation_id: conversationId,
    config: {
      features: {
        woocommerce: { enabled: true },
        websiteScraping: { enabled: true }
      }
    }
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      const endTime = Date.now();

      return {
        response: data,
        time: endTime - startTime
      };
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < config.maxRetries - 1) {
        console.log(`Retrying in ${config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  throw lastError;
}
