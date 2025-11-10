import { v4 as uuidv4 } from 'uuid';
import { API_URL, TEST_DOMAIN } from './config';
import type { NullInjectionTest } from './types';

export async function sendChatRequest(
  test: NullInjectionTest,
  sessionId: string = uuidv4()
): Promise<{
  response: any;
  status: number;
  duration: number;
  hasTypeError: boolean;
}> {
  const startTime = performance.now();

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Null-Injection': test.injectionPoint,
        'X-Null-Value': test.nullValue === undefined ? 'undefined' : 'null'
      },
      body: JSON.stringify({
        message: test.query,
        session_id: sessionId,
        conversation_id: null,
        domain: TEST_DOMAIN,
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      })
    });

    const duration = performance.now() - startTime;
    const data = await apiResponse.json();
    const errorText = JSON.stringify(data);
    const hasTypeError =
      errorText.includes('TypeError') ||
      errorText.includes('Cannot read') ||
      errorText.includes('is not a function') ||
      errorText.includes('is not defined');

    return {
      response: data,
      status: apiResponse.status,
      duration,
      hasTypeError
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorText = error instanceof Error ? error.message : String(error);
    const hasTypeError =
      errorText.includes('TypeError') ||
      errorText.includes('Cannot read');

    return {
      response: { error: errorText },
      status: 0,
      duration,
      hasTypeError
    };
  }
}
