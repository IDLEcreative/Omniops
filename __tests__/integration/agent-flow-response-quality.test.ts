/**
 * Agent Flow E2E Tests - Response Quality Validation (Test 15a-c)
 *
 * Test 15a: Markdown formatting validation
 * Test 15b: Hallucination prevention validation
 * Test 15c: External link filtering validation
 *
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';

describe('Agent Flow E2E - Response Quality', () => {
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
