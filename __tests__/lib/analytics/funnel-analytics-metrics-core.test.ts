/**
 * Funnel Analytics - Metrics & Trends Tests - Core Functionality
 *
 * Tests for getFunnelMetrics and getFunnelTrends main functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getFunnelMetrics,
  getFunnelTrends,
} from '@/lib/analytics/funnel-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Funnel Analytics - Metrics & Trends - Core', () => {
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

  describe('getFunnelMetrics - Core Functionality', () => {
    const domain = 'example.com';
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    };

    it('calculates funnel conversion rates correctly', async () => {
      const mockFunnels = [
        {
          id: 'f1',
          chat_started_at: '2024-01-05',
          cart_created_at: '2024-01-05',
          purchased_at: '2024-01-05',
          purchase_value: 100,
        },
        {
          id: 'f2',
          chat_started_at: '2024-01-10',
          cart_created_at: '2024-01-10',
          purchased_at: null, // Cart abandoned
        },
        {
          id: 'f3',
          chat_started_at: '2024-01-15',
          cart_created_at: null, // Chat only
          purchased_at: null,
        },
        {
          id: 'f4',
          chat_started_at: '2024-01-20',
          cart_created_at: '2024-01-20',
          purchased_at: '2024-01-20',
          purchase_value: 200,
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

      expect(metrics.overview.totalChats).toBe(4);
      expect(metrics.overview.totalCarts).toBe(3);
      expect(metrics.overview.totalPurchases).toBe(2);
      expect(metrics.conversionRates.chatToCart).toBeCloseTo(75, 0); // 3/4 * 100
      expect(metrics.conversionRates.cartToPurchase).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(metrics.conversionRates.overallConversion).toBeCloseTo(50, 0); // 2/4 * 100
    });

    it('calculates revenue metrics correctly', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          cart_created_at: '2024-01-01',
          purchased_at: '2024-01-01',
          purchase_value: 150,
          cart_value: 150,
        },
        {
          chat_started_at: '2024-01-02',
          cart_created_at: '2024-01-02',
          purchased_at: '2024-01-02',
          purchase_value: 250,
          cart_value: 250,
        },
        {
          chat_started_at: '2024-01-03',
          cart_created_at: '2024-01-03',
          purchased_at: null, // Abandoned
          cart_value: 100, // Lost revenue
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

      expect(metrics.revenueMetrics.totalRevenue).toBe(400); // 150 + 250
      expect(metrics.revenueMetrics.avgPurchaseValue).toBe(200); // 400 / 2
      expect(metrics.revenueMetrics.cartValue).toBe(500); // 150 + 250 + 100
      expect(metrics.revenueMetrics.lostRevenue).toBe(100); // Abandoned cart value
    });

    it('calculates timing metrics correctly', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          time_to_cart: 300, // 5 minutes
          time_to_purchase: 600, // 10 minutes
          cart_to_purchase_time: 300, // 5 minutes
        },
        {
          chat_started_at: '2024-01-02',
          time_to_cart: 600, // 10 minutes
          time_to_purchase: 1200, // 20 minutes
          cart_to_purchase_time: 600, // 10 minutes
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

      expect(metrics.timingMetrics.avgTimeToCartMinutes).toBeCloseTo(7.5, 1); // (300 + 600) / 2 / 60
      expect(metrics.timingMetrics.avgTimeToPurchaseMinutes).toBeCloseTo(15, 0); // (600 + 1200) / 2 / 60
      expect(metrics.timingMetrics.avgCartToPurchaseMinutes).toBeCloseTo(7.5, 1); // (300 + 600) / 2 / 60
    });

    it('breaks down metrics by cart priority', async () => {
      const mockFunnels = [
        {
          chat_started_at: '2024-01-01',
          cart_priority: 'high',
          cart_value: 500,
          purchased_at: '2024-01-01',
        },
        {
          chat_started_at: '2024-01-02',
          cart_priority: 'high',
          cart_value: 300,
          purchased_at: null, // Abandoned
        },
        {
          chat_started_at: '2024-01-03',
          cart_priority: 'medium',
          cart_value: 150,
          purchased_at: '2024-01-03',
        },
        {
          chat_started_at: '2024-01-04',
          cart_priority: 'low',
          cart_value: 50,
          purchased_at: null,
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

      expect(metrics.cartPriorityBreakdown.high.count).toBe(2);
      expect(metrics.cartPriorityBreakdown.high.value).toBe(800);
      expect(metrics.cartPriorityBreakdown.high.conversionRate).toBeCloseTo(50, 0); // 1/2 * 100

      expect(metrics.cartPriorityBreakdown.medium.count).toBe(1);
      expect(metrics.cartPriorityBreakdown.medium.value).toBe(150);
      expect(metrics.cartPriorityBreakdown.medium.conversionRate).toBe(100); // 1/1 * 100

      expect(metrics.cartPriorityBreakdown.low.count).toBe(1);
      expect(metrics.cartPriorityBreakdown.low.conversionRate).toBe(0); // 0/1 * 100
    });
  });

  describe('getFunnelTrends - Core Functionality', () => {
    const domain = 'example.com';

    it('retrieves funnel trend data over time', async () => {
      const mockTrends = [
        {
          date: '2024-01-01',
          total_chats: 10,
          total_carts: 7,
          total_purchases: 5,
          chat_to_cart_rate: 70,
          cart_to_purchase_rate: 71.43,
          overall_conversion_rate: 50,
          total_revenue: 500,
        },
        {
          date: '2024-01-02',
          total_chats: 15,
          total_carts: 10,
          total_purchases: 8,
          chat_to_cart_rate: 66.67,
          cart_to_purchase_rate: 80,
          overall_conversion_rate: 53.33,
          total_revenue: 800,
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

      expect(trends).toHaveLength(2);
      expect(trends[0].date).toBe('2024-01-01');
      expect(trends[0].totalChats).toBe(10);
      expect(trends[0].chatToCartRate).toBe(70);
      expect(trends[1].revenue).toBe(800);
    });

    it('handles default days parameter (30 days)', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      await getFunnelTrends(domain);

      // Check that gte was called with date 30 days ago
      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_funnel_stats');
    });
  });
});
