/**
 * Tests for basic rate limiting functionality
 * Covers: Token bucket algorithm, exponential backoff, domain-specific limits, statistics
 */

import {
  EnhancedRateLimiter,
  RateLimiterPresets,
  createRateLimiter,
} from '../../lib/rate-limiter-enhanced';

// Mock timers for testing
jest.useFakeTimers();

describe('EnhancedRateLimiter - Basic Functionality', () => {
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

  describe('Token Bucket Algorithm', () => {
    it('should allow requests within rate limit', async () => {
      const result1 = await limiter.checkRateLimit('test.com');
      expect(result1.allowed).toBe(true);
      expect(result1.tokensRemaining).toBeGreaterThan(0);

      const result2 = await limiter.checkRateLimit('test.com');
      expect(result2.allowed).toBe(true);
      expect(result2.tokensRemaining).toBeLessThan(result1.tokensRemaining);
    });

    it('should deny requests when tokens exhausted', async () => {
      // Consume all tokens
      for (let i = 0; i < 20; i++) {
        await limiter.checkRateLimit('test.com');
      }

      // Next request should be denied
      const result = await limiter.checkRateLimit('test.com');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Rate limit exceeded');
      expect(result.waitTimeMs).toBeGreaterThan(0);
    });

    it('should refill tokens over time', async () => {
      // Consume some tokens
      for (let i = 0; i < 10; i++) {
        await limiter.checkRateLimit('test.com');
      }

      // Advance time to allow refill
      jest.advanceTimersByTime(1000);

      // Should have tokens available again
      const result = await limiter.checkRateLimit('test.com');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Domain-Specific Limits', () => {
    it('should apply different limits for different domains', async () => {
      const limiterWithDomains = new EnhancedRateLimiter({
        requestsPerSecond: 1,
        burstSize: 5,
        domainLimits: new Map([
          ['fast.com', {
            requestsPerSecond: 100,
            burstSize: 200,
            priority: 'high',
            minDelay: 0,
            maxDelay: 10,
          }],
          ['slow.com', {
            requestsPerSecond: 0.5,
            burstSize: 2,
            priority: 'low',
            minDelay: 1000,
            maxDelay: 5000,
          }],
        ]),
        jitterEnabled: false,
        randomizeTimings: false,
        useRedis: false,
      });

      // Fast domain should allow many requests
      let fastAllowed = 0;
      for (let i = 0; i < 50; i++) {
        const result = await limiterWithDomains.checkRateLimit('fast.com');
        if (result.allowed) fastAllowed++;
      }
      expect(fastAllowed).toBeGreaterThan(40);

      // Slow domain should allow few requests
      let slowAllowed = 0;
      for (let i = 0; i < 5; i++) {
        const result = await limiterWithDomains.checkRateLimit('slow.com');
        if (result.allowed) slowAllowed++;
      }
      expect(slowAllowed).toBeLessThanOrEqual(2);

      await limiterWithDomains.close();
    });
  });

  describe('Exponential Backoff', () => {
    it('should increase delay exponentially on retries', async () => {
      const domain = 'backoff.com';

      // Exhaust tokens
      for (let i = 0; i < 20; i++) {
        await limiter.checkRateLimit(domain);
      }

      const delays: number[] = [];

      // Check delays for retries
      for (let retry = 0; retry < 3; retry++) {
        const result = await limiter.checkRateLimit(domain, { retryCount: retry });
        delays.push(result.waitTimeMs);
      }

      // Delays should increase
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });
  });

  describe('Request Queue', () => {
    it('should queue high priority requests', async () => {
      const domain = 'queue.com';

      // Exhaust tokens
      for (let i = 0; i < 20; i++) {
        await limiter.checkRateLimit(domain);
      }

      // Queue high priority request
      const result = await limiter.checkRateLimit(domain, { priority: 'high' });
      expect(result.allowed).toBe(false);

      // Process queue when tokens available
      jest.advanceTimersByTime(2000);
      const processed = await limiter.processQueue(domain);
      expect(processed.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should track request statistics accurately', async () => {
      const domain = 'stats.com';

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await limiter.checkRateLimit(domain);
        await limiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 100 + i * 50,
          statusCode: i === 2 ? 500 : 200,
          success: i !== 2,
          retryCount: 0,
        });
      }

      const stats = limiter.getStatistics(domain);

      expect(stats.requestsPerMinute).toBe(5);
      expect(stats.successRate).toBeCloseTo(0.8, 1);
      expect(stats.averageResponseTime).toBeCloseTo(200, -1);
    });
  });

  describe('User Agent Rotation', () => {
    it('should rotate user agents for different requests', async () => {
      const domain = 'rotate.com';
      const userAgents = new Set<string>();

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        const result = await limiter.checkRateLimit(domain);
        if (result.userAgent) {
          userAgents.add(result.userAgent);
        }
      }

      // Should have different user agents
      expect(userAgents.size).toBeGreaterThan(1);
    });
  });
});

describe('Rate Limiter Presets', () => {
  it('should have valid preset configurations', () => {
    expect(RateLimiterPresets.conservative.requestsPerSecond).toBe(1);
    expect(RateLimiterPresets.moderate.requestsPerSecond).toBe(5);
    expect(RateLimiterPresets.aggressive.requestsPerSecond).toBe(20);
    expect(RateLimiterPresets.stealth.requestsPerSecond).toBe(0.5);
  });

  it('should create limiter with preset', () => {
    const limiter = createRateLimiter(RateLimiterPresets.conservative);
    expect(limiter).toBeInstanceOf(EnhancedRateLimiter);
    limiter.close();
  });
});
