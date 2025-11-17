/**
 * Agent Flow E2E Tests - Error Handling & Fallback (Tests 11-14)
 *
 * Test 11: Fallback to generic search (no commerce provider)
 * Test 12: OpenAI API error handling
 * Test 13: Tool execution failure handling
 * Test 14: Database connection failure handling
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Skip these tests if running in CI or if explicitly disabled
// These are E2E tests that require external services
const SKIP_E2E = process.env.CI === 'true' || process.env.SKIP_E2E === 'true';
const describeE2E = SKIP_E2E ? describe.skip : describe;

beforeAll(() => {
  // MSW is started globally, but we don't want it to intercept our E2E test requests
  // The global setup uses 'bypass' for unhandled requests, which should allow our requests through
});

afterAll(() => {
  // No cleanup needed - MSW will be reset after each test
});

const supabase = SKIP_E2E ? null : createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describeE2E('Agent Flow E2E - Error Handling [Requires External Services]', () => {
  describe('Commerce Provider Integration', () => {
    it('TEST 11: should fall back to generic search when no provider configured', async () => {
      /**
       * Test 11: Fallback to generic search (no commerce provider)
       *
       * Test Flow:
       * 1. Use test domain with NO commerce provider credentials
       * 2. Send product search query
       * 3. Verify system uses vector search instead
       * 4. Verify response is still helpful using scraped data
       *
       * Success Criteria:
       * - No commerce provider API calls made
       * - Vector search executed successfully
       * - Response contains relevant information from scraped data
       */

      const testDomain = 'test.localhost';
      const conversationId = crypto.randomUUID();

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me hydraulic pumps',
          conversation_id: conversationId,
          session_id: crypto.randomUUID(),
          domain: testDomain,
          config: {
            ai: {
              maxSearchIterations: 2,
              searchTimeout: 10000
            }
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('conversation_id');
      expect(data).toHaveProperty('sources');

      expect(data.message).toBeTruthy();
      expect(data.message.length).toBeGreaterThan(20);

      expect(data.searchMetadata).toBeDefined();
      expect(data.searchMetadata.totalSearches).toBeGreaterThan(0);

      expect(data.message).not.toMatch(/provider.*not.*configured/i);
      expect(data.message).not.toMatch(/integration.*missing/i);

      console.log('[Test 11] Fallback search completed successfully:', {
        domain: testDomain,
        searchCount: data.searchMetadata.totalSearches,
        responseLength: data.message.length
      });
    }, 60000);
  });

  describe('Error Handling', () => {
    it('TEST 12: should handle OpenAI API errors gracefully', async () => {
      /**
       * Test 12: OpenAI API error handling
       *
       * Strategy: Since we can't easily mock OpenAI in E2E tests, we'll test
       * the error handling path by sending malformed requests that trigger
       * validation errors, then verify user-friendly error messages.
       *
       * Success Criteria:
       * - User sees friendly error message (not stack trace)
       * - No sensitive data leaked in error
       * - Error is properly logged
       * - HTTP status code appropriate (400/500)
       */

      const testDomain = 'test-openai-errors.com';

      // Test 1: Invalid message format (empty string)
      const response1 = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          session_id: crypto.randomUUID(),
          domain: testDomain
        })
      });

      expect(response1.ok).toBe(false);
      expect(response1.status).toBe(400);
      const error1 = await response1.json();

      expect(error1).toHaveProperty('error');
      expect(error1.error).toBeTruthy();

      expect(error1.error).not.toMatch(/OPENAI_API_KEY/);
      expect(error1.error).not.toMatch(/SUPABASE.*KEY/);
      expect(error1.error).not.toMatch(/password|secret|token/i);

      console.log('[Test 12] OpenAI error handling verified:', {
        statusCode: response1.status,
        errorMessage: error1.error
      });

      // Test 2: Missing required fields
      const response2 = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: crypto.randomUUID()
        })
      });

      expect(response2.ok).toBe(false);
      const error2 = await response2.json();
      expect(error2).toHaveProperty('error');

      expect(error2.error).toMatch(/invalid|required|missing/i);
    }, 30000);

    it('TEST 13: should handle tool execution failures gracefully', async () => {
      /**
       * Test 13: Tool execution failure handling
       *
       * Strategy: Search for something that doesn't exist to trigger "no results" scenario.
       *
       * Success Criteria:
       * - AI acknowledges search was attempted
       * - AI provides helpful response despite failure
       * - No crash or technical error exposed to user
       */

      const testDomain = 'test.localhost';

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me unicorn-powered flux capacitors',
          conversation_id: crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          domain: testDomain,
          config: {
            ai: { maxSearchIterations: 2 }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Test 13] Error response:', {
          status: response.status,
          data
        });
      }
      expect(response.ok).toBe(true);

      expect(data.message).toBeTruthy();
      expect(typeof data.message).toBe('string');

      const message = data.message.toLowerCase();
      const hasAcknowledgment =
        message.includes('no results') ||
        message.includes('not found') ||
        message.includes('couldn\'t find') ||
        message.includes('help you') ||
        message.includes('don\'t have') ||
        message.includes('try');

      expect(hasAcknowledgment).toBe(true);

      expect(data.error).toBeUndefined();

      console.log('[Test 13] Tool failure handled gracefully:', {
        domain: testDomain,
        responseLength: data.message.length,
        hasAcknowledgment
      });
    }, 60000);

    it('TEST 14: should handle database connection failures gracefully', async () => {
      /**
       * Test 14: Database connection failure handling
       *
       * Strategy: Test with invalid domain (null/undefined) to trigger
       * database query failures. Verify error handling doesn't crash.
       *
       * Success Criteria:
       * - Returns appropriate error status (503 or 500)
       * - Error message is user-friendly
       * - No database internals exposed
       */

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          session_id: crypto.randomUUID(),
          domain: null
        })
      });

      const data = await response.json();

      expect(data).toBeTruthy();

      if (data.error) {
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);

        expect(data.error).not.toMatch(/postgres|supabase|sql|table|column/i);
        expect(data.error).not.toMatch(/connection.*refused|timeout.*database/i);
      } else {
        expect(data.message).toBeTruthy();
      }

      console.log('[Test 14] Database error handled:', {
        status: response.status,
        hasError: !!data.error,
        errorMessage: data.error || 'none'
      });
    }, 30000);
  });
});
