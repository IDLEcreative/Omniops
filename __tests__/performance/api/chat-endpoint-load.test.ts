/**
 * Chat API Load Tests
 *
 * Tests chat endpoint performance under concurrent load
 * Performance Goals:
 * - p95 < 2000ms for simple queries
 * - Handles 10 concurrent users
 * - Processes 100 messages/minute
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateLoad, generateSustainedLoad } from '../utils/load-generator';
import { collectMetrics, printMetrics } from '../utils/metrics-collector';
import { assertResponseTime, assertThroughput, assertErrorRate } from '../utils/assertion-helpers';

// Mock server URL (adjust for your test environment)
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Chat API Load Tests', () => {
  const TEST_DOMAIN = 'test-performance.example.com';
  const TEST_CUSTOMER_ID = 'perf-test-customer';

  // Skip if not in performance testing mode
  const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
  const describeIf = runTests ? describe : describe.skip;

  describeIf('Simple Chat Queries', () => {
    it('should handle 10 concurrent users with p95 < 2000ms', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            message: 'What products do you offer?',
            domain: TEST_DOMAIN,
            customerId: TEST_CUSTOMER_ID
          }
        },
        10, // concurrency
        50  // total requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Simple Queries');

      // Assertions
      assertResponseTime(metrics, { p95: 2000 });
      assertErrorRate(metrics, 5); // Max 5% error rate
      expect(metrics.successRate).toBeGreaterThan(95);
    }, 60000); // 60 second timeout

    it('should process 100 messages/minute', async () => {
      const results = await generateSustainedLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          body: {
            message: 'Show me your best products',
            domain: TEST_DOMAIN,
            customerId: TEST_CUSTOMER_ID
          }
        },
        5,      // concurrency
        60000   // 1 minute duration
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Sustained Load');

      // Should process at least 100 messages in 1 minute
      assertThroughput(metrics, 100 / 60); // ~1.67 req/s
      expect(metrics.totalRequests).toBeGreaterThan(100);
    }, 90000); // 90 second timeout
  });

  describeIf('Complex Multi-Turn Conversations', () => {
    it('should maintain performance with conversation context', async () => {
      // Simulate multi-turn conversation
      const conversationId = `perf-test-${Date.now()}`;

      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          body: {
            message: 'I need help finding a product',
            domain: TEST_DOMAIN,
            customerId: TEST_CUSTOMER_ID,
            conversationId
          }
        },
        5,  // concurrency
        25  // total requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Multi-Turn');

      // Allow higher latency for complex queries
      assertResponseTime(metrics, { p95: 3000 });
      assertErrorRate(metrics, 10);
    }, 60000);
  });

  describeIf('Product Search Performance', () => {
    it('should handle product-specific queries efficiently', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          body: {
            message: 'Show me hydraulic pumps under $500',
            domain: TEST_DOMAIN,
            customerId: TEST_CUSTOMER_ID
          }
        },
        10, // concurrency
        50  // total requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Product Search');

      // Product searches may be slower due to database queries
      assertResponseTime(metrics, { p95: 2500 });
      assertErrorRate(metrics, 5);
    }, 60000);
  });

  describeIf('Error Handling Under Load', () => {
    it('should gracefully handle malformed requests', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          body: {
            message: '', // Invalid empty message
            domain: TEST_DOMAIN
          }
        },
        10,
        50
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Error Handling');

      // Should return errors quickly
      assertResponseTime(metrics, { p95: 500 });
      // All should fail validation
      expect(metrics.errorRate).toBeGreaterThan(50);
    }, 30000);
  });

  describeIf('Rate Limiting Behavior', () => {
    it('should enforce rate limits under high load', async () => {
      // Generate excessive requests to trigger rate limiting
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/chat`,
          method: 'POST',
          body: {
            message: 'Test message',
            domain: TEST_DOMAIN,
            customerId: TEST_CUSTOMER_ID
          }
        },
        20,  // high concurrency
        200  // many requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Chat API - Rate Limiting');

      // Some requests should be rate limited (429 status)
      const rateLimitedCount = results.responses.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 90000);
  });
});
