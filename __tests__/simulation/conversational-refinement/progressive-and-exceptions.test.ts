/**
 * Conversational Refinement: Progressive Narrowing and Exceptions
 *
 * Tests multi-turn conversations and when NOT to refine
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationalRefinementSimulator, MockProduct } from './simulator';

describe('Conversational Refinement: Progressive Narrowing and Exceptions', () => {
  let simulator: ConversationalRefinementSimulator;

  beforeEach(() => {
    simulator = new ConversationalRefinementSimulator();
  });

  describe('Scenario 6: Progressive Narrowing Flow', () => {
    test('should handle 3-turn conversation from broad to specific', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `work-budget-${i}`,
          name: `Budget Work Glove ${i}`,
          price: 15 + i * 5,
          stock_status: 'instock' as const,
          categories: ['Work Gloves'],
          similarity_score: 0.9,
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `work-premium-${i}`,
          name: `Premium Work Glove ${i}`,
          price: 60 + i * 20,
          stock_status: 'instock' as const,
          categories: ['Work Gloves'],
          similarity_score: 0.9,
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `medical-${i}`,
          name: `Medical Glove ${i}`,
          price: 10 + i,
          stock_status: 'instock' as const,
          categories: ['Medical Gloves'],
          similarity_score: 0.75,
        })),
      ];

      const result = simulator.simulateProgressiveNarrowing(
        'I need gloves',
        products
      );

      expect(result.turns).toHaveLength(3);

      // Turn 1: Broad query
      expect(result.turns[0].query).toBe('I need gloves');
      expect(result.turns[0].response).toContain('I found');
      expect(result.turns[0].response).toContain('Work Gloves');
      expect(result.turns[0].products).toHaveLength(11);

      // Turn 2: Category refinement
      expect(result.turns[1].query).toBe('Work Gloves');
      expect(result.turns[1].response).toContain('8 Work Gloves options');
      expect(result.turns[1].response).toContain('budget options');

      // Turn 3: Price refinement to final results
      expect(result.turns[2].query).toBe('Budget options');
      expect(result.turns[2].response).toContain('Perfect!');
      expect(result.turns[2].response).toContain('top');
      expect(result.turns[2].products.length).toBeLessThanOrEqual(5);
    });

    test('should track context through conversation', () => {
      const products: MockProduct[] = Array.from({ length: 12 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 30 + i * 10,
        stock_status: 'instock' as const,
        categories: ['Category A'],
        similarity_score: 0.9,
      }));

      const result = simulator.simulateProgressiveNarrowing(
        'Show me products',
        products
      );

      // Each turn should reference previous context
      expect(result.turns[1].response).toContain('Great!');
      expect(result.turns[2].response).toContain('Perfect!');
    });
  });

  describe('Scenario 7: When NOT to Refine', () => {
    test('should NOT refine specific product query', () => {
      const products: MockProduct[] = [
        {
          id: 'exact-match',
          name: 'A4VTG90 Hydraulic Pump',
          price: 150,
          stock_status: 'instock',
          categories: ['Hydraulic Pumps'],
          similarity_score: 0.99,
        },
      ];

      const query = 'Show me A4VTG90 hydraulic pump';
      const shouldNotRefine = simulator.shouldNotRefine(query, products);

      expect(shouldNotRefine).toBe(true);
    });

    test('should NOT refine when few results (<5)', () => {
      const products: MockProduct[] = Array.from({ length: 3 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 100,
        stock_status: 'instock' as const,
        categories: ['Category A'],
        similarity_score: 0.9,
      }));

      const shouldNotRefine = simulator.shouldNotRefine(
        'Show me products',
        products
      );

      expect(shouldNotRefine).toBe(true);
    });

    test('should NOT refine when all results very similar', () => {
      const products: MockProduct[] = Array.from({ length: 8 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 100,
        stock_status: 'instock' as const,
        categories: ['Same Category'],
        similarity_score: 0.9 + i * 0.005,
      }));

      const shouldNotRefine = simulator.shouldNotRefine(
        'Show me products',
        products
      );

      expect(shouldNotRefine).toBe(true);
    });

    test('should NOT refine when user explicitly requests all results', () => {
      const products: MockProduct[] = Array.from({ length: 15 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 100,
        stock_status: 'instock' as const,
        categories: ['Category A', 'Category B'][i % 2]
          ? [['Category A', 'Category B'][i % 2]]
          : [],
        similarity_score: 0.85,
      }));

      const shouldNotRefine = simulator.shouldNotRefine(
        'Show me everything',
        products
      );

      expect(shouldNotRefine).toBe(true);
    });
  });
});
