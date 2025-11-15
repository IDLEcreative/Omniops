/**
 * Endpoint Protection Tests
 *
 * Tests that individual endpoints properly enforce CSRF protection.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as csrfGet } from '@/app/api/csrf/route';
import { POST as customerConfigPost, PUT as customerConfigPut, DELETE as customerConfigDelete } from '@/app/api/customer/config/route';
import { POST as scrapePost } from '@/app/api/scrape/route';
import { POST as trainingPost } from '@/app/api/training/route';
import { POST as woocommerceConfigurePost } from '@/app/api/woocommerce/configure/route';
import { POST as privacyDeletePost } from '@/app/api/privacy/delete/route';
import { createMockRequest } from '../shared/csrf-test-helpers';

describe('CSRF Endpoint Protection', () => {
  let csrfToken: string;

  beforeAll(async () => {
    const request = new NextRequest('http://localhost:3000/api/csrf');
    const response = await csrfGet(request);
    const data = await response.json();
    csrfToken = data.csrfToken;
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
        true,
        csrfToken
      );
      const response = await customerConfigPost(request);
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
        true,
        csrfToken
      );
      const response = await scrapePost(request);
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
        true,
        csrfToken
      );
      const response = await trainingPost(request);
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
        true,
        csrfToken
      );
      const response = await woocommerceConfigurePost(request);
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
        true,
        csrfToken
      );
      const response = await privacyDeletePost(request);
      expect(response.status).not.toBe(403);
      if (response.status === 403) {
        const data = await response.json();
        expect(data.error).not.toContain('CSRF token');
      }
    });
  });
});
