/**
 * Tests for the enhanced rate limiting system
 */

import { 
  EnhancedRateLimiter, 
  RateLimiterPresets,
  createRateLimiter,
} from '../../lib/rate-limiter-enhanced';
import {
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  withRateLimit,
  cleanupRateLimiter,
} from '../../lib/scraper-rate-limit-integration';

// Mock timers for testing
jest.useFakeTimers();

describe('EnhancedRateLimiter', () => {
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
});

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
          (error as any).response = { status: 429 };
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