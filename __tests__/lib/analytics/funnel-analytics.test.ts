/**
 * Funnel Analytics Tests
 *
 * Comprehensive test coverage for customer journey funnel tracking
 * Tests all functions in lib/analytics/funnel-analytics.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  recordChatStage,
  recordCartStage,
  recordPurchaseStage,
  getFunnelMetrics,
  getFunnelTrends,
} from '@/lib/analytics/funnel-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Funnel Analytics', () => {
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

  describe('recordChatStage', () => {
    it('creates a new funnel entry when chat starts', async () => {
      const insertMock = jest.fn().mockResolvedValue({
        data: { id: 'funnel-1' },
        error: null,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: insertMock,
          }),
        }),
      }) as any;

      const result = await recordChatStage('conv-1', 'user@test.com', 'example.com');

      expect(result.success).toBe(true);
      expect(result.funnelId).toBe('funnel-1');
    });

    it('normalizes email to lowercase', async () => {
      let insertedData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'funnel-1' }, error: null }),
            }),
          };
        }),
      }) as any;

      await recordChatStage('conv-1', 'USER@TEST.COM', 'example.com');

      expect(insertedData.customer_email).toBe('user@test.com');
    });

    it('sets current_stage to "chat"', async () => {
      let insertedData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'funnel-1' }, error: null }),
            }),
          };
        }),
      }) as any;

      await recordChatStage('conv-1', 'user@test.com', 'example.com');

      expect(insertedData.current_stage).toBe('chat');
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      }) as any;

      const result = await recordChatStage('conv-1', 'user@test.com', 'example.com');

      expect(result.success).toBe(false);
      expect(result.funnelId).toBeUndefined();
    });
  });

  describe('recordCartStage', () => {
    it('updates existing funnel entry with cart details', async () => {
      const existingFunnel = {
        id: 'funnel-1',
        chat_started_at: '2024-01-01T10:00:00Z',
      };

      let updateData: any;
      const updateMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'conversation_funnel') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: existingFunnel, error: null }),
            update: jest.fn((data) => {
              updateData = data;
              return {
                eq: updateMock,
              };
            }),
          };
        }
        return {};
      }) as any;

      const result = await recordCartStage(
        'conv-1',
        'user@test.com',
        'cart-123',
        250.50,
        3,
        'high'
      );

      expect(result.success).toBe(true);
      expect(updateData.cart_order_id).toBe('cart-123');
      expect(updateData.cart_value).toBe(250.50);
      expect(updateData.cart_item_count).toBe(3);
      expect(updateData.cart_priority).toBe('high');
      expect(updateData.current_stage).toBe('cart_abandoned');
    });

    it('calculates time_to_cart correctly', async () => {
      const existingFunnel = {
        id: 'funnel-1',
        chat_started_at: '2024-01-01T10:00:00Z',
      };

      let updateData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingFunnel, error: null }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      }) as any;

      // Mock current time to be 5 minutes after chat start
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:05:00Z').getTime());

      await recordCartStage('conv-1', 'user@test.com', 'cart-123', 100, 1, 'medium');

      expect(updateData.time_to_cart).toBe(300); // 5 minutes in seconds
    });

    it('creates new funnel entry if chat stage not found', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }), // No existing funnel
        insert: insertMock,
      }) as any;

      const result = await recordCartStage(
        'conv-1',
        'user@test.com',
        'cart-123',
        100,
        1,
        'low'
      );

      expect(result.success).toBe(true);
      expect(insertMock).toHaveBeenCalled();
    });

    it('handles all priority levels', async () => {
      const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

      for (const priority of priorities) {
        let updateData: any;

        mockSupabase.from = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'funnel-1', chat_started_at: '2024-01-01T10:00:00Z' },
            error: null,
          }),
          update: jest.fn((data) => {
            updateData = data;
            return {
              eq: jest.fn().mockResolvedValue({ error: null }),
            };
          }),
        }) as any;

        await recordCartStage('conv-1', 'user@test.com', 'cart-123', 100, 1, priority);

        expect(updateData.cart_priority).toBe(priority);
      }
    });
  });

  describe('recordPurchaseStage', () => {
    it('updates funnel with purchase details', async () => {
      const existingFunnel = {
        id: 'funnel-1',
        chat_started_at: '2024-01-01T10:00:00Z',
        cart_created_at: '2024-01-01T10:05:00Z',
      };

      let updateData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingFunnel, error: null }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      }) as any;

      const result = await recordPurchaseStage(
        'conv-1',
        'user@test.com',
        'order-123',
        500.00,
        0.95,
        'session_match'
      );

      expect(result.success).toBe(true);
      expect(updateData.purchase_order_id).toBe('order-123');
      expect(updateData.purchase_value).toBe(500.00);
      expect(updateData.attribution_confidence).toBe(0.95);
      expect(updateData.attribution_method).toBe('session_match');
      expect(updateData.current_stage).toBe('purchased');
      expect(updateData.drop_off_point).toBeNull();
    });

    it('calculates time_to_purchase correctly', async () => {
      const existingFunnel = {
        id: 'funnel-1',
        chat_started_at: '2024-01-01T10:00:00Z',
        cart_created_at: null,
      };

      let updateData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingFunnel, error: null }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      }) as any;

      // Mock current time to be 30 minutes after chat start
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:30:00Z').getTime());

      await recordPurchaseStage('conv-1', 'user@test.com', 'order-123', 100, 0.8, 'session_match');

      expect(updateData.time_to_purchase).toBe(1800); // 30 minutes in seconds
    });

    it('calculates cart_to_purchase_time when cart stage exists', async () => {
      const existingFunnel = {
        id: 'funnel-1',
        chat_started_at: '2024-01-01T10:00:00Z',
        cart_created_at: '2024-01-01T10:10:00Z',
      };

      let updateData: any;

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingFunnel, error: null }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      }) as any;

      // Mock current time to be 20 minutes after cart creation
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T10:30:00Z').getTime());

      await recordPurchaseStage('conv-1', 'user@test.com', 'order-123', 100, 0.9, 'session_match');

      expect(updateData.cart_to_purchase_time).toBe(1200); // 20 minutes in seconds
    });

    it('returns failure when funnel entry not found', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }) as any;

      const result = await recordPurchaseStage(
        'conv-1',
        'user@test.com',
        'order-123',
        100,
        0.8,
        'session_match'
      );

      expect(result.success).toBe(false);
    });
  });

  // See funnel-analytics-metrics.test.ts for getFunnelMetrics and getFunnelTrends tests
});
