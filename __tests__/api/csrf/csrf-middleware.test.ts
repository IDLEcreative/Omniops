import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSRFToken,
  withCSRF,
  setCSRFCookie,
} from '@/lib/middleware/csrf';

describe('CSRF Middleware', () => {
  describe('withCSRF middleware', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      process.env.NODE_ENV = 'production';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalEnv;
    });

    async function mockHandler(_request: NextRequest): Promise<NextResponse> {
      return NextResponse.json({ success: true });
    }

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

    const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    statefulMethods.forEach((method) => {
      it(`allows ${method} when token is valid`, async () => {
        const token = generateCSRFToken();
        const request = createMockRequest(method, token, token);
        const protectedHandler = withCSRF(mockHandler);
        const response = await protectedHandler(request);
        expect(response.status).toBe(200);
      });

      it(`rejects ${method} without token`, async () => {
        const request = createMockRequest(method);
        const protectedHandler = withCSRF(mockHandler);
        const response = await protectedHandler(request);
        expect(response.status).toBe(403);
      });
    });

    it('rejects POST with mismatched tokens', async () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const request = createMockRequest('POST', token1, token2);
      const protectedHandler = withCSRF(mockHandler);
      const response = await protectedHandler(request);
      expect(response.status).toBe(403);
    });

    it('allows safe methods without token', async () => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
      for (const method of safeMethods) {
        const request = createMockRequest(method);
        const protectedHandler = withCSRF(mockHandler);
        const response = await protectedHandler(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('setCSRFCookie', () => {
    it('sets HTTP-only cookie in response', async () => {
      const token = generateCSRFToken();
      const response = NextResponse.json({ success: true });

      const modifiedResponse = setCSRFCookie(response, token);
      const cookieHeader = modifiedResponse.headers.get('set-cookie');

      if (cookieHeader) {
        expect(cookieHeader).toContain('csrf_token=');
        expect(cookieHeader).toContain(token);
        expect(cookieHeader).toContain('HttpOnly');
        expect(cookieHeader).toContain('SameSite=Strict');
        expect(cookieHeader).toContain('Path=/');
      } else {
        expect(token).toHaveLength(64);
      }
    });

    it('sets secure flag in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const token = generateCSRFToken();
      const response = NextResponse.json({ success: true });
      const cookieHeader = setCSRFCookie(response, token).headers.get('set-cookie');

      if (cookieHeader) {
        expect(cookieHeader).toContain('Secure');
      }

      process.env.NODE_ENV = originalEnv;
    });

    it('does not set secure flag in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const token = generateCSRFToken();
      const response = NextResponse.json({ success: true });
      const cookieHeader = setCSRFCookie(response, token).headers.get('set-cookie');

      if (cookieHeader) {
        expect(cookieHeader).not.toContain('Secure');
      }

      process.env.NODE_ENV = originalEnv;
    });
  });
});
