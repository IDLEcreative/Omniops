/**
 * Revenue Analytics - Customer LTV Metrics Tests
 *
 * Tests for getCustomerLTVMetrics function
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCustomerLTVMetrics } from '@/lib/analytics/revenue-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Revenue Analytics - Customer LTV Metrics', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    // Mock createServiceRoleClient to return our mock
    const { createServiceRoleClient } = require('@/lib/supabase-server');
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('getCustomerLTVMetrics', () => {
    const domain = 'example.com';

    it('calculates customer LTV metrics correctly', async () => {
      const mockSessions = [
        {
          customer_email: 'customer1@test.com',
          total_purchases: 3,
          lifetime_value: '450.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-15T00:00:00Z',
        },
        {
          customer_email: 'customer2@test.com',
          total_purchases: 1,
          lifetime_value: '100.00',
          first_seen_at: '2024-01-10T00:00:00Z',
          last_seen_at: '2024-01-10T00:00:00Z',
        },
        {
          customer_email: 'customer3@test.com',
          total_purchases: 5,
          lifetime_value: '800.00',
          first_seen_at: '2023-12-01T00:00:00Z',
          last_seen_at: '2024-01-20T00:00:00Z',
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.totalCustomers).toBe(3);
      expect(metrics.returningCustomers).toBe(2); // customer1 and customer3 have >1 purchase
      expect(metrics.returningCustomerRate).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(metrics.averageLTV).toBeCloseTo(450, 0); // (450 + 100 + 800) / 3
      expect(metrics.topCustomers).toHaveLength(3);
    });

    it('identifies returning customers correctly', async () => {
      const mockSessions = [
        {
          customer_email: 'returning@test.com',
          total_purchases: 5,
          lifetime_value: '1000.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-30T00:00:00Z',
        },
        {
          customer_email: 'onetime@test.com',
          total_purchases: 1,
          lifetime_value: '50.00',
          first_seen_at: '2024-01-15T00:00:00Z',
          last_seen_at: '2024-01-15T00:00:00Z',
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.returningCustomers).toBe(1);
      expect(metrics.topCustomers[0].isReturning).toBe(true);
      expect(metrics.topCustomers[1].isReturning).toBe(false);
    });

    it('sorts top customers by lifetime value', async () => {
      const mockSessions = [
        {
          customer_email: 'low@test.com',
          total_purchases: 1,
          lifetime_value: '50.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-01T00:00:00Z',
        },
        {
          customer_email: 'high@test.com',
          total_purchases: 10,
          lifetime_value: '5000.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-30T00:00:00Z',
        },
        {
          customer_email: 'medium@test.com',
          total_purchases: 5,
          lifetime_value: '500.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-20T00:00:00Z',
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.topCustomers[0].email).toBe('high@test.com');
      expect(metrics.topCustomers[1].email).toBe('medium@test.com');
      expect(metrics.topCustomers[2].email).toBe('low@test.com');
    });

    it('limits top customers to 10', async () => {
      const mockSessions = Array.from({ length: 20 }, (_, i) => ({
        customer_email: `customer${i}@test.com`,
        total_purchases: i + 1,
        lifetime_value: ((i + 1) * 100).toString(),
        first_seen_at: '2024-01-01T00:00:00Z',
        last_seen_at: '2024-01-30T00:00:00Z',
      }));

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.topCustomers).toHaveLength(10);
    });

    it('calculates median LTV correctly', async () => {
      const mockSessions = [
        { customer_email: '1@test.com', total_purchases: 1, lifetime_value: '100.00', first_seen_at: '2024-01-01', last_seen_at: '2024-01-01' },
        { customer_email: '2@test.com', total_purchases: 1, lifetime_value: '200.00', first_seen_at: '2024-01-01', last_seen_at: '2024-01-01' },
        { customer_email: '3@test.com', total_purchases: 1, lifetime_value: '300.00', first_seen_at: '2024-01-01', last_seen_at: '2024-01-01' },
        { customer_email: '4@test.com', total_purchases: 1, lifetime_value: '400.00', first_seen_at: '2024-01-01', last_seen_at: '2024-01-01' },
        { customer_email: '5@test.com', total_purchases: 1, lifetime_value: '500.00', first_seen_at: '2024-01-01', last_seen_at: '2024-01-01' },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.medianLTV).toBe(300); // Middle value
    });

    it('returns empty metrics when no sessions exist', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.totalCustomers).toBe(0);
      expect(metrics.returningCustomers).toBe(0);
      expect(metrics.returningCustomerRate).toBe(0);
      expect(metrics.averageLTV).toBe(0);
      expect(metrics.medianLTV).toBe(0);
      expect(metrics.topCustomers).toEqual([]);
    });

    it('aggregates multiple sessions for same customer', async () => {
      const mockSessions = [
        {
          customer_email: 'repeat@test.com',
          total_purchases: 2,
          lifetime_value: '200.00',
          first_seen_at: '2024-01-01T00:00:00Z',
          last_seen_at: '2024-01-10T00:00:00Z',
        },
        {
          customer_email: 'repeat@test.com',
          total_purchases: 3,
          lifetime_value: '300.00',
          first_seen_at: '2023-12-15T00:00:00Z', // Earlier first purchase
          last_seen_at: '2024-01-20T00:00:00Z', // Later last purchase
        },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockSessions, error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.totalCustomers).toBe(1); // Aggregated to one customer
      expect(metrics.topCustomers[0].totalPurchases).toBe(5); // 2 + 3
      expect(metrics.topCustomers[0].lifetimeValue).toBe(500); // 200 + 300
    });

    it('handles edge case: division by zero for returning customer rate', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }) as any;

      const metrics = await getCustomerLTVMetrics(domain);

      expect(metrics.returningCustomerRate).toBe(0); // Should not throw error
    });
  });
});
