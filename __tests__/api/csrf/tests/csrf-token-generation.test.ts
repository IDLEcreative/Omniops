/**
 * CSRF Token Generation Tests
 *
 * Tests that CSRF tokens are generated correctly with proper HTTP-only cookies.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as csrfGet } from '@/app/api/csrf/route';

describe('CSRF Token Generation', () => {
  let csrfToken: string;

  beforeAll(async () => {
    const request = new NextRequest('http://localhost:3000/api/csrf');
    const response = await csrfGet(request);
    const data = await response.json();
    csrfToken = data.csrfToken;
    expect(csrfToken).toBeTruthy();
  });

  describe('GET /api/csrf', () => {
    it('should return a valid CSRF token', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf');
      const response = await csrfGet(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.csrfToken).toBeTruthy();
      expect(data.csrfToken).toHaveLength(64);
      expect(data.expiresIn).toBe(86400);
    });

    it('should set HTTP-only cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf');
      const response = await csrfGet(request);
      const cookieHeader = response.headers.get('set-cookie');
      expect(cookieHeader).toContain('csrf_token=');
      expect(cookieHeader).toContain('HttpOnly');
      expect(cookieHeader).toContain('SameSite=Strict');
    });
  });
});
