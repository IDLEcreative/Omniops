/**
 * Multi-Signal Ranking E2E Integration Tests - Budget & Stock
 *
 * Tests budget extraction and stock availability prioritization signals.
 */

import { describe, it, expect } from '@jest/globals';
import { rankProducts, extractBudgetFromQuery } from '@/lib/search/result-ranker';
import type { CommerceProduct } from '@/lib/search/result-consolidator';
import { createMockProduct } from '@/test-utils/api-test-helpers';

describe('Multi-Signal Ranking - Budget & Stock', () => {
  /**
   * TEST 1: Budget-Based Ranking with Real Product Data
   *
   * Validates that products within user's budget rank higher than
   * expensive out-of-budget products, even with similar semantic scores.
   */
  describe('Budget-Based Ranking', () => {
    it('should prioritize products within budget over expensive ones', () => {
      // Create mock products with varying prices
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            name: 'Budget Hydraulic Pump A4VTG90',
            price: '85.00',
            stock_status: 'instock',
            total_sales: 50,
            date_created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          }),
          similarity: 0.92, // High semantic similarity
          relevance: 0.9,
        },
        {
          ...createMockProduct({
            id: 2,
            name: 'Premium Hydraulic Pump ZF5',
            price: '250.00',
            stock_status: 'instock',
            total_sales: 100,
            date_created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          }),
          similarity: 0.95, // Even higher semantic similarity
          relevance: 0.95,
        },
        {
          ...createMockProduct({
            id: 3,
            name: 'Standard Hydraulic Pump BP-001',
            price: '65.00',
            stock_status: 'instock',
            total_sales: 30,
            date_created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
          }),
          similarity: 0.88, // Lower semantic similarity
          relevance: 0.85,
        },
      ];

      // Simulate query: "Show me pumps under £100"
      const query = 'Show me pumps under £100';
      const budget = extractBudgetFromQuery(query);

      expect(budget).toBe(100);

      // Rank products with budget constraint
      const rankedProducts = rankProducts(products, { userBudget: budget });

      // Verify: Budget-friendly products rank higher than expensive out-of-budget products
      expect(rankedProducts[0].id).toBe(1); // Budget Pump (within budget, high similarity)
      expect(rankedProducts[1].id).toBe(3); // Standard Pump (within budget, lower similarity)
      expect(rankedProducts[2].id).toBe(2); // Premium Pump (out of budget, despite highest similarity)

      // Verify budget extraction worked
      expect(rankedProducts[0].rankingSignals.priceMatch).toBe(1.0); // Within budget
      expect(rankedProducts[1].rankingSignals.priceMatch).toBe(1.0); // Within budget
      expect(rankedProducts[2].rankingSignals.priceMatch).toBe(0.0); // More than 2x budget
    });

    it('should extract budget from various query formats', () => {
      const queries = [
        { query: 'under £100', expected: 100 },
        { query: 'less than $50', expected: 50 },
        { query: 'budget of 200', expected: 200 },
        { query: 'around €75', expected: 75 },
        { query: 'up to £150', expected: 150 },
        { query: 'max $300', expected: 300 },
        { query: 'maximum £500', expected: 500 },
      ];

      queries.forEach(({ query, expected }) => {
        const budget = extractBudgetFromQuery(query);
        expect(budget).toBe(expected);
      });
    });
  });

  /**
   * TEST 2: Stock Availability Prioritization
   *
   * Validates that in-stock products rank higher than out-of-stock products,
   * even when out-of-stock products have higher semantic similarity.
   */
  describe('Stock Availability Prioritization', () => {
    it('should rank in-stock products higher than out-of-stock despite lower similarity', () => {
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            name: 'Perfect Match Hydraulic Pump',
            price: '99.99',
            stock_status: 'outofstock',
            total_sales: 200,
            date_created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          similarity: 0.98, // Very high semantic similarity
          relevance: 0.95,
        },
        {
          ...createMockProduct({
            id: 2,
            name: 'Good Match Hydraulic Pump',
            price: '89.99',
            stock_status: 'instock',
            total_sales: 50,
            date_created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
          similarity: 0.85, // Lower semantic similarity
          relevance: 0.8,
        },
      ];

      const rankedProducts = rankProducts(products);

      // Verify: In-stock product ranks first despite lower similarity
      expect(rankedProducts[0].id).toBe(2); // In-stock
      expect(rankedProducts[1].id).toBe(1); // Out-of-stock

      // Verify stock signals
      expect(rankedProducts[0].rankingSignals.stockAvailability).toBe(1.0); // In stock
      expect(rankedProducts[1].rankingSignals.stockAvailability).toBe(0.0); // Out of stock
    });

    it('should handle backorder stock status with moderate score', () => {
      const products: CommerceProduct[] = [
        {
          ...createMockProduct({
            id: 1,
            name: 'In Stock Product',
            stock_status: 'instock',
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 2,
            name: 'Backorder Product',
            stock_status: 'onbackorder',
          }),
          similarity: 0.8,
        },
        {
          ...createMockProduct({
            id: 3,
            name: 'Out of Stock Product',
            stock_status: 'outofstock',
          }),
          similarity: 0.8,
        },
      ];

      const rankedProducts = rankProducts(products);

      // Verify stock status ranking: instock > backorder > outofstock
      expect(rankedProducts[0].id).toBe(1);
      expect(rankedProducts[1].id).toBe(2);
      expect(rankedProducts[2].id).toBe(3);

      expect(rankedProducts[0].rankingSignals.stockAvailability).toBe(1.0);
      expect(rankedProducts[1].rankingSignals.stockAvailability).toBe(0.5);
      expect(rankedProducts[2].rankingSignals.stockAvailability).toBe(0.0);
    });
  });

  /**
   * TEST 3: Multiple Ranking Signals Combined
   *
   * Validates that all 6 signals combine correctly to produce optimal ranking.
   * Tests a complex scenario with products having different strengths/weaknesses.
   */
  describe('Multiple Signals Combined', () => {
    it('should rank products using combined signal scores', () => {
      const products: CommerceProduct[] = [
        // Product A: High similarity, expensive, old, out of stock
        {
          ...createMockProduct({
            id: 1,
            name: 'Product A - High Similarity',
            price: '500.00', // Way over budget
            stock_status: 'outofstock',
            total_sales: 5,
            date_created: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // >1 year
          }),
          similarity: 0.95,
          relevance: 0.9,
        },
        // Product B: Medium similarity, affordable, recent, in stock, popular
        {
          ...createMockProduct({
            id: 2,
            name: 'Product B - Best Overall',
            price: '75.00', // Within budget
            stock_status: 'instock',
            total_sales: 500, // Popular
            date_created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Recent
          }),
          similarity: 0.82, // Medium similarity
          relevance: 0.75,
        },
        // Product C: Low similarity, cheap, very old, in stock
        {
          ...createMockProduct({
            id: 3,
            name: 'Product C - Low Match',
            price: '25.00', // Very cheap
            stock_status: 'instock',
            total_sales: 2,
            date_created: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(), // Very old
          }),
          similarity: 0.65, // Low similarity
          relevance: 0.6,
        },
      ];

      const rankedProducts = rankProducts(products, { userBudget: 100 });

      // Verify: Product B ranks highest (best combination of signals)
      expect(rankedProducts[0].id).toBe(2); // Best overall
      expect(rankedProducts[1].id).toBe(3); // In stock, cheap, but low similarity
      expect(rankedProducts[2].id).toBe(1); // High similarity but penalized by stock/price

      // Verify Product B has balanced signals
      const productB = rankedProducts[0];
      expect(productB.rankingSignals.stockAvailability).toBe(1.0); // In stock
      expect(productB.rankingSignals.priceMatch).toBe(1.0); // Within budget
      expect(productB.rankingSignals.popularity).toBeGreaterThan(0.7); // Popular
      expect(productB.rankingSignals.recency).toBeGreaterThan(0.8); // Recent
    });
  });
});
