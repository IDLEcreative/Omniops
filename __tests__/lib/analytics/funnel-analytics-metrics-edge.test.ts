/**
 * Funnel Analytics - Metrics & Trends Tests - Edge Cases
 *
 * Tests for edge cases, error handling, and boundary conditions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getFunnelMetrics,
  getFunnelTrends,
} from '@/lib/analytics/funnel-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Funnel Analytics - Metrics & Trends - Edge Cases', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    // Mock createServiceRoleClient to return our mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createServiceRoleClient } = require('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('getFunnelMetrics - Edge Cases', () => {
    const domain = 'example.com';
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    };

    it('returns empty metrics when no funnels exist', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      expect(metrics.overview.totalChats).toBe(0);
      expect(metrics.overview.totalCarts).toBe(0);
      expect(metrics.overview.totalPurchases).toBe(0);
      expect(metrics.conversionRates.chatToCart).toBe(0);
      expect(metrics.conversionRates.cartToPurchase).toBe(0);
      expect(metrics.conversionRates.overallConversion).toBe(0);
    });

    it('handles edge case: division by zero for conversion rates', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      // Should not throw division by zero errors
      expect(metrics.conversionRates.chatToCart).toBe(0);
      expect(metrics.conversionRates.cartToPurchase).toBe(0);
      expect(metrics.conversionRates.overallConversion).toBe(0);
      expect(metrics.revenueMetrics.avgPurchaseValue).toBe(0);
    });

    it('handles single funnel entry', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          cart_created_at: '2024-01-01',
          purchased_at: '2024-01-01',
          purchase_value: 100,
          cart_value: 100,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockFunnels, error: null }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      expect(metrics.overview.totalChats).toBe(1);
      expect(metrics.conversionRates.overallConversion).toBe(100);
    });

    it('handles null values in funnel data', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          cart_created_at: null,
          purchased_at: null,
          purchase_value: null,
          cart_value: null,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockFunnels, error: null }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      expect(metrics.overview.totalChats).toBe(1);
      expect(metrics.overview.totalCarts).toBe(0);
      expect(metrics.overview.totalPurchases).toBe(0);
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      // Should return empty metrics structure
      expect(metrics.overview.totalChats).toBe(0);
    });

    it('handles very large cart values', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          cart_created_at: '2024-01-01',
          purchased_at: '2024-01-01',
          purchase_value: 999999999.99,
          cart_value: 999999999.99,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockFunnels, error: null }),
      }) as any;

      const metrics = await getFunnelMetrics(domain, timeRange);

      expect(metrics.revenueMetrics.totalRevenue).toBeCloseTo(999999999.99, 2);
    });
  });

  describe('getFunnelTrends - Edge Cases', () => {
    const domain = 'example.com';

    it('returns empty array when no data exists', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: null }),
      }) as any;

      const trends = await getFunnelTrends(domain, 7);

      expect(trends).toEqual([]);
    });

    it('handles missing optional fields with default values', async () => {
      const mockTrends = [
        {
          date: '2024-01-01',
          // All optional fields missing
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockTrends, error: null }),
      }) as any;

      const trends = await getFunnelTrends(domain, 7);

      expect(trends[0].totalChats).toBe(0);
      expect(trends[0].totalCarts).toBe(0);
      expect(trends[0].totalPurchases).toBe(0);
      expect(trends[0].revenue).toBe(0);
    });

    it('handles very long time ranges (365+ days)', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      const trends = await getFunnelTrends(domain, 365);

      expect(trends).toEqual([]);
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
      }) as any;

      const trends = await getFunnelTrends(domain, 7);

      expect(trends).toEqual([]);
    });

    it('handles single day trend data', async () => {
      const mockTrends = [
        {
          date: '2024-01-01',
          total_chats: 5,
          total_carts: 3,
          total_purchases: 2,
          chat_to_cart_rate: 60,
          cart_to_purchase_rate: 66.67,
          overall_conversion_rate: 40,
          total_revenue: 200,
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockTrends, error: null }),
      }) as any;

      const trends = await getFunnelTrends(domain, 1);

      expect(trends).toHaveLength(1);
      expect(trends[0].date).toBe('2024-01-01');
    });
  });
});
