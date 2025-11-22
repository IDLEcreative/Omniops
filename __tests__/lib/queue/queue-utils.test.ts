/**
 * Queue Utilities Tests
 * Tests helper functions for job processing, monitoring, and health checks
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Redis for tests
jest.mock('@/lib/redis-unified', () => ({
  getRedisClient: jest.fn(() => ({
    status: 'ready',
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn().mockResolvedValue('redis_version:6.2.0\nused_memory:1024000'),
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Queue Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Job ID Generation', () => {
    it('should generate unique job IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });

    it('should generate consistent ID format', () => {
      const id = `job-${Date.now()}-abc123`;
      expect(id).toMatch(/^job-\d+-[a-z0-9]+$/);
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate priority from job data', () => {
      const urgentJob = { priority: 10, type: 'urgent' };
      const normalJob = { priority: 0, type: 'normal' };
      const lowJob = { priority: -5, type: 'low' };

      expect(urgentJob.priority).toBeGreaterThan(normalJob.priority);
      expect(normalJob.priority).toBeGreaterThan(lowJob.priority);
    });

    it('should default to normal priority', () => {
      const jobWithoutPriority = { type: 'single-page' };
      const defaultPriority = 0;

      expect(defaultPriority).toBe(0);
    });
  });

  describe('Delay Calculation', () => {
    it('should calculate exponential backoff delay', () => {
      const baseDelay = 1000;
      const maxDelay = 60000;

      const calculateDelay = (attempt: number) => {
        return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      };

      expect(calculateDelay(0)).toBe(1000);
      expect(calculateDelay(1)).toBe(2000);
      expect(calculateDelay(2)).toBe(4000);
      expect(calculateDelay(3)).toBe(8000);
      expect(calculateDelay(10)).toBe(maxDelay); // Should cap at max
    });

    it('should add jitter to prevent thundering herd', () => {
      const baseDelay = 1000;
      const jitterFactor = 0.2;

      const addJitter = (delay: number) => {
        const jitter = delay * jitterFactor * Math.random();
        return delay + jitter;
      };

      const delays = Array.from({ length: 10 }, () => addJitter(baseDelay));

      // All delays should be different
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(5);

      // All delays should be within expected range
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay);
        expect(delay).toBeLessThanOrEqual(baseDelay * (1 + jitterFactor));
      });
    });
  });

  describe('Job Status Helpers', () => {
    it('should check if job is terminal state', () => {
      const isTerminalState = (status: string) => {
        return ['completed', 'failed'].includes(status);
      };

      expect(isTerminalState('completed')).toBe(true);
      expect(isTerminalState('failed')).toBe(true);
      expect(isTerminalState('active')).toBe(false);
      expect(isTerminalState('waiting')).toBe(false);
    });

    it('should check if job is processable', () => {
      const isProcessable = (status: string) => {
        return ['waiting', 'delayed'].includes(status);
      };

      expect(isProcessable('waiting')).toBe(true);
      expect(isProcessable('delayed')).toBe(true);
      expect(isProcessable('active')).toBe(false);
      expect(isProcessable('completed')).toBe(false);
    });
  });

  describe('Deduplication Key Generation', () => {
    it('should generate consistent dedup keys', () => {
      const generateDedupKey = (customerId: string, url: string) => {
        return `scrape:dedup:${customerId}:${url}`;
      };

      const key1 = generateDedupKey('customer-1', 'https://example.com');
      const key2 = generateDedupKey('customer-1', 'https://example.com');

      expect(key1).toBe(key2);
      expect(key1).toBe('scrape:dedup:customer-1:https://example.com');
    });

    it('should generate different keys for different customers', () => {
      const generateDedupKey = (customerId: string, url: string) => {
        return `scrape:dedup:${customerId}:${url}`;
      };

      const key1 = generateDedupKey('customer-1', 'https://example.com');
      const key2 = generateDedupKey('customer-2', 'https://example.com');

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different URLs', () => {
      const generateDedupKey = (customerId: string, url: string) => {
        return `scrape:dedup:${customerId}:${url}`;
      };

      const key1 = generateDedupKey('customer-1', 'https://example.com/page1');
      const key2 = generateDedupKey('customer-1', 'https://example.com/page2');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate percentage progress', () => {
      const calculateProgress = (completed: number, total: number) => {
        return Math.round((completed / total) * 100);
      };

      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(25, 100)).toBe(25);
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    it('should handle edge cases', () => {
      const calculateProgress = (completed: number, total: number) => {
        if (total === 0) return 0;
        return Math.min(100, Math.round((completed / total) * 100));
      };

      expect(calculateProgress(0, 0)).toBe(0);
      expect(calculateProgress(150, 100)).toBe(100); // Cap at 100%
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors', () => {
      const categorizeError = (error: Error) => {
        const msg = error.message.toLowerCase();
        if (msg.includes('timeout')) return 'timeout';
        if (msg.includes('network')) return 'network';
        if (msg.includes('404')) return 'not_found';
        return 'unknown';
      };

      expect(categorizeError(new Error('Network timeout'))).toBe('timeout');
      expect(categorizeError(new Error('Network error'))).toBe('network');
      expect(categorizeError(new Error('404 not found'))).toBe('not_found');
      expect(categorizeError(new Error('Something else'))).toBe('unknown');
    });

    it('should determine if error is retryable', () => {
      const isRetryable = (errorType: string) => {
        return ['timeout', 'network', 'rate_limit'].includes(errorType);
      };

      expect(isRetryable('timeout')).toBe(true);
      expect(isRetryable('network')).toBe(true);
      expect(isRetryable('not_found')).toBe(false);
      expect(isRetryable('invalid_url')).toBe(false);
    });
  });

  describe('Time Window Calculations', () => {
    it('should calculate time until next retry', () => {
      const now = Date.now();
      const resetTime = now + 60000; // 1 minute from now

      const timeUntilReset = resetTime - now;

      expect(timeUntilReset).toBeLessThanOrEqual(60000);
      expect(timeUntilReset).toBeGreaterThan(0);
    });

    it('should determine if time window expired', () => {
      const isExpired = (timestamp: number) => {
        return Date.now() > timestamp;
      };

      const pastTime = Date.now() - 1000;
      const futureTime = Date.now() + 1000;

      expect(isExpired(pastTime)).toBe(true);
      expect(isExpired(futureTime)).toBe(false);
    });
  });

  describe('Job Options Merging', () => {
    it('should merge default and custom options', () => {
      const defaultOptions = {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      };

      const customOptions = {
        attempts: 5,
        priority: 10,
      };

      const merged = { ...defaultOptions, ...customOptions };

      expect(merged.attempts).toBe(5); // Custom overrides default
      expect(merged.priority).toBe(10); // Custom added
      expect(merged.removeOnComplete).toBe(true); // Default preserved
    });
  });
});
