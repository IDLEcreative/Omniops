/**
 * Result Consolidator - Finding Related Pages Tests
 *
 * Validates finding and filtering related pages by similarity threshold.
 * Tests findRelatedPages() indirectly via consolidateResults().
 */

import { consolidateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Finding Related Pages', () => {
  describe('findRelatedPages (tested indirectly via consolidateResults)', () => {
    it('should find pages above similarity threshold (70%)', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          title: 'Pump A',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/installation-guide',
          title: 'Installation Guide',
          similarity: 0.85,
        }),
        createMockScrapedPage({
          url: 'https://example.com/maintenance',
          title: 'Maintenance Tips',
          similarity: 0.75,
        }),
        createMockScrapedPage({
          url: 'https://example.com/unrelated',
          title: 'Unrelated',
          similarity: 0.50,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(2);
      expect(result[0].relatedPages[0].similarity).toBe(0.85);
      expect(result[0].relatedPages[1].similarity).toBe(0.75);
      expect(result[0].sources.relatedContent).toBe(true);
    });

    it('should sort related pages by similarity (highest first)', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/page1',
          similarity: 0.72,
        }),
        createMockScrapedPage({
          url: 'https://example.com/page2',
          similarity: 0.88,
        }),
        createMockScrapedPage({
          url: 'https://example.com/page3',
          similarity: 0.80,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(3);
      expect(result[0].relatedPages[0].similarity).toBe(0.88);
      expect(result[0].relatedPages[1].similarity).toBe(0.80);
      expect(result[0].relatedPages[2].similarity).toBe(0.72);
    });

    it('should limit to max 3 related pages', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
        createMockScrapedPage({ url: 'https://example.com/page1', similarity: 0.90 }),
        createMockScrapedPage({ url: 'https://example.com/page2', similarity: 0.85 }),
        createMockScrapedPage({ url: 'https://example.com/page3', similarity: 0.80 }),
        createMockScrapedPage({ url: 'https://example.com/page4', similarity: 0.75 }),
        createMockScrapedPage({ url: 'https://example.com/page5', similarity: 0.72 }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(3);
      expect(result[0].relatedPages[0].similarity).toBe(0.90);
      expect(result[0].relatedPages[2].similarity).toBe(0.80);
    });

    it('should exclude matched page from related pages', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/related',
          similarity: 0.85,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage?.url).toContain('pump-a');
      expect(result[0].relatedPages).toHaveLength(1);
      expect(result[0].relatedPages[0].url).toContain('related');
    });

    it('should handle empty scraped results', () => {
      const product = createMockProduct();
      const pages: any[] = [];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(0);
      expect(result[0].sources.relatedContent).toBe(false);
    });

    it('should handle no pages meeting threshold', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/low1',
          similarity: 0.50,
        }),
        createMockScrapedPage({
          url: 'https://example.com/low2',
          similarity: 0.30,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(0);
      expect(result[0].sources.relatedContent).toBe(false);
    });

    it('should handle pages with undefined similarity scores', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
        createMockScrapedPage({
          url: 'https://example.com/page1',
          similarity: undefined,
        }),
        createMockScrapedPage({
          url: 'https://example.com/page2',
          similarity: 0.80,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].relatedPages).toHaveLength(1);
      expect(result[0].relatedPages[0].url).toContain('page2');
    });
  });
});
