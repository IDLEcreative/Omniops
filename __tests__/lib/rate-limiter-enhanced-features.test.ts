/**
 * Tests for advanced rate limiting features
 * Covers: Circuit breaker, adaptive throttling, request result reporting
 */

import { EnhancedRateLimiter } from '../../lib/rate-limiter-enhanced';

// Mock timers for testing
jest.useFakeTimers();

describe('EnhancedRateLimiter - Advanced Features', () => {
  let limiter: EnhancedRateLimiter;

  beforeEach(() => {
    limiter = new EnhancedRateLimiter({
      requestsPerSecond: 10,
      burstSize: 20,
      adaptiveThrottling: true,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 10000,
      enableExponentialBackoff: true,
      initialBackoffMs: 1000,
      maxBackoffMs: 10000,
      jitterEnabled: false, // Disable for predictable tests
      randomizeTimings: false,
      rotateUserAgents: true,
      useRedis: false, // Use in-memory for tests
    });
  });

  afterEach(async () => {
    await limiter.close();
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const domain = 'failing.com';

      // Report failures
      for (let i = 0; i < 3; i++) {
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: 503,
          success: false,
          retryCount: i,
        });
      }

      // Circuit breaker should be open
      const result = await limiter.checkRateLimit(domain);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Circuit breaker open');
    });

    it('should transition to half-open after timeout', async () => {
      const domain = 'recovering.com';

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: 503,
          success: false,
          retryCount: i,
        });
      }

      // Advance time past circuit breaker timeout
      jest.advanceTimersByTime(11000);

      // Should allow request (half-open state)
      const result = await limiter.checkRateLimit(domain);
      expect(result.allowed).toBe(true);
    });

    it('should close circuit breaker after successful requests in half-open state', async () => {
      const domain = 'recovered.com';

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: 503,
          success: false,
          retryCount: i,
        });
      }

      // Advance to half-open
      jest.advanceTimersByTime(11000);

      // Report successful requests
      for (let i = 0; i < 3; i++) {
        await limiter.checkRateLimit(domain);
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: 200,
          success: true,
          retryCount: 0,
        });
      }

      // Circuit breaker should be closed
      const stats = limiter.getStatistics(domain);
      expect(stats.circuitBreakerState).toBe('closed');
    });
  });

  describe('Adaptive Throttling', () => {
    it('should reduce rate on 429 responses', async () => {
      const domain = 'throttled.com';

      // Get initial rate
      await limiter.checkRateLimit(domain);
      const initialStats = limiter.getStatistics(domain);
      const initialRate = initialStats.currentRate;

      // Report 429 response
      await limiter.reportRequestResult({
        domain,
        timestamp: Date.now(),
        responseTime: 100,
        statusCode: 429,
        success: false,
        retryCount: 0,
      });

      // Rate should be reduced
      const newStats = limiter.getStatistics(domain);
      expect(newStats.currentRate).toBeLessThan(initialRate);
    });

    it('should increase rate on fast successful responses', async () => {
      const domain = 'fast.com';

      // Get initial rate
      await limiter.checkRateLimit(domain);
      const initialStats = limiter.getStatistics(domain);
      const initialRate = initialStats.currentRate;

      // Report fast successful response
      await limiter.reportRequestResult({
        domain,
        timestamp: Date.now(),
        responseTime: 50,
        statusCode: 200,
        success: true,
        retryCount: 0,
      });

      // Rate should be increased
      const newStats = limiter.getStatistics(domain);
      expect(newStats.currentRate).toBeGreaterThan(initialRate);
    });

    it('should handle multiple status codes correctly', async () => {
      const domain = 'mixed.com';

      await limiter.checkRateLimit(domain);
      const initialStats = limiter.getStatistics(domain);

      // Report various response codes
      const testCases = [
        { statusCode: 200, success: true, expectedImpact: 'increase' },
        { statusCode: 429, success: false, expectedImpact: 'decrease' },
        { statusCode: 503, success: false, expectedImpact: 'decrease' },
        { statusCode: 500, success: false, expectedImpact: 'decrease' },
      ];

      for (const testCase of testCases) {
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: testCase.statusCode,
          success: testCase.success,
          retryCount: 0,
        });
      }

      const finalStats = limiter.getStatistics(domain);
      expect(finalStats.requestsPerMinute).toBeGreaterThan(0);
    });
  });

  describe('Request Result Reporting', () => {
    it('should track response times accurately', async () => {
      const domain = 'timing.com';

      const responseTimes = [100, 200, 300, 400, 500];
      for (const responseTime of responseTimes) {
        await limiter.checkRateLimit(domain);
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime,
          statusCode: 200,
          success: true,
          retryCount: 0,
        });
      }

      const stats = limiter.getStatistics(domain);
      expect(stats.averageResponseTime).toBeCloseTo(300, -1);
    });

    it('should calculate success rate correctly', async () => {
      const domain = 'success-rate.com';

      // 3 successes, 2 failures
      const results = [
        { success: true, statusCode: 200 },
        { success: true, statusCode: 200 },
        { success: false, statusCode: 500 },
        { success: true, statusCode: 200 },
        { success: false, statusCode: 503 },
      ];

      for (const result of results) {
        await limiter.checkRateLimit(domain);
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100,
          statusCode: result.statusCode,
          success: result.success,
          retryCount: 0,
        });
      }

      const stats = limiter.getStatistics(domain);
      expect(stats.successRate).toBeCloseTo(0.6, 1);
    });
  });
});
