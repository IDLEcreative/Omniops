/**
 * Tests for Multi-Signal Result Ranking
 * Verifies all ranking signals and weighted scoring
 */

import {
  calculateStockSignal,
  calculatePriceSignal,
  calculatePopularitySignal,
  calculateRecencySignal,
  calculateFinalScore,
  generateRankingExplanation,
  rankProducts,
  extractBudgetFromQuery,
  type RankingSignal,
  type RankingWeights
} from '@/lib/search/result-ranker';
import type { CommerceProduct } from '@/types/supabase/commerce';

describe('Result Ranker - Signal Calculations', () => {
  describe('calculateStockSignal', () => {
    it('should return 1.0 for in stock products', () => {
      const product = { stock_status: 'instock' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(1.0);
    });

    it('should return 1.0 for "in stock" with space', () => {
      const product = { stock_status: 'in stock' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(1.0);
    });

    it('should return 0.5 for backorder products', () => {
      const product = { stock_status: 'onbackorder' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(0.5);
    });

    it('should return 0.5 for "on backorder" with space', () => {
      const product = { stock_status: 'on backorder' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(0.5);
    });

    it('should return 0.0 for out of stock products', () => {
      const product = { stock_status: 'outofstock' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(0.0);
    });

    it('should return 0.5 for unknown stock status', () => {
      const product = { stock_status: null } as unknown as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(0.5);
    });

    it('should return 0.5 for empty stock status', () => {
      const product = { stock_status: '' } as CommerceProduct;
      expect(calculateStockSignal(product)).toBe(0.5);
    });
  });

  describe('calculatePriceSignal', () => {
    it('should return 1.0 when price is within budget', () => {
      expect(calculatePriceSignal(50, 100)).toBe(1.0);
    });

    it('should return 1.0 when price equals budget', () => {
      expect(calculatePriceSignal(100, 100)).toBe(1.0);
    });

    it('should return 1.0 when no budget is specified', () => {
      expect(calculatePriceSignal(500, undefined)).toBe(1.0);
    });

    it('should return 0.5 when no price is available', () => {
      expect(calculatePriceSignal(null, 100)).toBe(0.5);
    });

    it('should decrease linearly when price exceeds budget', () => {
      // 25% over budget
      expect(calculatePriceSignal(125, 100)).toBe(0.75);

      // 50% over budget
      expect(calculatePriceSignal(150, 100)).toBe(0.5);

      // 75% over budget
      expect(calculatePriceSignal(175, 100)).toBe(0.25);
    });

    it('should return 0.0 when price is more than 2x budget', () => {
      expect(calculatePriceSignal(250, 100)).toBe(0.0);
    });
  });

  describe('calculatePopularitySignal', () => {
    it('should return 0.1 for products with no sales', () => {
      expect(calculatePopularitySignal(0)).toBe(0.1);
    });

    it('should use logarithmic scaling', () => {
      // 1 sale
      const score1 = calculatePopularitySignal(1);
      expect(score1).toBeGreaterThan(0.1);
      expect(score1).toBeLessThan(0.5);

      // 10 sales
      const score10 = calculatePopularitySignal(10);
      expect(score10).toBeGreaterThan(score1);
      expect(score10).toBeLessThan(0.7);

      // 100 sales
      const score100 = calculatePopularitySignal(100);
      expect(score100).toBeGreaterThan(score10);
      expect(score100).toBeLessThan(1.0);

      // 1000+ sales = max score
      const score1000 = calculatePopularitySignal(1000);
      expect(score1000).toBe(1.0);
    });

    it('should cap at 1.0', () => {
      expect(calculatePopularitySignal(10000)).toBe(1.0);
    });

    it('should have minimum of 0.1', () => {
      expect(calculatePopularitySignal(-5)).toBe(0.1);
    });
  });

  describe('calculateRecencySignal', () => {
    it('should return 1.0 for products less than 30 days old', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

      expect(calculateRecencySignal(recentDate.toISOString())).toBe(1.0);
    });

    it('should return 0.8 for products 30-90 days old', () => {
      const date = new Date();
      date.setDate(date.getDate() - 60); // 60 days ago

      expect(calculateRecencySignal(date.toISOString())).toBe(0.8);
    });

    it('should return 0.6 for products 90-180 days old', () => {
      const date = new Date();
      date.setDate(date.getDate() - 120); // 120 days ago

      expect(calculateRecencySignal(date.toISOString())).toBe(0.6);
    });

    it('should return 0.4 for products 180-365 days old', () => {
      const date = new Date();
      date.setDate(date.getDate() - 270); // 270 days ago

      expect(calculateRecencySignal(date.toISOString())).toBe(0.4);
    });

    it('should return 0.2 for products over 1 year old', () => {
      const date = new Date();
      date.setDate(date.getDate() - 400); // 400 days ago

      expect(calculateRecencySignal(date.toISOString())).toBe(0.2);
    });

    it('should prefer modified date over created date', () => {
      const oldCreated = new Date();
      oldCreated.setDate(oldCreated.getDate() - 400); // 400 days ago

      const recentModified = new Date();
      recentModified.setDate(recentModified.getDate() - 15); // 15 days ago

      const score = calculateRecencySignal(
        oldCreated.toISOString(),
        recentModified.toISOString()
      );

      expect(score).toBe(1.0); // Based on recent modification
    });

    it('should return 0.5 for unknown dates', () => {
      expect(calculateRecencySignal(undefined)).toBe(0.5);
    });
  });
});

describe('Result Ranker - Score Calculation', () => {
  describe('calculateFinalScore', () => {
    it('should combine all signals with default weights', () => {
      const signals: RankingSignal = {
        semanticSimilarity: 0.9,
        keywordMatch: 0.8,
        stockAvailability: 1.0,
        priceMatch: 1.0,
        popularity: 0.7,
        recency: 1.0
      };

      const score = calculateFinalScore(signals);

      // Expected: 0.9*0.4 + 0.8*0.25 + 1.0*0.2 + 1.0*0.1 + 0.7*0.03 + 1.0*0.02
      // = 0.36 + 0.2 + 0.2 + 0.1 + 0.021 + 0.02 = 0.901
      expect(score).toBeCloseTo(0.901, 2);
    });

    it('should use custom weights when provided', () => {
      const signals: RankingSignal = {
        semanticSimilarity: 1.0,
        keywordMatch: 0.0,
        stockAvailability: 0.0,
        priceMatch: 0.0,
        popularity: 0.0,
        recency: 0.0
      };

      const customWeights: RankingWeights = {
        semanticSimilarity: 1.0, // 100% weight on semantic
        keywordMatch: 0.0,
        stockAvailability: 0.0,
        priceMatch: 0.0,
        popularity: 0.0,
        recency: 0.0
      };

      const score = calculateFinalScore(signals, customWeights);
      expect(score).toBe(1.0);
    });

    it('should handle all zero signals', () => {
      const signals: RankingSignal = {
        semanticSimilarity: 0.0,
        keywordMatch: 0.0,
        stockAvailability: 0.0,
        priceMatch: 0.0,
        popularity: 0.0,
        recency: 0.0
      };

      const score = calculateFinalScore(signals);
      expect(score).toBe(0.0);
    });
  });

  describe('generateRankingExplanation', () => {
    it('should explain excellent semantic match', () => {
      const signals: RankingSignal = {
        semanticSimilarity: 0.95,
        keywordMatch: 0.5,
        stockAvailability: 0.5,
        priceMatch: 0.5,
        popularity: 0.5,
        recency: 0.5
      };

      const explanation = generateRankingExplanation(signals, 0.9);
      expect(explanation).toContain('Excellent semantic match');
    });

    it('should explain good semantic match', () => {
      const signals: RankingSignal = {
        semanticSimilarity: 0.75,
        keywordMatch: 0.5,
        stockAvailability: 0.5,
        priceMatch: 0.5,
        popularity: 0.5,
        recency: 0.5
      };

      const explanation = generateRankingExplanation(signals, 0.7);
      expect(explanation).toContain('Good semantic match');
    });

    it('should explain stock status', () => {
      const inStockSignals: RankingSignal = {
        semanticSimilarity: 0.5,
        keywordMatch: 0.5,
        stockAvailability: 1.0,
        priceMatch: 0.5,
        popularity: 0.5,
        recency: 0.5
      };

      expect(generateRankingExplanation(inStockSignals, 0.6)).toContain('In stock');

      const backorderSignals = { ...inStockSignals, stockAvailability: 0.5 };
      expect(generateRankingExplanation(backorderSignals, 0.5)).toContain('Available on backorder');

      const outOfStockSignals = { ...inStockSignals, stockAvailability: 0.0 };
      expect(generateRankingExplanation(outOfStockSignals, 0.4)).toContain('Currently out of stock');
    });

    it('should explain price match', () => {
      const withinBudget: RankingSignal = {
        semanticSimilarity: 0.5,
        keywordMatch: 0.5,
        stockAvailability: 0.5,
        priceMatch: 1.0,
        popularity: 0.5,
        recency: 0.5
      };

      expect(generateRankingExplanation(withinBudget, 0.6)).toContain('Within budget');

      const aboveBudget = { ...withinBudget, priceMatch: 0.3 };
      expect(generateRankingExplanation(aboveBudget, 0.4)).toContain('Above budget');
    });

    it('should explain popularity', () => {
      const popular: RankingSignal = {
        semanticSimilarity: 0.5,
        keywordMatch: 0.5,
        stockAvailability: 0.5,
        priceMatch: 0.5,
        popularity: 0.8,
        recency: 0.5
      };

      expect(generateRankingExplanation(popular, 0.6)).toContain('Popular choice');
    });

    it('should explain recency', () => {
      const recent: RankingSignal = {
        semanticSimilarity: 0.5,
        keywordMatch: 0.5,
        stockAvailability: 0.5,
        priceMatch: 0.5,
        popularity: 0.5,
        recency: 0.9
      };

      expect(generateRankingExplanation(recent, 0.6)).toContain('Recently added/updated');
    });

    it('should return generic message when no special conditions', () => {
      const average: RankingSignal = {
        semanticSimilarity: 0.5, // Not high enough for "good match"
        keywordMatch: 0.5,
        stockAvailability: 0.6, // Not exactly 0.0, 0.5, or 1.0 to avoid stock messages
        priceMatch: 0.6, // Not 1.0 or <0.5 to avoid price messages
        popularity: 0.5, // Not >0.7 to avoid popularity message
        recency: 0.5 // Not >0.8 to avoid recency message
      };

      const explanation = generateRankingExplanation(average, 0.5);
      expect(explanation).toBe('Relevant result');
    });
  });
});

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

describe('Result Ranker - Budget Extraction', () => {
  describe('extractBudgetFromQuery', () => {
    it('should extract budget from "under £X" queries', () => {
      expect(extractBudgetFromQuery('Show me pumps under £100')).toBe(100);
      expect(extractBudgetFromQuery('under £50')).toBe(50);
      expect(extractBudgetFromQuery('under 75')).toBe(75);
    });

    it('should extract budget from "less than" queries', () => {
      expect(extractBudgetFromQuery('less than £100')).toBe(100);
      expect(extractBudgetFromQuery('less than $50')).toBe(50);
      expect(extractBudgetFromQuery('less than 200')).toBe(200);
    });

    it('should extract budget from "budget of" queries', () => {
      expect(extractBudgetFromQuery('I have a budget of £150')).toBe(150);
      expect(extractBudgetFromQuery('budget of $75')).toBe(75);
      expect(extractBudgetFromQuery('budget 100')).toBe(100);
    });

    it('should extract budget from "around" queries', () => {
      expect(extractBudgetFromQuery('around £50')).toBe(50);
      expect(extractBudgetFromQuery('around €75')).toBe(75);
    });

    it('should extract budget from "up to" queries', () => {
      expect(extractBudgetFromQuery('up to £200')).toBe(200);
      expect(extractBudgetFromQuery('up to $100')).toBe(100);
    });

    it('should extract budget from "max" queries', () => {
      expect(extractBudgetFromQuery('max £150')).toBe(150);
      expect(extractBudgetFromQuery('maximum $200')).toBe(200);
    });

    it('should handle decimal values', () => {
      expect(extractBudgetFromQuery('under £99.99')).toBe(99.99);
      expect(extractBudgetFromQuery('budget of $49.50')).toBe(49.50);
    });

    it('should return undefined when no budget is found', () => {
      expect(extractBudgetFromQuery('Show me hydraulic pumps')).toBeUndefined();
      expect(extractBudgetFromQuery('What products do you have?')).toBeUndefined();
      expect(extractBudgetFromQuery('')).toBeUndefined();
    });

    it('should be case insensitive', () => {
      expect(extractBudgetFromQuery('UNDER £100')).toBe(100);
      expect(extractBudgetFromQuery('Less Than $50')).toBe(50);
      expect(extractBudgetFromQuery('BUDGET OF 75')).toBe(75);
    });
  });
});
