/**
 * Tests for Adaptive Backoff Calculator
 * CRITICAL: Verifies backoff calculations for different retry strategies
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateBackoff,
  calculateBackoffWithDetails,
  applyJitter,
  calculateTotalRetryTime,
  getRetryStrategyDescription,
} from '@/lib/retry/adaptive-backoff';
import type { ErrorCategory } from '@/lib/retry/error-classifier';

describe('calculateBackoff', () => {
  describe('TRANSIENT errors - Exponential backoff', () => {
    it('should calculate exponential backoff for TRANSIENT errors', () => {
      const delays = [
        calculateBackoff('TRANSIENT', 1),
        calculateBackoff('TRANSIENT', 2),
        calculateBackoff('TRANSIENT', 3),
      ];

      // Verify delays are non-null
      expect(delays[0]).not.toBeNull();
      expect(delays[1]).not.toBeNull();
      expect(delays[2]).not.toBeNull();

      // Verify exponential pattern (allowing for jitter ±20%)
      // Expected: 100ms → 200ms → 400ms (with jitter)
      expect(delays[0]!).toBeGreaterThanOrEqual(80); // 100ms - 20%
      expect(delays[0]!).toBeLessThanOrEqual(120); // 100ms + 20%

      expect(delays[1]!).toBeGreaterThanOrEqual(160); // 200ms - 20%
      expect(delays[1]!).toBeLessThanOrEqual(240); // 200ms + 20%

      expect(delays[2]!).toBeGreaterThanOrEqual(320); // 400ms - 20%
      expect(delays[2]!).toBeLessThanOrEqual(480); // 400ms + 20%
    });

    it('should enforce max delay cap', () => {
      // TRANSIENT has maxRetries: 3, so attempt 3 is the last valid retry
      // Attempt 3 would normally be 100 * 2^2 = 400ms
      const delay = calculateBackoff('TRANSIENT', 3);
      expect(delay).not.toBeNull();
      expect(delay!).toBeGreaterThanOrEqual(320); // 400ms - 20%
      expect(delay!).toBeLessThanOrEqual(480); // 400ms + 20%

      // Attempt 4 should return null (exceeds maxRetries)
      expect(calculateBackoff('TRANSIENT', 4)).toBeNull();
    });
  });

  describe('RATE_LIMIT errors - Long exponential backoff', () => {
    it('should calculate long exponential backoff for RATE_LIMIT errors', () => {
      const delays = [
        calculateBackoff('RATE_LIMIT', 1),
        calculateBackoff('RATE_LIMIT', 2),
        calculateBackoff('RATE_LIMIT', 3),
      ];

      // Verify delays are non-null
      expect(delays[0]).not.toBeNull();
      expect(delays[1]).not.toBeNull();
      expect(delays[2]).not.toBeNull();

      // Verify long exponential pattern (1s → 2s → 4s with jitter)
      expect(delays[0]!).toBeGreaterThanOrEqual(800); // 1000ms - 20%
      expect(delays[0]!).toBeLessThanOrEqual(1200); // 1000ms + 20%

      expect(delays[1]!).toBeGreaterThanOrEqual(1600); // 2000ms - 20%
      expect(delays[1]!).toBeLessThanOrEqual(2400); // 2000ms + 20%

      expect(delays[2]!).toBeGreaterThanOrEqual(3200); // 4000ms - 20%
      expect(delays[2]!).toBeLessThanOrEqual(4800); // 4000ms + 20%
    });
  });

  describe('SERVER_ERROR errors - Linear backoff', () => {
    it('should calculate linear backoff for SERVER_ERROR errors', () => {
      const delays = [
        calculateBackoff('SERVER_ERROR', 1),
        calculateBackoff('SERVER_ERROR', 2),
        calculateBackoff('SERVER_ERROR', 3),
      ];

      // Verify delays are non-null
      expect(delays[0]).not.toBeNull();
      expect(delays[1]).not.toBeNull();
      expect(delays[2]).not.toBeNull();

      // Verify linear pattern (500ms → 1000ms → 1500ms with jitter)
      expect(delays[0]!).toBeGreaterThanOrEqual(400); // 500ms - 20%
      expect(delays[0]!).toBeLessThanOrEqual(600); // 500ms + 20%

      expect(delays[1]!).toBeGreaterThanOrEqual(800); // 1000ms - 20%
      expect(delays[1]!).toBeLessThanOrEqual(1200); // 1000ms + 20%

      expect(delays[2]!).toBeGreaterThanOrEqual(1200); // 1500ms - 20%
      expect(delays[2]!).toBeLessThanOrEqual(1800); // 1500ms + 20%
    });
  });

  describe('AUTH_FAILURE errors - No retry', () => {
    it('should return null for AUTH_FAILURE errors', () => {
      expect(calculateBackoff('AUTH_FAILURE', 1)).toBeNull();
      expect(calculateBackoff('AUTH_FAILURE', 2)).toBeNull();
      expect(calculateBackoff('AUTH_FAILURE', 3)).toBeNull();
    });
  });

  describe('NOT_FOUND errors - No retry', () => {
    it('should return null for NOT_FOUND errors', () => {
      expect(calculateBackoff('NOT_FOUND', 1)).toBeNull();
      expect(calculateBackoff('NOT_FOUND', 2)).toBeNull();
      expect(calculateBackoff('NOT_FOUND', 3)).toBeNull();
    });
  });

  describe('UNKNOWN errors - Default exponential backoff', () => {
    it('should calculate default exponential backoff for UNKNOWN errors', () => {
      const delays = [
        calculateBackoff('UNKNOWN', 1),
        calculateBackoff('UNKNOWN', 2),
      ];

      // Verify delays are non-null (UNKNOWN has maxRetries: 2)
      expect(delays[0]).not.toBeNull();
      expect(delays[1]).not.toBeNull();

      // Verify exponential pattern similar to TRANSIENT
      expect(delays[0]!).toBeGreaterThanOrEqual(80);
      expect(delays[0]!).toBeLessThanOrEqual(120);

      expect(delays[1]!).toBeGreaterThanOrEqual(160);
      expect(delays[1]!).toBeLessThanOrEqual(240);
    });

    it('should respect maxRetries for UNKNOWN errors', () => {
      // UNKNOWN has maxRetries: 2, so attempt 3 should return null
      expect(calculateBackoff('UNKNOWN', 3)).toBeNull();
    });
  });

  describe('max retries enforcement', () => {
    it('should return null after max retries exceeded', () => {
      // TRANSIENT has maxRetries: 3
      expect(calculateBackoff('TRANSIENT', 1)).not.toBeNull();
      expect(calculateBackoff('TRANSIENT', 2)).not.toBeNull();
      expect(calculateBackoff('TRANSIENT', 3)).not.toBeNull();
      expect(calculateBackoff('TRANSIENT', 4)).toBeNull();
    });
  });
});

describe('calculateBackoffWithDetails', () => {
  it('should return detailed backoff result for retryable errors', () => {
    const result = calculateBackoffWithDetails('TRANSIENT', 1);

    expect(result.shouldRetry).toBe(true);
    expect(result.delayMs).not.toBeNull();
    expect(result.strategy).toBe('exponential-backoff');
  });

  it('should return detailed backoff result for non-retryable errors', () => {
    const result = calculateBackoffWithDetails('AUTH_FAILURE', 1);

    expect(result.shouldRetry).toBe(false);
    expect(result.delayMs).toBeNull();
    expect(result.strategy).toBe('no-retry');
  });

  it('should return correct strategy for RATE_LIMIT', () => {
    const result = calculateBackoffWithDetails('RATE_LIMIT', 1);

    expect(result.shouldRetry).toBe(true);
    expect(result.strategy).toBe('exponential-backoff-long');
  });

  it('should return correct strategy for SERVER_ERROR', () => {
    const result = calculateBackoffWithDetails('SERVER_ERROR', 1);

    expect(result.shouldRetry).toBe(true);
    expect(result.strategy).toBe('linear-backoff');
  });
});

describe('applyJitter', () => {
  it('should apply jitter within specified percentage', () => {
    const baseDelay = 1000;
    const jitterPercent = 20;

    // Run multiple times to test randomness
    const results: number[] = [];
    for (let i = 0; i < 100; i++) {
      const jittered = applyJitter(baseDelay, jitterPercent);
      results.push(jittered);
    }

    // All results should be within ±20% of base delay
    results.forEach((result) => {
      expect(result).toBeGreaterThanOrEqual(800); // 1000 - 20%
      expect(result).toBeLessThanOrEqual(1200); // 1000 + 20%
    });

    // Results should vary (not all the same)
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThan(1);
  });

  it('should return non-negative values', () => {
    const baseDelay = 10;
    const jitterPercent = 50; // Large jitter

    for (let i = 0; i < 100; i++) {
      const jittered = applyJitter(baseDelay, jitterPercent);
      expect(jittered).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle zero jitter', () => {
    const baseDelay = 1000;
    const jittered = applyJitter(baseDelay, 0);

    expect(jittered).toBe(baseDelay);
  });

  it('should return integers', () => {
    const baseDelay = 1000;
    const jittered = applyJitter(baseDelay, 20);

    expect(Number.isInteger(jittered)).toBe(true);
  });
});

describe('calculateTotalRetryTime', () => {
  it('should calculate total retry time for TRANSIENT errors', () => {
    // TRANSIENT: 100ms → 200ms → 400ms (without jitter)
    // Note: Actual values will have jitter, so we test ranges
    const totalTime = calculateTotalRetryTime('TRANSIENT');

    // Expected: ~700ms (100 + 200 + 400)
    // With jitter: 560ms - 840ms (±20%)
    expect(totalTime).toBeGreaterThanOrEqual(560);
    expect(totalTime).toBeLessThanOrEqual(840);
  });

  it('should calculate total retry time for RATE_LIMIT errors', () => {
    // RATE_LIMIT: 1000ms → 2000ms → 4000ms (without jitter)
    // Expected: ~7000ms
    const totalTime = calculateTotalRetryTime('RATE_LIMIT');

    expect(totalTime).toBeGreaterThanOrEqual(5600); // -20%
    expect(totalTime).toBeLessThanOrEqual(8400); // +20%
  });

  it('should return 0 for non-retryable errors', () => {
    expect(calculateTotalRetryTime('AUTH_FAILURE')).toBe(0);
    expect(calculateTotalRetryTime('NOT_FOUND')).toBe(0);
  });

  it('should respect custom maxRetries', () => {
    // TRANSIENT normally has 3 retries, limit to 1
    const totalTime = calculateTotalRetryTime('TRANSIENT', 1);

    // Expected: ~100ms (single retry)
    expect(totalTime).toBeGreaterThanOrEqual(80);
    expect(totalTime).toBeLessThanOrEqual(120);
  });
});

describe('getRetryStrategyDescription', () => {
  it('should return description for each error category', () => {
    const categories: ErrorCategory[] = [
      'TRANSIENT',
      'AUTH_FAILURE',
      'RATE_LIMIT',
      'SERVER_ERROR',
      'NOT_FOUND',
      'UNKNOWN',
    ];

    categories.forEach((category) => {
      const description = getRetryStrategyDescription(category);
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  it('should describe exponential backoff for TRANSIENT', () => {
    const description = getRetryStrategyDescription('TRANSIENT');
    expect(description.toLowerCase()).toContain('exponential');
    expect(description.toLowerCase()).toContain('jitter');
  });

  it('should describe no retry for AUTH_FAILURE', () => {
    const description = getRetryStrategyDescription('AUTH_FAILURE');
    expect(description.toLowerCase()).toContain('no retry');
  });

  it('should describe long backoff for RATE_LIMIT', () => {
    const description = getRetryStrategyDescription('RATE_LIMIT');
    expect(description.toLowerCase()).toContain('exponential');
    expect(description).toContain('1s');
  });

  it('should describe linear backoff for SERVER_ERROR', () => {
    const description = getRetryStrategyDescription('SERVER_ERROR');
    expect(description.toLowerCase()).toContain('linear');
  });
});
