/**
 * Result Consolidator - Matching Tests (Name Similarity)
 *
 * Validates product-to-page matching by name similarity.
 * Tests matchProductWithPage() indirectly via consolidateResults().
 */

import { consolidateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Matching (Name Similarity)', () => {
  describe('name similarity matching', () => {
    it('should match product by name similarity when product name in title', () => {
      const product = createMockProduct({
        name: 'Hydraulic Pump XYZ',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/some-page',
          title: 'Hydraulic Pump XYZ - Product Guide',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
    });

    it('should match product when title appears in product name', () => {
      const product = createMockProduct({
        name: 'Complete Hydraulic Pump XYZ Installation Kit',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/page',
          title: 'Hydraulic Pump XYZ',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
    });

    it('should match product by normalized name (ignoring special characters)', () => {
      const product = createMockProduct({
        name: 'Pump A-100™',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/page',
          title: 'Pump A100',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
    });

    it('should match when product name appears in URL', () => {
      const product = createMockProduct({
        name: 'Special Motor',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/specialmotor',
          title: 'Different Title',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
    });

    it('should handle unicode and special characters in matching', () => {
      const product = createMockProduct({
        name: 'Café Münchën Pump™',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/cafmnchnpump',
          title: 'Cafe Munchen Pump',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
    });
  });

  describe('no match scenarios', () => {
    it('should return undefined when no match found', () => {
      const product = createMockProduct({
        name: 'Unrelated Product',
        slug: 'unrelated',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/different-page',
          title: 'Completely Different',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeUndefined();
      expect(result[0].sources.scrapedContent).toBe(false);
    });

    it('should handle product with missing slug, permalink, and name', () => {
      const product = createMockProduct({
        name: '',
        slug: undefined,
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/completely-different-url',
          title: 'Completely Different Title',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0]).toBeDefined();
    });

    it('should return best match when multiple potential matches exist', () => {
      const product = createMockProduct({
        slug: 'pump-123',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-123',
          title: 'Pump 123',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/pump-123-alternative',
          title: 'Pump Alternative',
          similarity: 0.75,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage?.url).toBe('https://example.com/products/pump-123');
    });
  });
});
