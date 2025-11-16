/**
 * Conversational Refinement: Grouping Scenarios
 *
 * Tests grouping strategies (category, price, stock, match quality)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationalRefinementSimulator, MockProduct } from './simulator';

describe('Conversational Refinement: Grouping Scenarios', () => {
  let simulator: ConversationalRefinementSimulator;

  beforeEach(() => {
    simulator = new ConversationalRefinementSimulator();
  });

  describe('Scenario 1: Broad Query Detection', () => {
    test('should detect broad query and offer refinement', () => {
      const query = 'Show me products';
      const products: MockProduct[] = Array.from({ length: 15 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        price: 50 + i * 10,
        stock_status: 'instock',
        categories: ['Category A', 'Category B', 'Category C'][i % 3]
          ? [['Category A', 'Category B', 'Category C'][i % 3]]
          : [],
        similarity_score: 0.85 - i * 0.02,
      }));

      const result = simulator.simulateBroadQueryResponse(query, products);

      expect(result.shouldRefine).toBe(true);
      expect(result.response).toContain('I found 15 products');
      expect(result.response).toContain('Category A');
      expect(result.response).toContain('Which type are you interested in?');
      expect(result.groupings).toBeDefined();
      expect(result.groupings!.size).toBeGreaterThan(0);
    });

    test('should group products by 3 categories', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `cat-a-${i}`,
          name: `Product A${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Category A'],
          similarity_score: 0.9,
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `cat-b-${i}`,
          name: `Product B${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Category B'],
          similarity_score: 0.85,
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `cat-c-${i}`,
          name: `Product C${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Category C'],
          similarity_score: 0.8,
        })),
      ];

      const result = simulator.simulateBroadQueryResponse(
        'Show me products',
        products
      );

      expect(result.groupings!.size).toBe(3);
      expect(result.groupings!.get('Category A')).toHaveLength(5);
      expect(result.groupings!.get('Category B')).toHaveLength(5);
      expect(result.groupings!.get('Category C')).toHaveLength(5);
    });
  });

  describe('Scenario 2: Category-Based Grouping', () => {
    test('should group gloves by type with similarity scores', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `work-${i}`,
          name: `Heavy Duty Work Glove ${i}`,
          price: 15 + i,
          stock_status: 'instock' as const,
          categories: ['Work Gloves'],
          similarity_score: 0.85 + i * 0.01,
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `medical-${i}`,
          name: `Medical Glove ${i}`,
          price: 10 + i,
          stock_status: 'instock' as const,
          categories: ['Medical Gloves'],
          similarity_score: 0.7 + i * 0.03,
        })),
        {
          id: 'winter-1',
          name: 'Winter Glove',
          price: 20,
          stock_status: 'instock',
          categories: ['Winter Gloves'],
          similarity_score: 0.6,
        },
      ];

      const result = simulator.simulateCategoryGrouping(products);

      expect(result.groups.get('Work Gloves')).toHaveLength(8);
      expect(result.groups.get('Medical Gloves')).toHaveLength(3);
      expect(result.groups.get('Winter Gloves')).toHaveLength(1);

      expect(result.response).toContain('Work Gloves');
      expect(result.response).toContain('8 products');
      expect(result.response).toContain('Medical Gloves');
      expect(result.response).toContain('3 products');
      expect(result.response).toContain('Winter Gloves');
      expect(result.response).toContain('1 product');
    });
  });

  describe('Scenario 3: Price Range Grouping', () => {
    test('should group pumps by budget, mid-range, and premium', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `budget-${i}`,
          name: `Budget Pump ${i}`,
          price: 25 + i * 5,
          stock_status: 'instock' as const,
          categories: ['Pumps'],
          similarity_score: 0.85,
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `mid-${i}`,
          name: `Mid Range Pump ${i}`,
          price: 60 + i * 10,
          stock_status: 'instock' as const,
          categories: ['Pumps'],
          similarity_score: 0.9,
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `premium-${i}`,
          name: `Premium Pump ${i}`,
          price: 200 + i * 50,
          stock_status: 'instock' as const,
          categories: ['Pumps'],
          similarity_score: 0.88,
        })),
      ];

      const result = simulator.simulatePriceRangeGrouping(products, 100);

      expect(result.groups.budget).toHaveLength(5);
      expect(result.groups.midRange).toHaveLength(8);
      expect(result.groups.premium).toHaveLength(3);

      expect(result.response).toContain('Budget options (under £50): 5');
      expect(result.response).toContain('Mid-range options (£50-£150): 8');
      expect(result.response).toContain('Premium options (over £150): 3');
    });
  });

  describe('Scenario 4: Stock Availability Grouping', () => {
    test('should prioritize in-stock pumps for urgent need', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `instock-${i}`,
          name: `In Stock Pump ${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Pumps'],
          similarity_score: 0.9,
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `backorder-${i}`,
          name: `Backorder Pump ${i}`,
          price: 100,
          stock_status: 'onbackorder' as const,
          categories: ['Pumps'],
          similarity_score: 0.85,
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `outofstock-${i}`,
          name: `Out of Stock Pump ${i}`,
          price: 100,
          stock_status: 'outofstock' as const,
          categories: ['Pumps'],
          similarity_score: 0.8,
        })),
      ];

      const result = simulator.simulateStockAvailabilityGrouping(products);

      expect(result.groups.inStock).toHaveLength(10);
      expect(result.groups.backorder).toHaveLength(4);
      expect(result.groups.outOfStock).toHaveLength(2);

      expect(result.response).toContain('In stock (10 products)');
      expect(result.response).toContain('Available now');
      expect(result.response).toContain('On backorder (4 products)');
      expect(result.response).toContain('2-3 week delivery');
    });
  });

  describe('Scenario 5: Match Quality Grouping', () => {
    test('should group parts by similarity score tiers', () => {
      const products: MockProduct[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `excellent-${i}`,
          name: `Excellent Match Part ${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Parts'],
          similarity_score: 0.9 + i * 0.02,
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `good-${i}`,
          name: `Good Match Part ${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Parts'],
          similarity_score: 0.75 + i * 0.01,
        })),
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `moderate-${i}`,
          name: `Moderate Match Part ${i}`,
          price: 100,
          stock_status: 'instock' as const,
          categories: ['Parts'],
          similarity_score: 0.6 + i * 0.03,
        })),
      ];

      const result = simulator.simulateMatchQualityGrouping(products);

      expect(result.groups.excellent).toHaveLength(5);
      expect(result.groups.good).toHaveLength(8);
      expect(result.groups.moderate).toHaveLength(3);

      expect(result.response).toContain('Excellent match (90-100%): 5');
      expect(result.response).toContain('Good match (75-89%): 8');
      expect(result.response).toContain('Moderate match (60-74%): 3');
    });
  });
});
