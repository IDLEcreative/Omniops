/**
 * Result Consolidator - Enrichment Tests (Basic)
 *
 * Validates consolidateResults() for basic product enrichment with scraped content,
 * description merging, and source tracking.
 */

import type { CommerceProduct } from '@/lib/search/result-consolidator';
import { consolidateResults } from '@/lib/search/result-consolidator';
import {
  createMockProduct,
  createMockScrapedPage,
} from './helpers/consolidator-test-helpers';

describe('Result Consolidator - Enrichment (Basic)', () => {
  describe('consolidateResults - Basic enrichment', () => {
    it('should enrich product with matched page', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          content: 'Additional technical specifications',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].scrapedPage?.content).toContain('technical specifications');
    });

    it('should merge descriptions (product + scraped content)', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        short_description: 'Industrial pump',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          content: 'Additional details from website',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].enrichedDescription).toContain('Industrial pump');
      expect(result[0].enrichedDescription).toContain('Additional details from website');
    });

    it('should use description when short_description is missing', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        short_description: undefined,
        description: 'Full product description',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          content: 'Scraped content',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].enrichedDescription).toContain('Full product description');
      expect(result[0].enrichedDescription).toContain('Scraped content');
    });

    it('should handle product with no description', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        short_description: undefined,
        description: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          content: 'Scraped content only',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].enrichedDescription).toBe('Scraped content only');
    });
  });

  describe('consolidateResults - Similarity calculation', () => {
    it('should calculate finalSimilarity from product similarity', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        similarity: 0.95,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.85,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].finalSimilarity).toBe(0.95);
    });

    it('should fallback to page similarity when product similarity missing', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        similarity: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.85,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].finalSimilarity).toBe(0.85);
    });

    it('should use 0 when both similarities are missing', () => {
      const product = createMockProduct({
        slug: 'pump-a',
        similarity: undefined,
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: undefined,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].finalSimilarity).toBe(0);
    });
  });

  describe('consolidateResults - Source flags', () => {
    it('should set sources flags correctly with all sources', () => {
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
          similarity: 0.80,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].sources).toEqual({
        liveData: true,
        scrapedContent: true,
        relatedContent: true,
      });
    });

    it('should set sources flags correctly with only live data', () => {
      const product = createMockProduct({
        name: 'Unique Product XYZ999',
        slug: 'unique-product-xyz999',
        permalink: 'https://example.com/unique-xyz999',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/completely-different-page',
          title: 'Completely Unrelated Topic',
          similarity: 0.50,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].sources).toEqual({
        liveData: true,
        scrapedContent: false,
        relatedContent: false,
      });
    });

    it('should handle product with matched page but no related pages', () => {
      const product = createMockProduct({
        slug: 'pump-a',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/products/pump-a',
          similarity: 0.95,
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0].scrapedPage).toBeDefined();
      expect(result[0].relatedPages).toHaveLength(0);
      expect(result[0].sources).toEqual({
        liveData: true,
        scrapedContent: true,
        relatedContent: false,
      });
    });
  });

  describe('consolidateResults - Multiple products and edge cases', () => {
    it('should handle multiple products', () => {
      const products = [
        createMockProduct({ id: 1, slug: 'pump-a' }),
        createMockProduct({ id: 2, slug: 'pump-b' }),
        createMockProduct({ id: 3, slug: 'pump-c' }),
      ];
      const pages = [
        createMockScrapedPage({ url: 'https://example.com/pump-a', similarity: 0.90 }),
        createMockScrapedPage({ url: 'https://example.com/pump-b', similarity: 0.85 }),
        createMockScrapedPage({ url: 'https://example.com/pump-c', similarity: 0.80 }),
      ];

      const result = consolidateResults(products, pages);

      expect(result).toHaveLength(3);
      expect(result[0].scrapedPage?.url).toContain('pump-a');
      expect(result[1].scrapedPage?.url).toContain('pump-b');
      expect(result[2].scrapedPage?.url).toContain('pump-c');
    });

    it('should preserve all original product properties', () => {
      const product = createMockProduct({
        id: 123,
        name: 'Test Pump',
        slug: 'test-pump',
        price: '999.99',
        sku: 'SKU-001',
        stock_status: 'instock',
      });
      const pages = [
        createMockScrapedPage({
          url: 'https://example.com/test-pump',
        }),
      ];

      const result = consolidateResults([product], pages);

      expect(result[0]).toMatchObject({
        id: 123,
        name: 'Test Pump',
        slug: 'test-pump',
        price: '999.99',
        sku: 'SKU-001',
        stock_status: 'instock',
      });
    });

    it('should handle empty products array', () => {
      const products: CommerceProduct[] = [];
      const pages = [createMockScrapedPage()];

      const result = consolidateResults(products, pages);

      expect(result).toEqual([]);
    });

    it('should handle empty scraped results', () => {
      const products = [createMockProduct()];
      const pages: any[] = [];

      const result = consolidateResults(products, pages);

      expect(result).toHaveLength(1);
      expect(result[0].scrapedPage).toBeUndefined();
      expect(result[0].relatedPages).toHaveLength(0);
    });
  });
});
