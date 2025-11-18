/**
 * Tests for API Rate Limiting - Configuration and Utilities
 *
 * Coverage:
 * - Rate limit tier determination
 * - Client IP extraction
 * - Trusted IP checking
 */

import { NextRequest } from 'next/server';
import {
  determineRateLimitTier,
  getClientIP,
  isTrustedIP,
} from '@/lib/middleware/api-rate-limit';

describe('API Rate Limiting - Configuration', () => {
  describe('determineRateLimitTier', () => {
    it('should identify chat endpoints', () => {
      expect(determineRateLimitTier('/api/chat', 'POST')).toBe('chat');
      expect(determineRateLimitTier('/api/ai-quote/analyze', 'POST')).toBe('chat');
    });

    it('should identify scraping endpoints', () => {
      expect(determineRateLimitTier('/api/scrape', 'POST')).toBe('scraping');
      expect(determineRateLimitTier('/api/setup-rag', 'POST')).toBe('scraping');
    });

    it('should identify webhook endpoints', () => {
      expect(determineRateLimitTier('/api/stripe/webhook', 'POST')).toBe('webhook');
      expect(determineRateLimitTier('/api/whatsapp/webhook', 'POST')).toBe('webhook');
    });

    it('should identify write operations', () => {
      expect(determineRateLimitTier('/api/organizations', 'POST')).toBe('write');
      expect(determineRateLimitTier('/api/privacy/delete', 'DELETE')).toBe('write');
      expect(determineRateLimitTier('/api/customer', 'PUT')).toBe('write');
    });

    it('should default to read for GET requests', () => {
      expect(determineRateLimitTier('/api/some-endpoint', 'GET')).toBe('read');
      expect(determineRateLimitTier('/api/dashboard/analytics', 'GET')).toBe('read');
    });

    it('should default to write for POST/PUT/DELETE', () => {
      expect(determineRateLimitTier('/api/unknown', 'POST')).toBe('write');
      expect(determineRateLimitTier('/api/unknown', 'PUT')).toBe('write');
      expect(determineRateLimitTier('/api/unknown', 'DELETE')).toBe('write');
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-real-ip': '192.168.1.2' }
      });
      expect(getClientIP(request)).toBe('192.168.1.2');
    });

    it('should extract IP from cf-connecting-ip', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'cf-connecting-ip': '192.168.1.3' }
      });
      expect(getClientIP(request)).toBe('192.168.1.3');
    });

    it('should return unknown if no IP headers', () => {
      const request = new NextRequest('http://localhost/api/test');
      expect(getClientIP(request)).toBe('unknown');
    });
  });

  describe('isTrustedIP', () => {
    const originalEnv = process.env.TRUSTED_IPS;

    afterEach(() => {
      process.env.TRUSTED_IPS = originalEnv;
    });

    it('should return true for trusted IPs', () => {
      process.env.TRUSTED_IPS = '192.168.1.100,10.0.0.50';
      expect(isTrustedIP('192.168.1.100')).toBe(true);
      expect(isTrustedIP('10.0.0.50')).toBe(true);
    });

    it('should return false for non-trusted IPs', () => {
      process.env.TRUSTED_IPS = '192.168.1.100,10.0.0.50';
      expect(isTrustedIP('192.168.1.99')).toBe(false);
      expect(isTrustedIP('1.2.3.4')).toBe(false);
    });

    it('should return false when no trusted IPs configured', () => {
      process.env.TRUSTED_IPS = '';
      expect(isTrustedIP('192.168.1.100')).toBe(false);
    });
  });
});
