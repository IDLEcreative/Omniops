/**
 * Tests for Final Score Calculation and Explanations
 * Verifies weighted score combination and ranking explanations
 */

import {
  calculateFinalScore,
  generateRankingExplanation,
  type RankingSignal,
  type RankingWeights
} from '@/lib/search/result-ranker';

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
