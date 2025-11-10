import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

export async function sendQuery(message: string, sessionId: string = uuidv4()): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || '';
  } catch (error) {
    console.error('Request failed:', error);
    return '';
  }
}
