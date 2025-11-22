/**
 * Revenue Analytics Tests
 *
 * Comprehensive test coverage for revenue tracking and attribution analytics
 * Tests all functions in lib/analytics/revenue-analytics.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getRevenueMetrics,
  getCustomerLTVMetrics,
} from '@/lib/analytics/revenue-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Revenue Analytics', () => {
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

  describe('getRevenueMetrics', () => {
    const domain = 'example.com';
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    };

    it('calculates revenue metrics correctly', async () => {
      const mockDomain = { id: 'domain-1' };
      const mockAttributions = [
        {
          id: 'attr-1',
          conversation_id: 'conv-1',
          order_total: '100.00',
          platform: 'woocommerce',
          attribution_confidence: '0.8',
          conversations: { domain_id: 'domain-1' },
        },
        {
          id: 'attr-2',
          conversation_id: 'conv-2',
          order_total: '200.00',
          platform: 'shopify',
          attribution_confidence: '0.9',
          conversations: { domain_id: 'domain-1' },
        },
        {
          id: 'attr-3',
          conversation_id: null, // Not chat-attributed
          order_total: '50.00',
          platform: 'woocommerce',
          attribution_confidence: '0.3',
          conversations: { domain_id: 'domain-1' },
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDomain, error: null }),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: mockAttributions, error: null }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ count: 10, error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.totalRevenue).toBe(350); // 100 + 200 + 50
      expect(metrics.totalOrders).toBe(3);
      expect(metrics.averageOrderValue).toBeCloseTo(116.67, 1); // 350/3
      expect(metrics.chatAttributedRevenue).toBe(300); // 100 + 200 (only conv-1 and conv-2)
      expect(metrics.chatAttributedOrders).toBe(2);
      expect(metrics.conversionRate).toBeCloseTo(20, 0); // 2/10 * 100 = 20%
    });

    it('calculates revenue by platform correctly', async () => {
      const mockDomain = { id: 'domain-1' };
      const mockAttributions = [
        {
          conversation_id: 'conv-1',
          order_total: '150.00',
          platform: 'woocommerce',
          attribution_confidence: '0.8',
          conversations: { domain_id: 'domain-1' },
        },
        {
          conversation_id: 'conv-2',
          order_total: '250.00',
          platform: 'shopify',
          attribution_confidence: '0.9',
          conversations: { domain_id: 'domain-1' },
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDomain, error: null }),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: mockAttributions, error: null }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ count: 5, error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.revenueByPlatform.woocommerce).toBe(150);
      expect(metrics.revenueByPlatform.shopify).toBe(250);
    });

    it('calculates revenue by confidence level correctly', async () => {
      const mockDomain = { id: 'domain-1' };
      const mockAttributions = [
        {
          conversation_id: 'conv-1',
          order_total: '100.00',
          attribution_confidence: '0.9', // High (>= 0.7)
          conversations: { domain_id: 'domain-1' },
        },
        {
          conversation_id: 'conv-2',
          order_total: '200.00',
          attribution_confidence: '0.5', // Medium (0.4-0.7)
          conversations: { domain_id: 'domain-1' },
        },
        {
          conversation_id: 'conv-3',
          order_total: '50.00',
          attribution_confidence: '0.2', // Low (< 0.4)
          conversations: { domain_id: 'domain-1' },
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDomain, error: null }),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: mockAttributions, error: null }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ count: 3, error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.revenueByConfidence.high).toBe(100);
      expect(metrics.revenueByConfidence.medium).toBe(200);
      expect(metrics.revenueByConfidence.low).toBe(50);
    });

    it('returns empty metrics when domain not found', async () => {
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.totalRevenue).toBe(0);
      expect(metrics.totalOrders).toBe(0);
      expect(metrics.averageOrderValue).toBe(0);
      expect(metrics.chatAttributedRevenue).toBe(0);
      expect(metrics.chatAttributedOrders).toBe(0);
    });

    it('returns empty metrics when no attributions exist', async () => {
      const mockDomain = { id: 'domain-1' };

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDomain, error: null }),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: [], error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.totalRevenue).toBe(0);
      expect(metrics.totalOrders).toBe(0);
    });


    it('filters out attributions from other domains', async () => {
      const mockDomain = { id: 'domain-1' };
      const mockAttributions = [
        {
          conversation_id: 'conv-1',
          order_total: '100.00',
          conversations: { domain_id: 'domain-1' },
        },
        {
          conversation_id: 'conv-2',
          order_total: '200.00',
          conversations: { domain_id: 'domain-2' }, // Different domain
        },
      ];

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDomain, error: null }),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: mockAttributions, error: null }),
          };
        }
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ count: 1, error: null }),
          };
        }
        return {};
      }) as any;

      const metrics = await getRevenueMetrics(domain, timeRange);

      expect(metrics.totalRevenue).toBe(100); // Only domain-1 revenue
      expect(metrics.totalOrders).toBe(1);
    });
  });

  // See revenue-analytics-ltv.test.ts for getCustomerLTVMetrics tests
});
