/**
 * Result Consolidator - Matching Tests (Slug & Permalink)
 *
 * Validates product-to-page matching by slug and permalink.
 * Tests matchProductWithPage() indirectly via consolidateResults().
 */

import { consolidateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Matching (Slug & Permalink)', () => {
  describe('slug matching', () => {
    it('should match product by exact slug', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          title: 'Pump A',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.url).toContain('pump-a');
      expect(result[0].sources.scrapedContent).toBe(true);
    });

    it('should match product by slug case-insensitive', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/PUMP-A',
          title: 'Pump A',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.url).toContain('PUMP-A');
    });

    it('should match product by slug with partial URL match', () => {
      const product = createMockProduct({
        slug: 'zf5-pump',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/shop/hydraulics/zf5-pump/details',
          title: 'ZF5 Pump Details',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.url).toContain('zf5-pump');
    });
  });

  describe('permalink matching', () => {
    it('should match product by exact permalink', () => {
      const product = createMockProduct({
        slug: undefined,
        permalink: 'https://example.com/products/motor-b',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/motor-b',
          title: 'Motor B',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.url).toBe('https://example.com/products/motor-b');
    });

    it('should match product by partial permalink (endsWith)', () => {
      const product = createMockProduct({
        slug: undefined,
        permalink: '/products/motor-c',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/motor-c',
          title: 'Motor C',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.url).toContain('/products/motor-c');
    });

    it('should prioritize slug match over name match', () => {
      const product = createMockProduct({
        name: 'Common Name',
        slug: 'unique-slug-123',
        permalink: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/common-name',
          title: 'Common Name',
        }),
        createMockScrapedPage({
          url: 'https://example.com/products/unique-slug-123',
          title: 'Different Title',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage?.url).toContain('unique-slug-123');
    });
  });
});
