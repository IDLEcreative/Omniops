/**
 * Result Consolidator - Deduplication Tests
 *
 * Validates mergeAndDeduplicateResults() for identifying enriched products
 * and unique scraped pages, ensuring no duplicates in final results.
 */

import { mergeAndDeduplicateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Deduplication', () => {
  describe('mergeAndDeduplicateResults', () => {
    it('should return enriched products', () => {
      const products = [createMockProduct({ slug: 'pump-a' })];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a',
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.enrichedProducts).toHaveLength(1);
      expect(result.enrichedProducts[0]).toHaveProperty('scrapedPage');
      expect(result.enrichedProducts[0]).toHaveProperty('relatedPages');
      expect(result.enrichedProducts[0]).toHaveProperty('enrichedDescription');
      expect(result.enrichedProducts[0]).toHaveProperty('finalSimilarity');
      expect(result.enrichedProducts[0]).toHaveProperty('sources');
    });

    it('should return unique scraped pages (excluding matched ones)', () => {
      const products = [createMockProduct({ slug: 'pump-a' })];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a',
          title: 'Matched Page',
        }),
        createMockScrapedPage({
          url: 'https://example.com/other-page',
          title: 'Unique Page',
          similarity: 0.50,
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.uniqueScrapedPages).toHaveLength(1);
      expect(result.uniqueScrapedPages[0].title).toBe('Unique Page');
    });

    it('should correctly identify duplicates', () => {
      const products = [
        createMockProduct({ id: 1, slug: 'pump-a' }),
        createMockProduct({ id: 2, slug: 'pump-b' }),
      ];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a',
          title: 'Pump A',
        }),
        createMockScrapedPage({
          url: 'https://example.com/pump-b',
          title: 'Pump B',
        }),
        createMockScrapedPage({
          url: 'https://example.com/unique',
          title: 'Unique Page',
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.enrichedProducts).toHaveLength(2);
      expect(result.uniqueScrapedPages).toHaveLength(1);
      expect(result.uniqueScrapedPages[0].title).toBe('Unique Page');
    });

    it('should preserve non-matched pages', () => {
      const products = [createMockProduct({ slug: 'pump-a' })];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a',
          title: 'Matched',
        }),
        createMockScrapedPage({
          url: 'https://example.com/page1',
          title: 'Unique 1',
        }),
        createMockScrapedPage({
          url: 'https://example.com/page2',
          title: 'Unique 2',
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.uniqueScrapedPages).toHaveLength(2);
      const titles = result.uniqueScrapedPages.map(p => p.title);
      expect(titles).toContain('Unique 1');
      expect(titles).toContain('Unique 2');
    });

    it('should handle all pages matched to products', () => {
      const products = [
        createMockProduct({ id: 1, slug: 'pump-a' }),
        createMockProduct({ id: 2, slug: 'pump-b' }),
      ];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/pump-a',
        }),
        createMockScrapedPage({
          url: 'https://example.com/pump-b',
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.enrichedProducts).toHaveLength(2);
      expect(result.uniqueScrapedPages).toHaveLength(0);
    });

    it('should handle no pages matched to products', () => {
      const products = [
        createMockProduct({
          name: 'Unique Product Alpha 12345',
          slug: 'unique-product-alpha-12345',
          permalink: 'https://example.com/alpha-12345',
        }),
        createMockProduct({
          name: 'Unique Product Beta 67890',
          slug: 'unique-product-beta-67890',
          permalink: 'https://example.com/beta-67890',
        }),
      ];
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/completely-different-topic-xyz',
          title: 'Unrelated Content XYZ',
        }),
        createMockScrapedPage({
          url: 'https://example.com/another-unrelated-page-abc',
          title: 'Different Subject ABC',
        }),
      ];

      const result = mergeAndDeduplicateResults(products, pages);

      expect(result.enrichedProducts).toHaveLength(2);
      expect(result.enrichedProducts[0].scrapedPage).toBeUndefined();
      expect(result.enrichedProducts[1].scrapedPage).toBeUndefined();
      expect(result.uniqueScrapedPages).toHaveLength(2);
    });

    it('should handle empty inputs', () => {
      const result = mergeAndDeduplicateResults([], []);

      expect(result.enrichedProducts).toHaveLength(0);
      expect(result.uniqueScrapedPages).toHaveLength(0);
    });
  });
});
