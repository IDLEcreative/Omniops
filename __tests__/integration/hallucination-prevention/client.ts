import { v4 as uuidv4 } from 'uuid';
import { API_URL, HEALTHCHECK_URL } from './config';

export interface QueryResponse {
  response: string;
  duration: number;
}

export async function sendQuery(
  message: string,
  domain: string,
  sessionId: string = uuidv4()
): Promise<QueryResponse> {
  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        domain,
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true },
          },
        },
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      response: data.message || '',
      duration,
    };
  } catch (error) {
    console.error('Request failed:', error);
    return {
      response: '',
      duration: Date.now() - startTime,
    };
  }
}

export async function ensureServerIsAvailable() {
  const response = await fetch(HEALTHCHECK_URL).catch(() => null);

  if (!response || !response.ok) {
    throw new Error('Development server not running on http://localhost:3000');
  }
}
