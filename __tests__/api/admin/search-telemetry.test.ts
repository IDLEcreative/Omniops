/**
 * Search Telemetry API Tests
 * Tests telemetry collection, storage, and retrieval
 */

import { GET } from '@/app/api/admin/search-telemetry/route';
import {
  trackProviderResolution,
  trackDomainLookup,
  trackRetryPattern,
  getTelemetryStats,
} from '@/lib/telemetry/search-telemetry';
import { NextRequest } from 'next/server';

// Mock Supabase client
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

describe('Search Telemetry API', () => {
  let mockSupabase: any;
  let createServiceRoleClientMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock function
    const supabaseModule = require('@/lib/supabase-server');
    createServiceRoleClientMock = supabaseModule.createServiceRoleClient;

    // Mock Supabase client with chaining
    mockSupabase = {
      from: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      gte: jest.fn(),
    };

    // Set up default chaining behavior
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: jest.fn().mockResolvedValue({ data: [] }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    createServiceRoleClientMock.mockResolvedValue(mockSupabase);
  });

  describe('GET /api/admin/search-telemetry', () => {
    it('should return all metrics by default', async () => {
      // Mock telemetry data
      mockSupabase.from.mockImplementation((table: string) => {
        const mockData = {
          provider_resolution_telemetry: [
            { platform: 'woocommerce', success: true, duration_ms: 100 },
            { platform: 'woocommerce', success: true, duration_ms: 120 },
            { platform: 'shopify', success: false, duration_ms: 50 },
          ],
          retry_telemetry: [
            { retry_count: 1, final_success: true, total_duration_ms: 200 },
            { retry_count: 2, final_success: true, total_duration_ms: 350 },
          ],
          domain_lookup_telemetry: [
            { method: 'cache-hit', success: true, duration_ms: 5 },
            { method: 'cache-alternative', success: true, duration_ms: 15 },
          ],
          circuit_breaker_telemetry: [
            { new_state: 'open', failure_count: 3 },
          ],
        };

        return {
          select: jest.fn().mockReturnThis(),
          gte: jest.fn().mockResolvedValue({ data: mockData[table] || [] }),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/admin/search-telemetry');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metric).toBe('all');
      expect(data.data).toHaveProperty('providerHealth');
      expect(data.data).toHaveProperty('retryPatterns');
      expect(data.data).toHaveProperty('domainLookup');
      expect(data.data).toHaveProperty('circuitBreaker');
    });

    it('should return specific metric when requested', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [
            { platform: 'woocommerce', success: true, duration_ms: 100 },
          ],
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/search-telemetry?metric=provider-health'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metric).toBe('provider-health');
      expect(data.data).toBeDefined();
    });

    it('should validate hours parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/search-telemetry?hours=1000'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid hours parameter');
    });

    it('should handle errors gracefully', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server');
      createServiceRoleClient.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/search-telemetry');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('trackProviderResolution', () => {
    it('should track successful provider resolution', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackProviderResolution({
        domain: 'example.com',
        attempt: 1,
        success: true,
        duration_ms: 150,
        platform: 'woocommerce',
        error_message: null,
        cache_hit: false,
        timestamp: new Date(),
      });

      // Wait for async tracking to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('provider_resolution_telemetry');
    });

    it('should track failed provider resolution', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackProviderResolution({
        domain: 'example.com',
        attempt: 2,
        success: false,
        duration_ms: 50,
        platform: null,
        error_message: 'Connection timeout',
        cache_hit: false,
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('provider_resolution_telemetry');
    });

    it('should handle tracking errors gracefully', async () => {
      const { createServiceRoleClient } = require('@/lib/supabase-server');
      createServiceRoleClient.mockResolvedValue(null);

      // Should not throw
      await expect(
        trackProviderResolution({
          domain: 'example.com',
          attempt: 1,
          success: true,
          duration_ms: 100,
          platform: 'woocommerce',
          error_message: null,
          cache_hit: false,
          timestamp: new Date(),
        })
      ).resolves.not.toThrow();
    });
  });

  describe('trackDomainLookup', () => {
    it('should track cache hit', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackDomainLookup({
        domain: 'example.com',
        method: 'cache-hit',
        success: true,
        duration_ms: 5,
        attempts_before_success: 1,
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('domain_lookup_telemetry');
    });

    it('should track fallback to direct database', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackDomainLookup({
        domain: 'example.com',
        method: 'direct-db-fuzzy',
        success: true,
        duration_ms: 45,
        attempts_before_success: 3,
        alternative_domains_tried: ['www.example.com', 'example.com'],
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('domain_lookup_telemetry');
    });
  });

  describe('trackRetryPattern', () => {
    it('should track successful retry pattern', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackRetryPattern({
        domain: 'example.com',
        retry_count: 2,
        final_success: true,
        total_duration_ms: 300,
        platform: 'woocommerce',
        error_message: null,
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('retry_telemetry');
    });

    it('should track failed retry pattern', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await trackRetryPattern({
        domain: 'example.com',
        retry_count: 3,
        final_success: false,
        total_duration_ms: 500,
        platform: null,
        error_message: 'All retries exhausted',
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSupabase.from).toHaveBeenCalledWith('retry_telemetry');
    });
  });

  describe('getTelemetryStats', () => {
    it('should aggregate provider health stats', async () => {
      const mockData: Record<string, any[]> = {
        provider_resolution_telemetry: [
          { platform: 'woocommerce', success: true, duration_ms: 100 },
          { platform: 'woocommerce', success: true, duration_ms: 120 },
          { platform: 'woocommerce', success: false, duration_ms: 50 },
        ],
        retry_telemetry: [],
        domain_lookup_telemetry: [],
        circuit_breaker_telemetry: [],
      };

      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ data: mockData[table] || [] }),
        }),
      }));

      const stats = await getTelemetryStats(24);

      expect(stats).not.toBeNull();
      expect(stats?.providerHealth).toHaveLength(1);
      expect(stats?.providerHealth[0].platform).toBe('woocommerce');
      expect(stats?.providerHealth[0].totalAttempts).toBe(3);
      expect(stats?.providerHealth[0].successRate).toBeCloseTo(0.667, 2);
    });

    it('should calculate retry pattern percentiles', async () => {
      const mockData: Record<string, any[]> = {
        provider_resolution_telemetry: [],
        retry_telemetry: [
          { retry_count: 0, final_success: true, total_duration_ms: 100 },
          { retry_count: 1, final_success: true, total_duration_ms: 200 },
          { retry_count: 2, final_success: true, total_duration_ms: 300 },
          { retry_count: 1, final_success: false, total_duration_ms: 400 },
        ],
        domain_lookup_telemetry: [],
        circuit_breaker_telemetry: [],
      };

      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockResolvedValue({ data: mockData[table] || [] }),
        }),
      }));

      const stats = await getTelemetryStats(24);

      expect(stats).not.toBeNull();
      expect(stats?.retryPatterns.avgRetries).toBeCloseTo(1.0, 1);
      expect(stats?.retryPatterns.successRate).toBe(0.75);
      expect(stats?.retryPatterns.p50Duration).toBeGreaterThan(0);
    });

    it('should return null on error', async () => {
      createServiceRoleClientMock.mockResolvedValue(null);

      const stats = await getTelemetryStats(24);

      expect(stats).toBeNull();
    });
  });
});
