/**
 * Tests for Product Ranking Function
 * Verifies rankProducts with various scenarios and edge cases
 */

import {
  rankProducts,
  type RankingWeights
} from '@/lib/search/result-ranker';
import type { CommerceProduct } from '@/types/supabase/commerce';

describe('Result Ranker - Product Ranking', () => {
  const createMockProduct = (overrides: Partial<CommerceProduct> = {}): CommerceProduct => ({
    id: '1',
    name: 'Test Product',
    description: 'Test description',
    short_description: 'Short desc',
    price: '£50.00',
    regular_price: '£50.00',
    sale_price: null,
    stock_status: 'instock',
    total_sales: 10,
    date_created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    date_modified: new Date().toISOString(),
    permalink: 'http://example.com/product',
    images: [],
    categories: [],
    similarity: 0.8,
    relevance: 0.7,
    ...overrides
  });

  describe('rankProducts', () => {
    it('should rank products by final score', () => {
      const products = [
        createMockProduct({
          id: '1',
          name: 'Low score product',
          similarity: 0.5,
          relevance: 0.5,
          stock_status: 'outofstock',
          total_sales: 0
        }),
        createMockProduct({
          id: '2',
          name: 'High score product',
          similarity: 0.95,
          relevance: 0.9,
          stock_status: 'instock',
          total_sales: 100
        }),
        createMockProduct({
          id: '3',
          name: 'Medium score product',
          similarity: 0.7,
          relevance: 0.7,
          stock_status: 'instock',
          total_sales: 50
        })
      ];

      const ranked = rankProducts(products);

      // Verify order: high > medium > low
      expect(ranked[0].id).toBe('2');
      expect(ranked[1].id).toBe('3');
      expect(ranked[2].id).toBe('1');

      // Verify scores are calculated
      expect(ranked[0].finalScore).toBeGreaterThan(ranked[1].finalScore);
      expect(ranked[1].finalScore).toBeGreaterThan(ranked[2].finalScore);
    });

    it('should include ranking signals in results', () => {
      const products = [createMockProduct()];
      const ranked = rankProducts(products);

      expect(ranked[0].rankingSignals).toBeDefined();
      expect(ranked[0].rankingSignals.semanticSimilarity).toBeDefined();
      expect(ranked[0].rankingSignals.keywordMatch).toBeDefined();
      expect(ranked[0].rankingSignals.stockAvailability).toBeDefined();
      expect(ranked[0].rankingSignals.priceMatch).toBeDefined();
      expect(ranked[0].rankingSignals.popularity).toBeDefined();
      expect(ranked[0].rankingSignals.recency).toBeDefined();
    });

    it('should include ranking explanation in results', () => {
      const products = [createMockProduct({ similarity: 0.95, stock_status: 'instock' })];
      const ranked = rankProducts(products);

      expect(ranked[0].rankingExplanation).toBeDefined();
      expect(typeof ranked[0].rankingExplanation).toBe('string');
      expect(ranked[0].rankingExplanation.length).toBeGreaterThan(0);
    });

    it('should apply budget-based ranking when budget is provided', () => {
      const products = [
        createMockProduct({ id: '1', price: '£200.00', similarity: 0.9 }), // Over budget
        createMockProduct({ id: '2', price: '£50.00', similarity: 0.85 })  // Within budget
      ];

      const ranked = rankProducts(products, { userBudget: 100 });

      // Product 2 should rank higher due to budget match
      // even though product 1 has slightly higher semantic similarity
      expect(ranked[0].id).toBe('2');
      expect(ranked[0].rankingSignals.priceMatch).toBe(1.0);
      expect(ranked[1].rankingSignals.priceMatch).toBeLessThan(1.0);
    });

    it('should use custom weights when provided', () => {
      const products = [
        createMockProduct({ id: '1', similarity: 0.6, stock_status: 'instock' }),
        createMockProduct({ id: '2', similarity: 0.9, stock_status: 'outofstock' })
      ];

      // Prioritize stock over similarity
      const customWeights: Partial<RankingWeights> = {
        semanticSimilarity: 0.1,
        stockAvailability: 0.8
      };

      const ranked = rankProducts(products, { weights: customWeights });

      // Product 1 should rank higher due to stock availability
      expect(ranked[0].id).toBe('1');
    });

    it('should handle empty product list', () => {
      const ranked = rankProducts([]);
      expect(ranked).toEqual([]);
    });

    it('should handle products with missing data gracefully', () => {
      const incompleteProduct = createMockProduct({
        price: null,
        stock_status: null,
        total_sales: undefined,
        date_created: undefined
      });

      const ranked = rankProducts([incompleteProduct]);

      expect(ranked).toHaveLength(1);
      expect(ranked[0].finalScore).toBeGreaterThan(0);
      expect(ranked[0].rankingSignals.priceMatch).toBe(0.5); // Unknown price
      expect(ranked[0].rankingSignals.stockAvailability).toBe(0.5); // Unknown stock
    });
  });
});
