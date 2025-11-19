/**
 * WooCommerce Health API Tests
 *
 * Tests for /api/woocommerce/health endpoint
 * Coverage: GET (health check, single domain, multiple domains, error scenarios)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/woocommerce/health/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));
jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: jest.fn(),
}));

describe('/api/woocommerce/health', () => {
  let mockSupabase: any;
  let mockGetDynamicWooCommerceClient: jest.Mock;

  beforeEach(() => {
    // Create chainable and thenable query builder
    const queryBuilder: any = {};

    // Setup methods using mockImplementation to ensure proper chainability
    queryBuilder.select = jest.fn(function() { return queryBuilder; });
    queryBuilder.not = jest.fn(function() { return queryBuilder; });
    queryBuilder.eq = jest.fn(function() { return queryBuilder; });

    // Setup then for awaiting
    queryBuilder.then = jest.fn(function(onFulfilled: any, onRejected: any) {
      return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
    });

    // Create mock Supabase client with from method returning the queryBuilder
    mockSupabase = {
      from: jest.fn(function() { return queryBuilder; }),
    };

    // Store queryBuilder for tests to customize
    (mockSupabase as any).queryBuilder = queryBuilder;

    // Reset and setup mocks
    const supabaseServer = jest.requireMock('@/lib/supabase/server');
    supabaseServer.createClient.mockClear();
    supabaseServer.createClient.mockReturnValue(mockSupabase);

    // Setup WooCommerce mock
    const woocommerceDynamic = jest.requireMock('@/lib/woocommerce-dynamic');
    mockGetDynamicWooCommerceClient = woocommerceDynamic.getDynamicWooCommerceClient;
    mockGetDynamicWooCommerceClient.mockClear();
  });

  describe('GET - Single domain health check', () => {
    it('should return healthy status for configured domain', async () => {
      const mockConfig = {
        id: 'config-123',
        domain: 'example.com',
        woocommerce_url: 'https://shop.example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockWooClient = {
        get: jest.fn().mockResolvedValue({ data: { environment: 'production' } }),
      };

      // Mock the query result - override the then function for this test
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: [mockConfig], error: null }).then(onFulfilled, onRejected);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient);

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.health_checks).toHaveLength(1);
      expect(data.data.health_checks[0]).toMatchObject({
        domain: 'example.com',
        status: 'healthy',
        woocommerce_url: 'https://shop.example.com',
      });
      expect(data.data.health_checks[0].response_time_ms).toBeGreaterThan(0);
    });

    it('should return error status when WooCommerce client initialization fails', async () => {
      const mockConfig = {
        id: 'config-123',
        domain: 'example.com',
        woocommerce_url: 'https://shop.example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock the query result
      mockSupabase.queryBuilder.then = jest.fn((onFulfilled) => {
        const result = { data: [mockConfig], error: null };
        if (onFulfilled) {
          return Promise.resolve(onFulfilled(result));
        }
        return Promise.resolve(result);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.health_checks[0].status).toBe('error');
      expect(data.data.health_checks[0].message).toContain('Failed to initialize');
    });

    it('should return error status when API connectivity fails', async () => {
      const mockConfig = {
        id: 'config-123',
        domain: 'example.com',
        woocommerce_url: 'https://shop.example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockWooClient = {
        get: jest.fn().mockRejectedValue(new Error('Network timeout')),
      };

      // Mock the query result
      mockSupabase.queryBuilder.then = jest.fn((onFulfilled) => {
        const result = { data: [mockConfig], error: null };
        if (onFulfilled) {
          return Promise.resolve(onFulfilled(result));
        }
        return Promise.resolve(result);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient);

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.health_checks[0].status).toBe('error');
      expect(data.data.health_checks[0].message).toContain('Network timeout');
    });
  });

  describe('GET - Multiple domains health check', () => {
    it('should check health for all configured domains', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          domain: 'domain1.com',
          woocommerce_url: 'https://shop1.com',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'config-2',
          domain: 'domain2.com',
          woocommerce_url: 'https://shop2.com',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockWooClient = {
        get: jest.fn().mockResolvedValue({ data: {} }),
      };

      // Mock the query result
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: mockConfigs, error: null }).then(onFulfilled, onRejected);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient);

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.health_checks).toHaveLength(2);
      expect(data.data.health_checks[0].domain).toBe('domain1.com');
      expect(data.data.health_checks[1].domain).toBe('domain2.com');
    });

    it('should handle mixed health statuses', async () => {
      const mockConfigs = [
        { id: 'config-1', domain: 'healthy.com', woocommerce_url: 'https://shop1.com', created_at: '2024-01-01T00:00:00Z' },
        { id: 'config-2', domain: 'failing.com', woocommerce_url: 'https://shop2.com', created_at: '2024-01-02T00:00:00Z' },
      ];

      // Mock the query result
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: mockConfigs, error: null }).then(onFulfilled, onRejected);
      });

      mockGetDynamicWooCommerceClient.mockImplementation(async (domain) => {
        if (domain === 'healthy.com') {
          return { get: jest.fn().mockResolvedValue({ data: {} }) };
        } else {
          return null; // Failing domain
        }
      });

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.health_checks[0].status).toBe('healthy');
      expect(data.data.health_checks[1].status).toBe('error');
    });
  });

  describe('GET - No configurations found', () => {
    it('should return empty result when no configurations exist', async () => {
      // Mock the query result
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      });

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No WooCommerce configurations found');
      expect(data.data.configured_domains).toEqual([]);
      expect(data.data.health_checks).toEqual([]);
    });

    it('should return specific message when domain not configured', async () => {
      // Mock the query result
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      });

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=nonexistent.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toContain('not configured for domain: nonexistent.com');
    });
  });

  describe('GET - Database errors', () => {
    it('should return 500 when Supabase client creation fails', async () => {
      const supabaseServer = jest.requireMock('@/lib/supabase/server');
      supabaseServer.createClient.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database connection failed');
    });

    it('should return 500 when config query fails', async () => {
      // Mock the query result with error
      mockSupabase.queryBuilder.then.mockImplementation((onFulfilled, onRejected) => {
        return Promise.resolve({ data: null, error: { message: 'Query error', code: 'PGRST116' } }).then(onFulfilled, onRejected);
      });

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch configurations');
    });
  });

  describe('GET - Response time tracking', () => {
    it('should track response time for health checks', async () => {
      const mockConfig = {
        id: 'config-123',
        domain: 'example.com',
        woocommerce_url: 'https://shop.example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockWooClient = {
        get: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: {} }), 50);
          });
        }),
      };

      // Mock the query result
      mockSupabase.queryBuilder.then = jest.fn((onFulfilled) => {
        const result = { data: [mockConfig], error: null };
        if (onFulfilled) {
          return Promise.resolve(onFulfilled(result));
        }
        return Promise.resolve(result);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient);

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.health_checks[0].response_time_ms).toBeGreaterThan(0);
      expect(typeof data.data.health_checks[0].response_time_ms).toBe('number');
    });

    it('should track response time even when request fails', async () => {
      const mockConfig = {
        id: 'config-123',
        domain: 'example.com',
        woocommerce_url: 'https://shop.example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockWooClient = {
        get: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      // Mock the query result
      mockSupabase.queryBuilder.then = jest.fn((onFulfilled) => {
        const result = { data: [mockConfig], error: null };
        if (onFulfilled) {
          return Promise.resolve(onFulfilled(result));
        }
        return Promise.resolve(result);
      });

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient);

      const request = new Request('http://localhost:3000/api/woocommerce/health?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.health_checks[0].response_time_ms).toBeGreaterThan(0);
      expect(data.data.health_checks[0].status).toBe('error');
    });
  });
});
