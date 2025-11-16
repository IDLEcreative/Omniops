/**
 * Conversational Refinement: Ranking Integration and Full Journey
 *
 * Tests ranking data integration, tone validation, and complete user journeys
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationalRefinementSimulator, MockProduct } from './simulator';

describe('Conversational Refinement: Ranking and Integration', () => {
  let simulator: ConversationalRefinementSimulator;

  beforeEach(() => {
    simulator = new ConversationalRefinementSimulator();
  });

  describe('Scenario 8: Ranking Data Integration', () => {
    test('should use ranking scores in grouping suggestions', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `hydraulic-${i}`,
          name: `Hydraulic Pump ${i}`,
          price: 150,
          stock_status: 'instock' as const,
          categories: ['Hydraulic Pumps'],
          similarity_score: 0.92,
          rankingScore: 0.9,
          rankingSignals: {
            semanticSimilarity: 0.92,
            stockAvailability: 1.0,
            priceMatch: 0.85,
            popularity: 0.9,
            recency: 0.8,
          },
          rankingExplanation: 'Excellent semantic match, in stock, popular',
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `centrifugal-${i}`,
          name: `Centrifugal Pump ${i}`,
          price: 150,
          stock_status: 'instock' as const,
          categories: ['Centrifugal Pumps'],
          similarity_score: 0.75,
          rankingScore: 0.72,
          rankingSignals: {
            semanticSimilarity: 0.75,
            stockAvailability: 1.0,
            priceMatch: 0.85,
            popularity: 0.6,
            recency: 0.5,
          },
          rankingExplanation: 'Good match, in stock',
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `vacuum-${i}`,
          name: `Vacuum Pump ${i}`,
          price: 150,
          stock_status: 'instock' as const,
          categories: ['Vacuum Pumps'],
          similarity_score: 0.65,
          rankingScore: 0.6,
          rankingSignals: {
            semanticSimilarity: 0.65,
            stockAvailability: 1.0,
            priceMatch: 0.85,
            popularity: 0.4,
            recency: 0.3,
          },
          rankingExplanation: 'Moderate match, in stock',
        })),
      ];

      const result = simulator.simulateRankingDataResponse(products);

      expect(result.topMatches.length).toBeGreaterThan(0);
      expect(result.topMatches.every(p => p.rankingScore! > 0.8)).toBe(true);
      expect(result.explanation).toContain('multi-signal');
      expect(result.explanation).toContain('semantic');
      expect(result.explanation).toContain('stock');

      expect(result.response).toContain('top matches');
      expect(result.response).toContain('90%+ similarity');
      expect(result.response).toContain('Hydraulic Pumps');
    });

    test('should include ranking explanation in response', () => {
      const products: MockProduct[] = [
        {
          id: 'top-1',
          name: 'Top Match Product',
          price: 100,
          stock_status: 'instock',
          categories: ['Category A'],
          similarity_score: 0.95,
          rankingScore: 0.92,
          rankingSignals: {
            semanticSimilarity: 0.95,
            stockAvailability: 1.0,
            priceMatch: 0.9,
            popularity: 0.85,
            recency: 0.9,
          },
          rankingExplanation:
            'Excellent semantic match, in stock, within budget, popular choice',
        },
      ];

      const result = simulator.simulateRankingDataResponse(products);

      expect(result.topMatches[0].rankingExplanation).toBeDefined();
      expect(result.topMatches[0].rankingExplanation).toContain('Excellent');
      expect(result.topMatches[0].rankingExplanation).toContain('in stock');
    });
  });

  describe('Conversational Tone Validation', () => {
    test('should use conversational and helpful tone', () => {
      const products: MockProduct[] = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 100,
        stock_status: 'instock' as const,
        categories: ['Category A'],
        similarity_score: 0.9,
      }));

      const result = simulator.simulateBroadQueryResponse(
        'Show me products',
        products
      );
      const toneCheck = simulator.verifyConversationalTone(result.response);

      expect(toneCheck.isConversational).toBe(true);
      expect(toneCheck.issues).toHaveLength(0);
    });

    test('should avoid robotic language', () => {
      const roboticResponse =
        'Initiating refinement protocol. Please select category index.';
      const toneCheck = simulator.verifyConversationalTone(roboticResponse);

      expect(toneCheck.isConversational).toBe(false);
      expect(toneCheck.issues).toContain('Contains robotic language');
    });

    test('should be proactive but not pushy', () => {
      const products: MockProduct[] = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 100,
        stock_status: 'instock' as const,
        categories: ['Category A'],
        similarity_score: 0.9,
      }));

      const result = simulator.simulatePriceRangeGrouping(products);

      expect(result.response).toContain('Would you like');
      expect(result.response).not.toContain('You must');
      expect(result.response).not.toContain('required');
    });
  });

  describe('Integration Test: Complete Refinement Journey', () => {
    test('should handle complete user journey from broad query to purchase', () => {
      const allProducts: MockProduct[] = [
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `work-${i}`,
          name: `Heavy Duty Work Glove ${i}`,
          price: 15 + i * 2,
          stock_status: 'instock' as const,
          categories: ['Work Gloves'],
          similarity_score: 0.9,
          rankingScore: 0.85,
          rankingSignals: {
            semanticSimilarity: 0.9,
            stockAvailability: 1.0,
            priceMatch: 0.8,
          },
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `medical-${i}`,
          name: `Medical Glove ${i}`,
          price: 10 + i,
          stock_status: 'instock' as const,
          categories: ['Medical Gloves'],
          similarity_score: 0.75,
          rankingScore: 0.7,
          rankingSignals: {
            semanticSimilarity: 0.75,
            stockAvailability: 1.0,
            priceMatch: 0.9,
          },
        })),
      ];

      // Turn 1: Broad query
      const turn1 = simulator.simulateBroadQueryResponse(
        'I need gloves',
        allProducts
      );
      expect(turn1.shouldRefine).toBe(true);
      expect(turn1.response).toContain('Work Gloves');
      expect(turn1.response).toContain('Medical Gloves');

      // Turn 2: Category selection
      const workGloves = allProducts.filter(p =>
        p.categories.includes('Work Gloves')
      );
      const turn2 = simulator.simulatePriceRangeGrouping(workGloves);
      expect(turn2.groups.budget.length).toBeGreaterThan(0);

      // Turn 3: Price range selection
      const budgetGloves = turn2.groups.budget;
      const turn3Response = simulator.formatFinalResults(budgetGloves);
      expect(turn3Response).toContain('Perfect!');
      expect(turn3Response).toContain('Heavy Duty Work Glove');
      expect(turn3Response).toContain('In stock');

      // Verify entire journey was conversational
      const journey = [turn1.response, turn2.response, turn3Response];
      journey.forEach(response => {
        const toneCheck = simulator.verifyConversationalTone(response);
        expect(toneCheck.isConversational).toBe(true);
      });
    });
  });
});
