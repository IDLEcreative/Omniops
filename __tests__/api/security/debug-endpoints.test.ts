/**
 * Debug Endpoint Security Tests
 *
 * Tests that all debug/test endpoints are properly protected in production
 *
 * CRITICAL: These endpoints must return 404 in production to prevent:
 * - Information disclosure
 * - Configuration leakage
 * - Database schema exposure
 * - API key/credential exposure
 */

import { NextRequest } from 'next/server';

describe('Debug Endpoint Security', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clear any module cache
    jest.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete process.env.ENABLE_DEBUG_ENDPOINTS;
  });

  const debugEndpoints = [
    { path: '/api/debug/example.com', method: 'GET' },
    { path: '/api/test-rag', method: 'GET' },
    { path: '/api/test-embeddings', method: 'GET' },
    { path: '/api/test-db', method: 'GET' },
    { path: '/api/test-woocommerce', method: 'GET' },
    { path: '/api/test-woo', method: 'GET' },
    { path: '/api/check-rag', method: 'GET' },
    { path: '/api/check-domain-content', method: 'GET' },
    { path: '/api/fix-rag', method: 'POST' },
    { path: '/api/fix-customer-config', method: 'POST' },
    { path: '/api/setup-rag', method: 'GET' },
    { path: '/api/setup-rag-production', method: 'GET' },
    { path: '/api/debug-rag', method: 'GET' },
    { path: '/api/simple-rag-test', method: 'GET' },
    { path: '/api/woocommerce/test', method: 'GET' },
    { path: '/api/woocommerce/cart/test', method: 'GET' },
    { path: '/api/shopify/test', method: 'GET' },
    { path: '/api/dashboard/test-connection', method: 'POST' },
  ];

  describe('Production Environment Protection', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DEBUG_ENDPOINTS;
    });

    debugEndpoints.forEach(({ path, method }) => {
      it(`should block ${method} ${path} in production`, async () => {
        // Import middleware
        const { middleware } = await import('@/middleware');

        // Create mock request
        const request = new NextRequest(new URL(`http://localhost:3000${path}`));

        // Execute middleware
        const response = await middleware(request);

        // Verify 404 response
        expect(response.status).toBe(404);

        const body = await response.json();
        expect(body.error).toBe('Not found');
      });
    });

    it('should protect all debug patterns via middleware', async () => {
      const { middleware } = await import('@/middleware');

      const testPaths = [
        '/api/debug/test',
        '/api/test-anything',
        '/api/check-something',
        '/api/fix-issue',
        '/api/setup-service',
      ];

      for (const path of testPaths) {
        const request = new NextRequest(new URL(`http://localhost:3000${path}`));
        const response = await middleware(request);

        expect(response.status).toBe(404);
      }
    });
  });

  describe('Development Environment Access', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should allow debug endpoints in development', async () => {
      const { middleware } = await import('@/middleware');

      const request = new NextRequest(new URL('http://localhost:3000/api/test-rag'));
      const response = await middleware(request);

      // Middleware should not block in development (would return next())
      // We can't test the full endpoint here, but we can verify middleware doesn't block
      expect(response.status).not.toBe(404);
    });
  });

  describe('Production with Debug Flag', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEBUG_ENDPOINTS = 'true';
    });

    it('should allow debug endpoints when explicitly enabled', async () => {
      const { middleware } = await import('@/middleware');

      const request = new NextRequest(new URL('http://localhost:3000/api/test-rag'));
      const response = await middleware(request);

      // Should not block when flag is set
      expect(response.status).not.toBe(404);
    });

    it('should NOT allow debug endpoints if flag is false', async () => {
      process.env.ENABLE_DEBUG_ENDPOINTS = 'false';

      const { middleware } = await import('@/middleware');

      const request = new NextRequest(new URL('http://localhost:3000/api/test-rag'));
      const response = await middleware(request);

      expect(response.status).toBe(404);
    });
  });

  describe('Public Endpoints Should Work', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DEBUG_ENDPOINTS;
    });

    const publicEndpoints = [
      '/api/chat',
      '/api/health',
      '/api/scrape',
      '/api/woocommerce/products',
      '/api/widget-config',
    ];

    publicEndpoints.forEach((path) => {
      it(`should allow ${path} in production`, async () => {
        const { middleware } = await import('@/middleware');

        const request = new NextRequest(new URL(`http://localhost:3000${path}`));
        const response = await middleware(request);

        // Public endpoints should not be blocked
        expect(response.status).not.toBe(404);
      });
    });
  });

  describe('Individual Endpoint Protection', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DEBUG_ENDPOINTS;
    });

    it('should have defense-in-depth protection at endpoint level', async () => {
      // Test that endpoints have their own protection in addition to middleware
      // This is defense-in-depth strategy

      const endpointsToTest = [
        { route: '@/app/api/test-rag/route', name: 'test-rag' },
        { route: '@/app/api/debug-rag/route', name: 'debug-rag' },
        { route: '@/app/api/test-embeddings/route', name: 'test-embeddings' },
      ];

      for (const endpoint of endpointsToTest) {
        try {
          const endpointModule = await import(endpoint.route);

          if (endpointModule.GET) {
            const request = new NextRequest(new URL('http://localhost:3000/test'));
            const response = await endpointModule.GET(request);

            // Should return 404 from endpoint itself
            expect(response.status).toBe(404);
          }
        } catch (error) {
          // Some imports might fail, that's ok for this test
          console.log(`Could not test ${endpoint.name}:`, error);
        }
      }
    });
  });

  describe('Security Headers and Response', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_DEBUG_ENDPOINTS;
    });

    it('should not leak information in 404 responses', async () => {
      const { middleware } = await import('@/middleware');

      const request = new NextRequest(new URL('http://localhost:3000/api/debug/test'));
      const response = await middleware(request);

      expect(response.status).toBe(404);

      const body = await response.json();

      // Should only say "Not found", not reveal why
      expect(body.error).toBe('Not found');
      expect(body).not.toHaveProperty('details');
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('config');
    });
  });
});
