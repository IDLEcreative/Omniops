import { performance } from 'perf_hooks';
import { PerformanceMetrics } from './metrics';
import { API_URL, TEST_DOMAIN } from './config';

const TEST_MESSAGES = [
  'Hello, what do you sell?',
  'Tell me about your shipping options',
  'I need help with my order #12345',
  'What are your business hours?',
  'How can I return a product?'
];

export async function benchmarkChatAPI(metrics: PerformanceMetrics) {
  console.log('\n📊 Testing Chat API Performance...');

  for (const message of TEST_MESSAGES) {
    const start = performance.now();
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: `benchmark-${Date.now()}`,
          domain: TEST_DOMAIN,
          config: {
            features: {
              websiteScraping: { enabled: true },
              woocommerce: { enabled: false }
            }
          }
        })
      });

      const data = await response.json();
      const duration = performance.now() - start;

      metrics.record('chat_api_response', duration, {
        message: message.substring(0, 30),
        hasResponse: Boolean(data.message),
        sourceCount: data.sources?.length || 0
      });

      console.log(`  "${message.substring(0, 30)}..." - ${duration.toFixed(2)}ms (${data.sources?.length || 0} sources)`);
    } catch (error: any) {
      console.log(`  "${message.substring(0, 30)}..." - Error: ${error.message}`);
    }
  }
}
