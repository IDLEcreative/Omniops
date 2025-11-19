/**
 * Cost Tracker Tests
 *
 * Comprehensive test coverage for AI sentiment analysis cost tracking
 * Tests all functions in lib/analytics/cost-tracker.ts
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

describe('Cost Tracker', () => {
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

  describe('trackSentimentCost', () => {
    it('increments call count by 1 by default', () => {
      trackSentimentCost();
      const stats = getCostStats();
      expect(stats.totalCalls).toBe(1);
    });

    it('increments call count by specified amount', () => {
      trackSentimentCost(5);
      const stats = getCostStats();
      expect(stats.totalCalls).toBe(5);
    });

    it('calculates estimated monthly cost correctly', () => {
      trackSentimentCost(1000);
      const stats = getCostStats();

      // Expected cost calculation:
      // Input: (150 tokens / 1000) * $0.00015 = $0.0000225 per call
      // Output: (30 tokens / 1000) * $0.0006 = $0.000018 per call
      // Total: $0.0000405 per call
      // 1000 calls: $0.0405
      expect(stats.estimatedMonthlyCost).toBeCloseTo(0.0405, 4);
    });

    it('accumulates costs across multiple calls', () => {
      trackSentimentCost(100);
      trackSentimentCost(200);
      trackSentimentCost(300);

      const stats = getCostStats();
      expect(stats.totalCalls).toBe(600);
      expect(stats.estimatedMonthlyCost).toBeCloseTo(0.0243, 4); // 600 * 0.0000405
    });

    it('logs warning when cost exceeds threshold', () => {
      // Track enough calls to exceed default $5 threshold
      // $5 / $0.0000405 ≈ 123,456 calls
      trackSentimentCost(130000);

      expect(console.warn).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Monthly cost threshold exceeded')
      );
    });

    it('does not log warning when under threshold', () => {
      trackSentimentCost(100);

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('resets stats when new month detected', () => {
      // Track some calls in "current month"
      trackSentimentCost(1000);

      const firstStats = getCostStats();
      expect(firstStats.totalCalls).toBe(1000);

      // Mock new month by modifying the date
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-01')); // Next month

      trackSentimentCost(1); // This should trigger reset

      const secondStats = getCostStats();
      // After reset, only the new call should be counted
      expect(secondStats.totalCalls).toBe(1);

      jest.useRealTimers();
    });

    it('updates lastResetDate when tracking', () => {
      trackSentimentCost(1);
      const stats = getCostStats();

      const today = new Date().toISOString().slice(0, 10);
      expect(stats.lastResetDate).toBe(today);
    });
  });

  describe('getCostStats', () => {
    it('returns current cost statistics', () => {
      trackSentimentCost(500);
      const stats = getCostStats();

      expect(stats).toHaveProperty('totalCalls');
      expect(stats).toHaveProperty('lastResetDate');
      expect(stats).toHaveProperty('estimatedMonthlyCost');
      expect(stats.totalCalls).toBe(500);
    });

    it('returns copy of stats (not reference)', () => {
      trackSentimentCost(100);
      const stats1 = getCostStats();
      const stats2 = getCostStats();

      // Modifying one should not affect the other
      stats1.totalCalls = 999;
      expect(stats2.totalCalls).toBe(100);
    });

    it('returns zero values after reset', () => {
      trackSentimentCost(1000);
      resetCostStats();

      const stats = getCostStats();
      expect(stats.totalCalls).toBe(0);
      expect(stats.estimatedMonthlyCost).toBe(0);
    });
  });

  describe('resetCostStats', () => {
    it('resets all statistics to zero', () => {
      trackSentimentCost(5000);
      const beforeReset = getCostStats();
      expect(beforeReset.totalCalls).toBe(5000);

      resetCostStats();

      const afterReset = getCostStats();
      expect(afterReset.totalCalls).toBe(0);
      expect(afterReset.estimatedMonthlyCost).toBe(0);
    });

    it('sets lastResetDate to current date', () => {
      resetCostStats();

      const stats = getCostStats();
      const today = new Date().toISOString().slice(0, 10);
      expect(stats.lastResetDate).toBe(today);
    });

    it('allows fresh tracking after reset', () => {
      trackSentimentCost(1000);
      resetCostStats();
      trackSentimentCost(100);

      const stats = getCostStats();
      expect(stats.totalCalls).toBe(100);
    });
  });

  describe('estimateMonthlyCost', () => {
    it('calculates cost for small volume (1,000 messages)', () => {
      const cost = estimateMonthlyCost(1000);
      expect(cost).toBeCloseTo(0.0405, 4);
    });

    it('calculates cost for medium volume (10,000 messages)', () => {
      const cost = estimateMonthlyCost(10000);
      expect(cost).toBeCloseTo(0.405, 3);
    });

    it('calculates cost for high volume (100,000 messages)', () => {
      const cost = estimateMonthlyCost(100000);
      expect(cost).toBeCloseTo(4.05, 2);
    });

    it('returns zero for zero messages', () => {
      const cost = estimateMonthlyCost(0);
      expect(cost).toBe(0);
    });

    it('handles decimal message counts', () => {
      const cost = estimateMonthlyCost(1000.5);
      expect(cost).toBeGreaterThan(0);
    });

    it('calculates cost consistently with tracked costs', () => {
      const messageCount = 5000;

      // Track costs
      trackSentimentCost(messageCount);
      const trackedCost = getCostStats().estimatedMonthlyCost;

      // Estimate costs
      const estimatedCost = estimateMonthlyCost(messageCount);

      expect(estimatedCost).toBeCloseTo(trackedCost, 4);
    });
  });

  // See cost-tracker-reporting.test.ts for logCostSummary, getUsageExamples,
  // edge cases, and cost calculation accuracy tests
});
