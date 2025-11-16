/**
 * Result Consolidator - Enrichment Tests (Edge Cases)
 *
 * Validates consolidateResults() for edge cases and error handling scenarios.
 */

import type { CommerceProduct } from '@/lib/search/result-consolidator';
import { consolidateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Enrichment (Edge Cases & Error Handling)', () => {
  describe('Edge cases with extreme data', () => {
    it('should handle products with very long descriptions', () => {
      const longDescription = 'A'.repeat(10000);
      const product = createMockProduct({
        slug: 'pump-a',
        short_description: longDescription,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          content: 'Additional content',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].enrichedDescription).toContain(longDescription);
      expect(result[0].enrichedDescription).toContain('Additional content');
    });

    it('should handle special characters in product names', () => {
      const product = createMockProduct({
        name: 'Pump™ A-100® (Special Edition)',
        slug: 'pump-a-100',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a-100',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].name).toBe('Pump™ A-100® (Special Edition)');
    });

    it('should handle very high similarity scores (>95%)', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        similarity: 0.98,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.97,
        }),
        createMockScrapedPage({
          url: 'https://example.com/related',
          similarity: 0.96,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].finalSimilarity).toBe(0.98);
      expect(result[0].relatedPages[0].similarity).toBe(0.96);
    });

    it('should handle very low similarity scores (<75%)', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        similarity: 0.40,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.50,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].finalSimilarity).toBe(0.40);
      expect(result[0].relatedPages).toHaveLength(0);
    });
  });

  describe('Multiple products with same pages', () => {
    it('should handle multiple products matching same page', () => {
      const products = [
        createMockProduct({ id: 1, slug: 'pump', name: 'Pump A' }),
        createMockProduct({ id: 2, slug: 'pump', name: 'Pump B' }),
      ];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump',
        }),
      ];

      const result = consolidateResults(products, pages);

      expect(result[0].scrapedPage?.url).toBe('https://example.com/products/pump');
      expect(result[1].scrapedPage?.url).toBe('https://example.com/products/pump');
    });
  });

  describe('Missing or incomplete product data', () => {
    it('should handle products with missing required fields', () => {
      const product = {
        id: 1,
        name: 'Minimal Product',
      } as CommerceProduct;
      const pages = [createMockScrapedPage()];

      const result = consolidateResults([product], pages);

      expect(result).toHaveLength(1);
      expect(result[0].scrapedPage).toBeUndefined();
      expect(result[0].enrichedDescription).toBe('');
    });
  });
});
