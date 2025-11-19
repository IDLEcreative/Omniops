/**
 * WooCommerce Health API Tests
 *
 * Tests for /api/woocommerce/health endpoint
 * Coverage: GET (health check, single domain, multiple domains, error scenarios)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/woocommerce/health/route';
import * as supabaseServer from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: jest.fn(),
}));

describe('/api/woocommerce/health', () => {
  let mockSupabase: any;
  let mockGetDynamicWooCommerceClient: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    (supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Mock WooCommerce client getter
    const woocommerceDynamic = jest.requireMock('@/lib/woocommerce-dynamic');
    mockGetDynamicWooCommerceClient = woocommerceDynamic.getDynamicWooCommerceClient;
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

      mockSupabase.eq.mockResolvedValue({
        data: [mockConfig],
        error: null,
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

      mockSupabase.eq.mockResolvedValue({
        data: [mockConfig],
        error: null,
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

      mockSupabase.eq.mockResolvedValue({
        data: [mockConfig],
        error: null,
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

      mockSupabase.not.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({
        data: mockConfigs,
        error: null,
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

      mockSupabase.not.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({
        data: mockConfigs,
        error: null,
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
      mockSupabase.not.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null,
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
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null,
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
      (supabaseServer.createClient as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/woocommerce/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Database connection failed');
    });

    it('should return 500 when config query fails', async () => {
      mockSupabase.not.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Query error', code: 'PGRST116' },
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

      mockSupabase.eq.mockResolvedValue({
        data: [mockConfig],
        error: null,
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

      mockSupabase.eq.mockResolvedValue({
        data: [mockConfig],
        error: null,
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
