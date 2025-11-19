/**
 * k6 Load Test: Chat API Endpoint
 *
 * Simulates realistic chat traffic with 100 concurrent users.
 * Tests chat API performance under load.
 *
 * Usage:
 *   k6 run scripts/load-testing/load-test-chat.js
 *
 * Requirements:
 *   - k6 installed: https://k6.io/docs/getting-started/installation/
 *   - Dev server running: npm run dev
 *
 * See: docs/04-TESTING/GUIDE_LOAD_TESTING.md
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');
const messageRate = new Rate('successful_messages');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    errors: ['rate<0.05'],             // Custom error rate under 5%
    chat_response_time: ['p(95)<3000'], // 95% of chats under 3s
    successful_messages: ['rate>0.90'], // 90%+ messages succeed
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const DOMAIN = __ENV.TEST_DOMAIN || 'example.com';

// Sample chat messages for realistic testing
const SAMPLE_MESSAGES = [
  'Hello, I need help finding a product',
  'Do you have any products in stock?',
  'What are your business hours?',
  'Can you help me track my order?',
  'I have a question about pricing',
  'Tell me about your services',
  'What payment methods do you accept?',
  'I need technical support',
  'How do I contact customer service?',
  'What is your return policy?',
];

/**
 * Main test scenario
 */
export default function () {
  // Pick random message
  const message = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];

  // Prepare chat request
  const payload = JSON.stringify({
    message: message,
    domain: DOMAIN,
    conversationId: `load-test-${__VU}-${__ITER}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s',
  };

  // Send chat request
  const startTime = new Date().getTime();
  const response = http.post(`${BASE_URL}/api/chat`, payload, params);
  const duration = new Date().getTime() - startTime;

  // Record custom metrics
  chatResponseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has response message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message && body.message.length > 0;
      } catch {
        return false;
      }
    },
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  // Record success/failure
  errorRate.add(!success);
  messageRate.add(success);

  // Realistic user behavior - wait 2-5 seconds between messages
  sleep(Math.random() * 3 + 2);
}

/**
 * Setup function - runs once before test
 */
export function setup() {
  console.log('🚀 Starting chat load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Concurrent users: 100`);
  console.log(`Duration: ~6.5 minutes`);

  // Verify server is reachable
  const response = http.get(BASE_URL);
  if (response.status !== 200) {
    throw new Error(`Server not reachable at ${BASE_URL}`);
  }

  return { startTime: new Date().toISOString() };
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
  console.log('✅ Load test completed');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  const summary = {
    'Test Summary': {
      'Total Requests': data.metrics.http_reqs.values.count,
      'Failed Requests': data.metrics.http_req_failed.values.count,
      'Request Rate': `${data.metrics.http_reqs.values.rate.toFixed(2)}/s`,
      'Error Rate': `${(data.metrics.errors.values.rate * 100).toFixed(2)}%`,
      'Success Rate': `${(data.metrics.successful_messages.values.rate * 100).toFixed(2)}%`,
    },
    'Response Times': {
      'Average': `${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`,
      'P95': `${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
      'P99': `${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`,
      'Max': `${data.metrics.http_req_duration.values.max.toFixed(2)}ms`,
    },
    'Chat Performance': {
      'Avg Response Time': `${data.metrics.chat_response_time.values.avg.toFixed(2)}ms`,
      'P95 Response Time': `${data.metrics.chat_response_time.values['p(95)'].toFixed(2)}ms`,
    },
  };

  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  for (const [section, metrics] of Object.entries(summary)) {
    console.log(`${section}:`);
    for (const [metric, value] of Object.entries(metrics)) {
      console.log(`  ${metric}: ${value}`);
    }
    console.log('');
  }

  // Determine pass/fail
  const passed = data.metrics.errors.values.rate < 0.05 &&
                 data.metrics.http_req_duration.values['p(95)'] < 2000;

  if (passed) {
    console.log('✅ PASSED: All thresholds met');
  } else {
    console.log('❌ FAILED: Some thresholds not met');
  }

  console.log('='.repeat(60) + '\n');

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-chat-results.json': JSON.stringify(data, null, 2),
  };
}
