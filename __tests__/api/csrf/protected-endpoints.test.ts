/**
 * Protected Endpoints Integration Tests
 *
 * Tests that CSRF protection is properly applied to all state-changing endpoints.
 * Verifies that endpoints reject requests without valid CSRF tokens.
 */

import { NextRequest } from 'next/server';
import { GET as csrfGet } from '@/app/api/csrf/route';
import { POST as customerConfigPost, PUT as customerConfigPut, DELETE as customerConfigDelete } from '@/app/api/customer/config/route';
import { POST as scrapePost } from '@/app/api/scrape/route';
import { POST as trainingPost } from '@/app/api/training/route';
import { POST as woocommerceConfigurePost } from '@/app/api/woocommerce/configure/route';
import { POST as privacyDeletePost } from '@/app/api/privacy/delete/route';

describe('CSRF Protected Endpoints', () => {
  let csrfToken: string;

  /**
   * Helper to create mock request with optional CSRF token
   */
  function createMockRequest(
    url: string,
    method: string,
    body?: any,
    includeCSRF: boolean = false
  ): NextRequest {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (includeCSRF && csrfToken) {
      headers.set('x-csrf-token', csrfToken);
      headers.set('cookie', `csrf_token=${csrfToken}`);
    }

    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Fetch a valid CSRF token before tests
   */
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

  describe('POST /api/customer/config', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/customer/config',
        'POST',
        { domain: 'example.com' },
        false
      );
      const response = await customerConfigPost(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });

    it('should accept request with valid CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/customer/config',
        'POST',
        { domain: 'example.com' },
        true
      );
      const response = await customerConfigPost(request);
      // Note: Might fail due to auth/validation, but should NOT be 403 CSRF error
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });

  describe('PUT /api/customer/config', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/customer/config?id=test-id',
        'PUT',
        { domain: 'example.com' },
        false
      );
      const response = await customerConfigPut(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });
  });

  describe('DELETE /api/customer/config', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/customer/config?id=test-id',
        'DELETE',
        undefined,
        false
      );
      const response = await customerConfigDelete(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });
  });

  describe('POST /api/scrape', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/scrape',
        'POST',
        { url: 'https://example.com', crawl: false },
        false
      );
      const response = await scrapePost(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });

    it('should accept request with valid CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/scrape',
        'POST',
        { url: 'https://example.com', crawl: false },
        true
      );
      const response = await scrapePost(request);
      // Should not be CSRF error (might be other errors)
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });

  describe('POST /api/training', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/training',
        'POST',
        { type: 'faq', content: 'Test content', domain: 'example.com' },
        false
      );
      const response = await trainingPost(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });

    it('should accept request with valid CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/training',
        'POST',
        { type: 'faq', content: 'Test content', domain: 'example.com' },
        true
      );
      const response = await trainingPost(request);
      // Should not be CSRF error
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });

  describe('POST /api/woocommerce/configure', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/woocommerce/configure',
        'POST',
        {
          url: 'https://example.com',
          consumerKey: 'ck_test',
          consumerSecret: 'cs_test',
        },
        false
      );
      const response = await woocommerceConfigurePost(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });

    it('should accept request with valid CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/woocommerce/configure',
        'POST',
        {
          url: 'https://example.com',
          consumerKey: 'ck_test',
          consumerSecret: 'cs_test',
        },
        true
      );
      const response = await woocommerceConfigurePost(request);
      // Should not be CSRF error
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });

  describe('POST /api/privacy/delete', () => {
    it('should reject request without CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/privacy/delete',
        'POST',
        { userId: 'test-user-id' },
        false
      );
      const response = await privacyDeletePost(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('CSRF token');
    });

    it('should accept request with valid CSRF token', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/privacy/delete',
        'POST',
        { userId: 'test-user-id' },
        true
      );
      const response = await privacyDeletePost(request);
      // Should not be CSRF error
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });

  describe('Attack scenarios prevented', () => {
    it('should prevent cross-origin requests without CSRF token', async () => {
      // Simulates attacker's site making request
      const request = createMockRequest(
        'http://localhost:3000/api/customer/config',
        'POST',
        { domain: 'malicious.com' },
        false
      );
      const response = await customerConfigPost(request);
      expect(response.status).toBe(403);
    });

    it('should prevent requests with only cookie (no header)', async () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('cookie', `csrf_token=${csrfToken}`);
      // No x-csrf-token header

      const request = new NextRequest(
        'http://localhost:3000/api/customer/config',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ domain: 'example.com' }),
        }
      );

      const response = await customerConfigPost(request);
      expect(response.status).toBe(403);
    });

    it('should prevent requests with only header (no cookie)', async () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('x-csrf-token', csrfToken);
      // No cookie

      const request = new NextRequest(
        'http://localhost:3000/api/customer/config',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ domain: 'example.com' }),
        }
      );

      const response = await customerConfigPost(request);
      expect(response.status).toBe(403);
    });

    it('should prevent requests with mismatched tokens', async () => {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('x-csrf-token', 'wrong-token-123');
      headers.set('cookie', `csrf_token=${csrfToken}`);

      const request = new NextRequest(
        'http://localhost:3000/api/customer/config',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ domain: 'example.com' }),
        }
      );

      const response = await customerConfigPost(request);
      expect(response.status).toBe(403);
    });
  });
});
