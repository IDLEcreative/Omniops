/**
 * Tests for Budget Extraction from Query
 * Verifies budget detection from natural language queries
 */

import { extractBudgetFromQuery } from '@/lib/search/result-ranker';

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
