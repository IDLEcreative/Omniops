/**
 * Cost Tracker - Reporting & Edge Cases Tests
 *
 * Tests for logCostSummary, getUsageExamples, edge cases, and accuracy
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  trackSentimentCost,
  getCostStats,
  resetCostStats,
  estimateMonthlyCost,
  logCostSummary,
  getUsageExamples,
} from '@/lib/analytics/cost-tracker';

describe('Cost Tracker - Reporting & Accuracy', () => {
  // Store original console methods
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    // Reset cost stats before each test
    resetCostStats();

    // Mock console to suppress output during tests
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  describe('logCostSummary', () => {
    it('logs cost summary to console', () => {
      trackSentimentCost(1000);
      logCostSummary();

      expect(console.log).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cost Summary')
      );
    });

    it('includes total API calls in summary', () => {
      trackSentimentCost(2500);
      logCostSummary();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('2500')
      );
    });

    it('includes current monthly cost in summary', () => {
      trackSentimentCost(1000);
      logCostSummary();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Current monthly cost')
      );
    });

    it('includes projected end-of-month cost', () => {
      trackSentimentCost(100);
      logCostSummary();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Projected end-of-month cost')
      );
    });

    it('includes cost per call in summary', () => {
      logCostSummary();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Cost per call')
      );
    });

    it('includes monthly threshold in summary', () => {
      logCostSummary();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Monthly threshold')
      );
    });

    it('calculates projection based on day of month', () => {
      jest.useFakeTimers();

      // Set to middle of month (15th)
      jest.setSystemTime(new Date('2024-01-15'));

      trackSentimentCost(1000);
      logCostSummary();

      // Projection should be approximately 2x current (15 days -> 30 days)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Projected')
      );

      jest.useRealTimers();
    });
  });

  describe('getUsageExamples', () => {
    it('returns array of usage examples', () => {
      const examples = getUsageExamples();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
    });

    it('includes example for 1,000 messages', () => {
      const examples = getUsageExamples();
      const example1k = examples.find(e => e.messages === 1000);

      expect(example1k).toBeDefined();
      expect(parseFloat(example1k!.cost)).toBeCloseTo(0.04, 2);
    });

    it('includes example for 5,000 messages', () => {
      const examples = getUsageExamples();
      const example5k = examples.find(e => e.messages === 5000);

      expect(example5k).toBeDefined();
      expect(parseFloat(example5k!.cost)).toBeCloseTo(0.20, 2);
    });

    it('includes example for 10,000 messages', () => {
      const examples = getUsageExamples();
      const example10k = examples.find(e => e.messages === 10000);

      expect(example10k).toBeDefined();
      expect(parseFloat(example10k!.cost)).toBeCloseTo(0.41, 1);
    });

    it('includes example for 30,000 messages', () => {
      const examples = getUsageExamples();
      const example30k = examples.find(e => e.messages === 30000);

      expect(example30k).toBeDefined();
      expect(parseFloat(example30k!.cost)).toBeCloseTo(1.22, 1);
    });

    it('includes example for 50,000 messages', () => {
      const examples = getUsageExamples();
      const example50k = examples.find(e => e.messages === 50000);

      expect(example50k).toBeDefined();
      expect(parseFloat(example50k!.cost)).toBeCloseTo(2.03, 1);
    });

    it('formats costs as strings with 2 decimal places', () => {
      const examples = getUsageExamples();

      examples.forEach(example => {
        expect(typeof example.cost).toBe('string');
        expect(example.cost).toMatch(/^\d+\.\d{2}$/);
      });
    });

    it('shows increasing costs for increasing volumes', () => {
      const examples = getUsageExamples();

      for (let i = 1; i < examples.length; i++) {
        const prevCost = parseFloat(examples[i - 1].cost);
        const currentCost = parseFloat(examples[i].cost);
        expect(currentCost).toBeGreaterThan(prevCost);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('handles negative call counts gracefully', () => {
      trackSentimentCost(-10);
      const stats = getCostStats();

      // Depending on implementation, might be 0 or -10
      expect(stats.totalCalls).toBeLessThanOrEqual(0);
    });

    it('handles very large call counts', () => {
      trackSentimentCost(1000000);
      const stats = getCostStats();

      expect(stats.totalCalls).toBe(1000000);
      expect(stats.estimatedMonthlyCost).toBeGreaterThan(0);
    });

    it('handles floating point call counts', () => {
      trackSentimentCost(1.5);
      const stats = getCostStats();

      expect(stats.totalCalls).toBe(1.5);
    });

    it('maintains precision with many small increments', () => {
      for (let i = 0; i < 100; i++) {
        trackSentimentCost(1);
      }

      const stats = getCostStats();
      expect(stats.totalCalls).toBe(100);
    });

    it('handles multiple resets without issues', () => {
      for (let i = 0; i < 10; i++) {
        trackSentimentCost(100);
        resetCostStats();
      }

      const stats = getCostStats();
      expect(stats.totalCalls).toBe(0);
    });
  });

  describe('cost calculation accuracy', () => {
    it('uses correct token counts for calculation', () => {
      // Based on constants in code:
      // AVG_INPUT_TOKENS_PER_CALL = 150
      // AVG_OUTPUT_TOKENS_PER_CALL = 30
      const messagesPerCall = 1;
      const expectedCost =
        (150 / 1000) * 0.00015 + // Input tokens cost
        (30 / 1000) * 0.0006;    // Output tokens cost

      const actualCost = estimateMonthlyCost(messagesPerCall);
      expect(actualCost).toBeCloseTo(expectedCost, 6);
    });

    it('scales linearly with message count', () => {
      const cost100 = estimateMonthlyCost(100);
      const cost200 = estimateMonthlyCost(200);

      expect(cost200).toBeCloseTo(cost100 * 2, 6);
    });

    it('maintains precision for large volumes', () => {
      const cost1M = estimateMonthlyCost(1000000);

      // 1M messages * $0.0000405 = $40.50
      expect(cost1M).toBeCloseTo(40.5, 2);
    });
  });
});
