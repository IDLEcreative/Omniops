/**
 * Tests for API Rate Limiting - Enforcement and Headers
 *
 * Coverage:
 * - Rate limit enforcement for different endpoint types
 * - 429 responses with proper headers
 * - User-based vs IP-based rate limiting
 * - Webhook and trusted IP bypass
 * - Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
 * - Webhook header bypass
 * - Error handling
 * - Rate limit tier configuration
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Create mock functions before the jest.mock() call
const mockCheckRateLimit = jest.fn();
const mockResetRateLimit = jest.fn();
const mockCheckDomainRateLimit = jest.fn();
const mockCheckExpensiveOpRateLimit = jest.fn();
const mockGetRateLimitStatus = jest.fn();

// Mock rate-limit module with our jest.fn() instances
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  resetRateLimit: mockResetRateLimit,
  checkDomainRateLimit: mockCheckDomainRateLimit,
  checkExpensiveOpRateLimit: mockCheckExpensiveOpRateLimit,
  getRateLimitStatus: mockGetRateLimitStatus,
}));

import {
  applyRateLimit,
  addRateLimitHeaders,
  withAPIRateLimit,
  RATE_LIMIT_TIERS
} from '@/lib/middleware/api-rate-limit';

// Use the mock references directly
const mockedCheckRateLimit = mockCheckRateLimit;
const mockedResetRateLimit = mockResetRateLimit;

describe('API Rate Limiting - Enforcement & Headers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: allow requests
    mockedCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000
    });
  });

  describe('applyRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      mockedCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 60000
      });

      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      const result = await applyRateLimit(request);
      expect(result).toBeNull();
      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        'api:chat:ip:192.168.1.1',
        RATE_LIMIT_TIERS.chat.maxRequests,
        RATE_LIMIT_TIERS.chat.windowMs
      );
    });

    it('should return 429 when rate limit exceeded', async () => {
      const resetTime = Date.now() + 60000;
      mockedCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime
      });

      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      const result = await applyRateLimit(request);
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(429);

      const body = await result?.json();
      expect(body.error).toBe('Rate limit exceeded');
      expect(body.tier).toBe('chat');

      const headers = result?.headers;
      expect(headers?.get('Retry-After')).toBeTruthy();
      expect(headers?.get('X-RateLimit-Limit')).toBe(RATE_LIMIT_TIERS.chat.maxRequests.toString());
      expect(headers?.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers?.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should use user-based rate limiting when user provided', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST'
      });

      await applyRateLimit(request, user);

      expect(mockedCheckRateLimit).toHaveBeenCalledWith(
        'api:chat:user:user-123',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should bypass rate limiting for webhooks', async () => {
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST'
      });

      const result = await applyRateLimit(request);
      expect(result).toBeNull();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();
    });

    it('should bypass rate limiting for trusted IPs', async () => {
      process.env.TRUSTED_IPS = '192.168.1.100';

      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' }
      });

      const result = await applyRateLimit(request);
      expect(result).toBeNull();
      expect(mockedCheckRateLimit).not.toHaveBeenCalled();

      delete process.env.TRUSTED_IPS;
    });

    it('should fail open when Redis fails', async () => {
      mockedCheckRateLimit.mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      const result = await applyRateLimit(request);
      expect(result).toBeNull();
    });

    it('should apply correct rate limits for different endpoint types', async () => {
      const endpoints = [
        { path: '/api/chat', tier: 'chat', limit: 50 },
        { path: '/api/scrape', tier: 'scraping', limit: 10 },
        { path: '/api/organizations', tier: 'write', limit: 100 },
        { path: '/api/some-get', tier: 'read', limit: 200, method: 'GET' }
      ];

      for (const endpoint of endpoints) {
        mockedCheckRateLimit.mockResolvedValue({
          allowed: true,
          remaining: 10,
          resetTime: Date.now() + 60000
        });

        const request = new NextRequest(`http://localhost${endpoint.path}`, {
          method: endpoint.method || 'POST',
          headers: { 'x-forwarded-for': '192.168.1.1' }
        });

        await applyRateLimit(request);

        expect(mockedCheckRateLimit).toHaveBeenCalled();
        const lastCall = mockedCheckRateLimit.mock.calls[mockedCheckRateLimit.mock.calls.length - 1];
        expect(lastCall[0]).toContain(`api:${endpoint.tier}:ip:`);
        expect(lastCall[1]).toBe(endpoint.limit);

        jest.clearAllMocks();
      }
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', async () => {
      mockedCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 45,
        resetTime: Date.now() + 60000
      });

      const response = NextResponse.json({ success: true });
      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      await addRateLimitHeaders(response, request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('50');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Tier')).toBe('chat');
    });

    it('should skip headers for webhooks', async () => {
      const response = NextResponse.json({ success: true });
      const request = new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST'
      });

      await addRateLimitHeaders(response, request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeFalsy();
    });

    it('should handle errors gracefully', async () => {
      jest.clearAllMocks();
      mockedCheckRateLimit.mockRejectedValue(new Error('Redis error'));

      const response = NextResponse.json({ success: true });
      const request = new NextRequest('http://localhost/api/chat', {
        method: 'POST'
      });

      await expect(addRateLimitHeaders(response, request)).resolves.toBeDefined();
    });
  });

  describe('withAPIRateLimit', () => {
    it('should execute handler when rate limit passes', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      mockedCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 60000
      });

      const result = await withAPIRateLimit(request, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);
      const body = await result.json();
      expect(body.data).toBe('test');
    });

    it('should return 429 when rate limit exceeded', async () => {
      jest.clearAllMocks();

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ should: 'not be called' }));
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      mockedCheckRateLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      });

      const result = await withAPIRateLimit(request, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(429);
    });

    it('should add rate limit headers to successful response', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      mockedCheckRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 150,
        resetTime: Date.now() + 60000
      });

      const result = await withAPIRateLimit(request, mockHandler);

      expect(result.headers.get('X-RateLimit-Limit')).toBe('200');
      expect(result.headers.get('X-RateLimit-Tier')).toBe('read');
    });
  });

  describe('Rate limit tiers configuration', () => {
    it('should have correct chat tier configuration', () => {
      expect(RATE_LIMIT_TIERS.chat.maxRequests).toBe(50);
      expect(RATE_LIMIT_TIERS.chat.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct scraping tier configuration', () => {
      expect(RATE_LIMIT_TIERS.scraping.maxRequests).toBe(10);
      expect(RATE_LIMIT_TIERS.scraping.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct write tier configuration', () => {
      expect(RATE_LIMIT_TIERS.write.maxRequests).toBe(100);
      expect(RATE_LIMIT_TIERS.write.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct read tier configuration', () => {
      expect(RATE_LIMIT_TIERS.read.maxRequests).toBe(200);
      expect(RATE_LIMIT_TIERS.read.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have webhook tier with no limit', () => {
      expect(RATE_LIMIT_TIERS.webhook.maxRequests).toBe(Infinity);
    });
  });
});
