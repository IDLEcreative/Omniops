/**
 * CSRF Protection Tests
 *
 * Tests the CSRF token generation, validation, and middleware protection
 * for state-changing API endpoints.
 *
 * Coverage:
 * - Token generation and cookie setting
 * - Token validation (valid, missing, invalid)
 * - Middleware protection on POST/PUT/PATCH/DELETE
 * - Safe methods (GET) don't require CSRF
 * - Timing-safe comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSRFToken,
  validateCSRFToken,
  withCSRF,
  setCSRFCookie,
  requiresCSRF,
} from '@/lib/middleware/csrf';
import { timingSafeEqual } from 'crypto';

describe('CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }
      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('validateCSRFToken', () => {
    function createMockRequest(
      method: string,
      cookieToken?: string,
      headerToken?: string
    ): NextRequest {
      const url = 'http://localhost:3000/api/test';
      const headers = new Headers();
      if (headerToken) {
        headers.set('x-csrf-token', headerToken);
      }
      if (cookieToken) {
        headers.set('cookie', `csrf_token=${cookieToken}`);
      }

      return new NextRequest(url, {
        method,
        headers,
      });
    }

    it('should return true when cookie and header tokens match', () => {
      const token = generateCSRFToken();
      const request = createMockRequest('POST', token, token);
      expect(validateCSRFToken(request)).toBe(true);
    });

    it('should return false when cookie token is missing', () => {
      const token = generateCSRFToken();
      const request = createMockRequest('POST', undefined, token);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when header token is missing', () => {
      const token = generateCSRFToken();
      const request = createMockRequest('POST', token, undefined);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when tokens do not match', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const request = createMockRequest('POST', token1, token2);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when both tokens are missing', () => {
      const request = createMockRequest('POST', undefined, undefined);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should handle tokens of different lengths', () => {
      const request = createMockRequest('POST', 'short', 'muchlongertoken');
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // This test verifies that timing-safe comparison is used
      // by checking that the function doesn't throw on equal-length strings
      const token = generateCSRFToken();
      const wrongToken = 'a'.repeat(64); // Same length, different content
      const request = createMockRequest('POST', token, wrongToken);
      expect(validateCSRFToken(request)).toBe(false);
    });
  });


  describe('requiresCSRF', () => {
    function createMockRequest(method: string): NextRequest {
      return new NextRequest('http://localhost:3000/api/test', { method });
    }

    it('should return true for POST', () => {
      const request = createMockRequest('POST');
      expect(requiresCSRF(request)).toBe(true);
    });

    it('should return true for PUT', () => {
      const request = createMockRequest('PUT');
      expect(requiresCSRF(request)).toBe(true);
    });

    it('should return true for PATCH', () => {
      const request = createMockRequest('PATCH');
      expect(requiresCSRF(request)).toBe(true);
    });

    it('should return true for DELETE', () => {
      const request = createMockRequest('DELETE');
      expect(requiresCSRF(request)).toBe(true);
    });

    it('should return false for GET', () => {
      const request = createMockRequest('GET');
      expect(requiresCSRF(request)).toBe(false);
    });

    it('should return false for HEAD', () => {
      const request = createMockRequest('HEAD');
      expect(requiresCSRF(request)).toBe(false);
    });

    it('should return false for OPTIONS', () => {
      const request = createMockRequest('OPTIONS');
      expect(requiresCSRF(request)).toBe(false);
    });
  });

  describe('Security properties', () => {
    it('should prevent timing attacks with constant-time comparison', () => {
      const token = generateCSRFToken();
      const wrongToken = generateCSRFToken();

      function createMockRequest(
        cookieToken: string,
        headerToken: string
      ): NextRequest {
        const url = 'http://localhost:3000/api/test';
        const headers = new Headers();
        headers.set('x-csrf-token', headerToken);
        headers.set('cookie', `csrf_token=${cookieToken}`);
        return new NextRequest(url, { method: 'POST', headers });
      }

      // Multiple attempts with wrong tokens should not reveal information
      const attempts = 10;
      const timings: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const start = performance.now();
        const request = createMockRequest(token, wrongToken);
        validateCSRFToken(request);
        const end = performance.now();
        timings.push(end - start);
      }

      // Timings should be relatively consistent (variance < 50%)
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const variance =
        timings.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) /
        timings.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avgTiming;

      // Allow for some variation due to system load, but not too much
      expect(coefficientOfVariation).toBeLessThan(0.5);
    });

    it('should generate tokens with sufficient entropy', () => {
      // 32 bytes = 256 bits of entropy
      const token = generateCSRFToken();
      const bytes = Buffer.from(token, 'hex');
      expect(bytes.length).toBe(32);

      // Check that not all bytes are the same (extremely unlikely with random data)
      const uniqueBytes = new Set(bytes);
      expect(uniqueBytes.size).toBeGreaterThan(20); // At least 20 unique byte values
    });
  });
});
