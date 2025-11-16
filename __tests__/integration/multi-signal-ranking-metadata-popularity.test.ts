/**
 * Multi-Signal Ranking E2E Integration Tests - Metadata & Popularity
 *
 * Tests ranking metadata structure and popularity/recency signals.
 */

import { describe, it, expect } from '@jest/globals';
import { rankProducts } from '@/lib/search/result-ranker';
import type { CommerceProduct } from '@/lib/search/result-consolidator';
import { createMockProduct } from '@/test-utils/api-test-helpers';

describe('Multi-Signal Ranking - Metadata & Popularity', () => {
  /**
   * TEST 1: Ranking Metadata in Results
   *
   * Validates that ranked products include complete metadata:
   * - finalScore (weighted sum of all signals)
   * - rankingSignals (breakdown of individual signals)
   * - rankingExplanation (human-readable description)
   */
  describe('Ranking Metadata', () => {
    it('should include ranking metadata in results', () => {
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            name: 'Test Product',
            price: '50.00',
            stock_status: 'instock',
            total_sales: 100,
            date_created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          similarity: 0.9,
          relevance: 0.85,
        },
      ];

      const rankedProducts = rankProducts(products, { userBudget: 100 });

      expect(rankedProducts).toHaveLength(1);
      const product = rankedProducts[0];

      // Verify finalScore exists and is a number
      expect(product.finalScore).toBeDefined();
      expect(typeof product.finalScore).toBe('number');
      expect(product.finalScore).toBeGreaterThan(0);
      expect(product.finalScore).toBeLessThanOrEqual(1);

      // Verify rankingSignals breakdown
      expect(product.rankingSignals).toBeDefined();
      expect(product.rankingSignals.semanticSimilarity).toBe(0.9);
      expect(product.rankingSignals.keywordMatch).toBe(0.85);
      expect(product.rankingSignals.stockAvailability).toBe(1.0);
      expect(product.rankingSignals.priceMatch).toBe(1.0);
      expect(typeof product.rankingSignals.popularity).toBe('number');
      expect(typeof product.rankingSignals.recency).toBe('number');

      // Verify rankingExplanation is human-readable
      expect(product.rankingExplanation).toBeDefined();
      expect(typeof product.rankingExplanation).toBe('string');
      expect(product.rankingExplanation.length).toBeGreaterThan(0);
    });

    it('should generate descriptive ranking explanations', () => {
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            name: 'Popular New Product',
            price: '30.00',
            stock_status: 'instock',
            total_sales: 1000, // High popularity
            date_created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Recent
          }),
          similarity: 0.95, // Excellent match
          relevance: 0.9,
        },
      ];

      const rankedProducts = rankProducts(products, { userBudget: 50 });
      const explanation = rankedProducts[0].rankingExplanation;

      // Explanation should mention key signals
      expect(explanation).toMatch(/excellent semantic match|good semantic match/i);
      expect(explanation).toMatch(/in stock/i);
      expect(explanation).toMatch(/within budget/i);
      expect(explanation).toMatch(/popular choice/i);
      expect(explanation).toMatch(/recently added/i);
    });
  });

  /**
   * TEST 2: Popularity and Recency Signals
   *
   * Validates that popularity (based on sales) and recency (based on date)
   * provide appropriate boosts using logarithmic and time-decay functions.
   */
  describe('Popularity and Recency Signals', () => {
    it('should boost popular products with high sales', () => {
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({ id: 1, total_sales: 0 }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({ id: 2, total_sales: 10 }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({ id: 3, total_sales: 100 }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({ id: 4, total_sales: 1000 }),
          similarity: 0.8,
        },
      ];

      const rankedProducts = rankProducts(products);

      // Verify logarithmic popularity scaling
      expect(rankedProducts[0].rankingSignals.popularity).toBeGreaterThan(
        rankedProducts[1].rankingSignals.popularity
      );
      expect(rankedProducts[1].rankingSignals.popularity).toBeGreaterThan(
        rankedProducts[2].rankingSignals.popularity
      );
      expect(rankedProducts[2].rankingSignals.popularity).toBeGreaterThan(
        rankedProducts[3].rankingSignals.popularity
      );

      // Popular products should rank higher
      expect(rankedProducts[0].id).toBe(4); // 1000 sales
      expect(rankedProducts[3].id).toBe(1); // 0 sales
    });

    it('should boost recent products over old ones', () => {
      const now = Date.now();
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            date_created: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 2,
            date_created: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 3,
            date_created: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 4,
            date_created: new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days
          }),
          similarity: 0.8,
        },
      ];

      const rankedProducts = rankProducts(products);

      // Verify recency decay: newer = higher score
      expect(rankedProducts[0].rankingSignals.recency).toBe(1.0); // <30 days
      expect(rankedProducts[1].rankingSignals.recency).toBe(0.8); // 60 days (1-3 months)
      expect(rankedProducts[2].rankingSignals.recency).toBe(0.4); // 200 days (6-12 months)
      expect(rankedProducts[3].rankingSignals.recency).toBe(0.2); // 400 days (>1 year)

      // Recent products should rank higher
      expect(rankedProducts[0].id).toBe(1);
      expect(rankedProducts[1].id).toBe(2);
      expect(rankedProducts[2].id).toBe(3);
      expect(rankedProducts[3].id).toBe(4);
    });

    it('should use date_modified if more recent than date_created', () => {
      const now = Date.now();
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            date_created: new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString(), // Old
            date_modified: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // Recently updated
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 2,
            date_created: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), // Recent
          }),
          similarity: 0.8,
        },
      ];

      const rankedProducts = rankProducts(products);

      // Product 1 should get high recency score due to recent update
      expect(rankedProducts[0].rankingSignals.recency).toBe(1.0);
      expect(rankedProducts[1].rankingSignals.recency).toBe(1.0);
    });
  });
});
