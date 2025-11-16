/**
 * Tests for Individual Signal Calculations
 * Verifies stock, price, popularity, and recency signals
 */

import {
  calculateStockSignal,
  calculatePriceSignal,
  calculatePopularitySignal,
  calculateRecencySignal,
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
