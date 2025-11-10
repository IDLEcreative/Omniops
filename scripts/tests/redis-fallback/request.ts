import { v4 as uuidv4 } from 'uuid';
import { API_URL, TEST_DOMAIN } from './config';

export async function sendChatRequest(
  testName: string,
  sessionId: string = uuidv4()
): Promise<{
  response: any;
  statusCode: number;
  duration: number;
  rateLimited: boolean;
}> {
  const startTime = performance.now();

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Redis-Test': testName
      },
      body: JSON.stringify({
        message: 'Test message for rate limit validation',
        session_id: sessionId,
        conversation_id: null,
        domain: TEST_DOMAIN,
        config: {}
      })
    });

    const duration = performance.now() - startTime;
    const data = await apiResponse.json();

    return {
      response: data,
      statusCode: apiResponse.status,
      duration,
      rateLimited: apiResponse.status === 429
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    return {
      response: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      statusCode: 0,
      duration,
      rateLimited: false
    };
  }
}
