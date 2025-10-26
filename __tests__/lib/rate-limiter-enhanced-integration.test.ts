/**
 * Tests for rate limiting integration with scraper system
 * Covers: checkScraperRateLimit, withRateLimit wrapper, reportScrapingResult
 */

import {
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  withRateLimit,
  cleanupRateLimiter,
} from '../../lib/scraper-rate-limit-integration';

describe('Rate Limiter Integration', () => {
  beforeEach(async () => {
    await cleanupRateLimiter();
  });

  afterEach(async () => {
    await cleanupRateLimiter();
  });

  describe('checkScraperRateLimit', () => {
    it('should check rate limits before scraping', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        burstSize: 20,
        jitterEnabled: false,
        randomizeTimings: false,
        rotateUserAgents: true,
        useRedis: false,
      });

      const result = await checkScraperRateLimit('https://example.com/page');

      expect(result.proceed).toBe(true);
      expect(result.delay).toBe(0);
      expect(result.userAgent).toBeDefined();
    });

    it('should block when rate limit exceeded', async () => {
      initializeRateLimiter({
        requestsPerSecond: 1,
        burstSize: 1,
        jitterEnabled: false,
        randomizeTimings: false,
        useRedis: false,
      });

      // First request should succeed
      const result1 = await checkScraperRateLimit('https://example.com/page1');
      expect(result1.proceed).toBe(true);

      // Second request should be blocked
      const result2 = await checkScraperRateLimit('https://example.com/page2');
      expect(result2.proceed).toBe(false);
      expect(result2.delay).toBeGreaterThan(0);
      expect(result2.message).toBe('Rate limit exceeded');
    });

    it('should handle multiple domains independently', async () => {
      initializeRateLimiter({
        requestsPerSecond: 1,
        burstSize: 1,
        jitterEnabled: false,
        randomizeTimings: false,
        useRedis: false,
      });

      // First domain
      const result1 = await checkScraperRateLimit('https://example.com/page');
      expect(result1.proceed).toBe(true);

      // Different domain should have independent limit
      const result2 = await checkScraperRateLimit('https://different.com/page');
      expect(result2.proceed).toBe(true);
    });
  });

  describe('withRateLimit wrapper', () => {
    it('should wrap async functions with rate limiting', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        burstSize: 20,
        jitterEnabled: false,
        randomizeTimings: false,
        useRedis: false,
      });

      const mockFunction = jest.fn(async (url: string) => {
        return { url, data: 'test' };
      });

      const wrapped = withRateLimit(
        mockFunction,
        (args) => new URL(args[0]).hostname,
        { priority: 'normal' }
      );

      const result = await wrapped('https://example.com/test');

      expect(mockFunction).toHaveBeenCalledWith('https://example.com/test');
      expect(result).toEqual({ url: 'https://example.com/test', data: 'test' });
    });

    it('should retry on rate limit errors', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        burstSize: 20,
        enableExponentialBackoff: false,
        jitterEnabled: false,
        randomizeTimings: false,
        useRedis: false,
      });

      let attempts = 0;
      const mockFunction = jest.fn(async (url: string) => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('Too Many Requests');
          (error as Error & { response?: { status: number } }).response = { status: 429 };
          throw error;
        }
        return { url, attempts };
      });

      const wrapped = withRateLimit(
        mockFunction,
        (args) => new URL(args[0]).hostname
      );

      const result = await wrapped('https://example.com/test');

      expect(attempts).toBe(2);
      expect(result).toEqual({ url: 'https://example.com/test', attempts: 2 });
    });

    it('should propagate non-rate-limit errors', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        burstSize: 20,
        useRedis: false,
      });

      const mockFunction = jest.fn(async (url: string) => {
        throw new Error('Network error');
      });

      const wrapped = withRateLimit(
        mockFunction,
        (args) => new URL(args[0]).hostname
      );

      await expect(wrapped('https://example.com/test')).rejects.toThrow('Network error');
    });

    it('should handle functions with multiple arguments', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        burstSize: 20,
        useRedis: false,
      });

      const mockFunction = jest.fn(async (url: string, options: object) => {
        return { url, options };
      });

      const wrapped = withRateLimit(
        mockFunction,
        (args) => new URL(args[0]).hostname
      );

      const options = { timeout: 5000 };
      const result = await wrapped('https://example.com/test', options);

      expect(mockFunction).toHaveBeenCalledWith('https://example.com/test', options);
      expect(result).toEqual({ url: 'https://example.com/test', options });
    });
  });

  describe('reportScrapingResult', () => {
    it('should report metrics for adaptive throttling', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        adaptiveThrottling: true,
        useRedis: false,
      });

      await reportScrapingResult('https://example.com/page', true, 100, 200, 0);

      const stats = getRateLimitStats('example.com');
      expect(stats.requestsPerMinute).toBeGreaterThanOrEqual(0);
    });

    it('should track failed requests', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        adaptiveThrottling: true,
        useRedis: false,
      });

      await reportScrapingResult('https://example.com/page', false, 500, 500, 0);

      const stats = getRateLimitStats('example.com');
      expect(stats.successRate).toBeLessThan(1);
    });

    it('should handle multiple result reports', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        useRedis: false,
      });

      // Report multiple results
      for (let i = 0; i < 5; i++) {
        await reportScrapingResult(
          'https://example.com/page',
          i % 2 === 0, // Alternate success/failure
          200,
          100 + i * 50,
          0
        );
      }

      const stats = getRateLimitStats('example.com');
      expect(stats.requestsPerMinute).toBe(5);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return statistics for a domain', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        useRedis: false,
      });

      await checkScraperRateLimit('https://example.com/page');
      await reportScrapingResult('https://example.com/page', true, 200, 100, 0);

      const stats = getRateLimitStats('example.com');

      expect(stats).toBeDefined();
      expect(stats.requestsPerMinute).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-existent domains', async () => {
      initializeRateLimiter({
        requestsPerSecond: 10,
        useRedis: false,
      });

      const stats = getRateLimitStats('nonexistent.com');

      expect(stats).toBeDefined();
      // Stats for a domain with no activity should have default/zero values
      expect(typeof stats.requestsPerMinute).toBe('number');
    });
  });
});
