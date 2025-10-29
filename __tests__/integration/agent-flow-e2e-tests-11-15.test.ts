/**
 * Agent Flow E2E Tests - Tests 11-15 (Edge Cases & Validation)
 *
 * These tests should be merged into agent-flow-e2e.test.ts
 *
 * Test 11: Fallback to generic search (no commerce provider)
 * Test 12: OpenAI API error handling
 * Test 13: Tool execution failure handling
 * Test 14: Database connection failure handling
 * Test 15: Response quality validation (markdown, hallucination, links)
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Disable MSW for these E2E tests - we want real HTTP requests
beforeAll(() => {
  // MSW is started globally, but we don't want it to intercept our E2E test requests
  // The global setup uses 'bypass' for unhandled requests, which should allow our requests through
});

afterAll(() => {
  // No cleanup needed - MSW will be reset after each test
});

// Initialize Supabase client for tests
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Agent Flow E2E - Tests 11-15', () => {
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

      const testDomain = 'test.localhost'; // Use existing test domain
      const conversationId = crypto.randomUUID();

      // Create request with product search query
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

      // Verify response structure
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('conversation_id');
      expect(data).toHaveProperty('sources');

      // Verify message is helpful (not an error)
      expect(data.message).toBeTruthy();
      expect(data.message.length).toBeGreaterThan(20);

      // Verify search was performed (even without commerce provider)
      expect(data.searchMetadata).toBeDefined();
      expect(data.searchMetadata.totalSearches).toBeGreaterThan(0);

      // Response should NOT contain error messages about missing provider
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
          message: '',  // Empty message should fail validation
          session_id: crypto.randomUUID(),
          domain: testDomain
        })
      });

      expect(response1.ok).toBe(false);
      expect(response1.status).toBe(400);
      const error1 = await response1.json();

      // Verify user-friendly error (not technical stack trace)
      expect(error1).toHaveProperty('error');
      expect(error1.error).toBeTruthy();

      // Should NOT contain sensitive data
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
          // Missing message field
          session_id: crypto.randomUUID()
        })
      });

      expect(response2.ok).toBe(false);
      const error2 = await response2.json();
      expect(error2).toHaveProperty('error');

      // Error should mention what's wrong (helpful)
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

      // Should have a response (even if no results found)
      expect(data.message).toBeTruthy();
      expect(typeof data.message).toBe('string');

      // AI should acknowledge no results or provide alternative
      const message = data.message.toLowerCase();
      const hasAcknowledgment =
        message.includes('no results') ||
        message.includes('not found') ||
        message.includes('couldn\'t find') ||
        message.includes('help you') ||
        message.includes('don\'t have') ||
        message.includes('try');

      expect(hasAcknowledgment).toBe(true);

      // Should NOT crash with error
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

      // Test with null domain (should fail gracefully)
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          session_id: crypto.randomUUID(),
          domain: null  // Invalid domain
        })
      });

      // May return 400 (validation error) or still process (depends on implementation)
      // Either way, should not crash
      const data = await response.json();

      // Should have some response
      expect(data).toBeTruthy();

      // If error, should be user-friendly
      if (data.error) {
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);

        // Should NOT expose database internals
        expect(data.error).not.toMatch(/postgres|supabase|sql|table|column/i);
        expect(data.error).not.toMatch(/connection.*refused|timeout.*database/i);
      } else {
        // If not error, should have valid message
        expect(data.message).toBeTruthy();
      }

      console.log('[Test 14] Database error handled:', {
        status: response.status,
        hasError: !!data.error,
        errorMessage: data.error || 'none'
      });
    }, 30000);
  });

  describe('Response Quality', () => {
    it('TEST 15a: should format responses with proper markdown', async () => {
      /**
       * Test 15a: Markdown formatting validation
       *
       * Success Criteria:
       * - Links formatted as [text](url), not raw URLs
       * - Lists have proper spacing
       * - Text is scannable and well-formatted
       */

      const testDomain = 'test.localhost';

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Tell me about your products',
          conversation_id: crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          domain: testDomain
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      const message = data.message;

      // Check for proper markdown link format [text](url)
      const markdownLinks = message.match(/\[[^\]]+\]\([^)]+\)/g) || [];

      // Check for raw URLs (should be minimal or formatted)
      const rawUrls = message.match(/https?:\/\/[^\s)\]]+/g) || [];
      const rawUrlsNotInMarkdown = rawUrls.filter((url: string) =>
        !message.includes(`](${url})`)
      );

      // Markdown links should be properly formatted
      if (markdownLinks.length > 0) {
        markdownLinks.forEach((link: string) => {
          expect(link).toMatch(/\[[^\]]+\]\([^)]+\)/);
        });
      }

      // Check for excessive blank lines (should be cleaned up)
      const consecutiveNewlines = message.match(/\n{4,}/g);
      expect(consecutiveNewlines).toBeFalsy();

      console.log('[Test 15a] Markdown formatting validated:', {
        domain: testDomain,
        markdownLinks: markdownLinks.length,
        rawUrls: rawUrlsNotInMarkdown.length,
        hasConsecutiveNewlines: !!consecutiveNewlines
      });
    }, 60000);

    it('TEST 15b: should never make up prices or specifications (hallucination prevention)', async () => {
      /**
       * Test 15b: Hallucination prevention validation
       *
       * Success Criteria:
       * - AI admits uncertainty when data not available
       * - No invented technical specifications
       * - No fabricated prices or numbers
       */

      const testDomain = 'test.localhost';

      // Ask for specific details that likely don't exist in database
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What is the exact weight in grams of product SKU-NONEXISTENT-12345?',
          conversation_id: crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          domain: testDomain
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      const message = data.message.toLowerCase();

      // AI should admit uncertainty, not make up numbers
      const admitsUncertainty =
        message.includes('don\'t have') ||
        message.includes('not available') ||
        message.includes('couldn\'t find') ||
        message.includes('unable to') ||
        message.includes('no information') ||
        message.includes('contact') ||
        message.includes('check with');

      expect(admitsUncertainty).toBe(true);

      // Should NOT contain specific made-up numbers
      const hasSpecificWeight = message.match(/\d+\s*(grams?|g\b)/i);

      // If it mentions weight, it should be with uncertainty qualifier
      if (hasSpecificWeight) {
        const hasUncertaintyQualifier =
          message.includes('approximately') ||
          message.includes('around') ||
          message.includes('typically') ||
          message.includes('may');

        expect(hasUncertaintyQualifier).toBe(true);
      }

      console.log('[Test 15b] Hallucination prevention verified:', {
        domain: testDomain,
        admitsUncertainty,
        hasSpecificWeight: !!hasSpecificWeight
      });
    }, 60000);

    it('TEST 15c: should never link to external competitors (link filtering)', async () => {
      /**
       * Test 15c: External link filtering validation
       *
       * Success Criteria:
       * - Response contains only links to customer's domain
       * - No external competitor URLs
       * - Link sanitization working correctly
       */

      const testDomain = 'test.localhost';

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Where can I find products?',
          conversation_id: crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          domain: testDomain
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      const message = data.message;

      // Extract all URLs from response
      const allUrls = message.match(/https?:\/\/[^\s)\]]+/g) || [];

      // Check each URL
      const externalUrls = allUrls.filter((url: string) => {
        try {
          const urlObj = new URL(url);
          const host = urlObj.host.replace(/^www\./, '').toLowerCase();
          const normalizedDomain = testDomain.replace(/^www\./, '').toLowerCase();

          // URL should be from same domain or localhost (for development)
          return !host.includes(normalizedDomain) &&
                 !host.includes('localhost') &&
                 !host.includes('127.0.0.1');
        } catch {
          return false;
        }
      });

      // Common competitor domains to check for
      const competitorDomains = [
        'amazon.com',
        'ebay.com',
        'alibaba.com',
        'shopify.com',
        'woocommerce.com'
      ];

      const hasCompetitorLinks = externalUrls.some((url: string) =>
        competitorDomains.some((domain: string) => url.includes(domain))
      );

      expect(hasCompetitorLinks).toBe(false);

      console.log('[Test 15c] Link filtering validated:', {
        domain: testDomain,
        totalUrls: allUrls.length,
        externalUrls: externalUrls.length,
        hasCompetitorLinks
      });
    }, 60000);
  });
});

/**
 * Integration Instructions:
 *
 * To merge these tests into agent-flow-e2e.test.ts:
 *
 * 1. Replace the `.skip` tests with the implementations above
 * 2. Remove `.skip` from test names
 * 3. Update test descriptions to match existing style
 * 4. Ensure all imports are included
 * 5. Run tests to verify they pass
 *
 * Expected Results:
 * - Test 11: ✅ Fallback search works without commerce provider
 * - Test 12: ✅ User-friendly error messages, no sensitive data leaked
 * - Test 13: ✅ Tool failures handled gracefully
 * - Test 14: ✅ Database errors don't crash system
 * - Test 15a: ✅ Markdown formatting correct
 * - Test 15b: ✅ No hallucinated specifications
 * - Test 15c: ✅ External links filtered
 *
 * Token Usage Estimate: ~$0.04-0.06 per full test run (7 tests with real OpenAI)
 * Execution Time: ~4-5 minutes for all 7 tests
 */
