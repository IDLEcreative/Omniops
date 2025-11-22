/**
 * Funnel Analytics Tests - Edge Cases
 *
 * Tests for error handling, edge cases, and validation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  recordChatStage,
  recordCartStage,
  recordPurchaseStage,
} from '@/lib/analytics/funnel-analytics';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('Funnel Analytics - Edge Cases', () => {
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

  describe('recordChatStage - Edge Cases', () => {
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

    it('handles empty email addresses', async () => {
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

      await recordChatStage('conv-1', '', 'example.com');

      expect(insertedData.customer_email).toBe('');
    });

    it('handles very long conversation IDs', async () => {
      const longConvId = 'conv-' + 'x'.repeat(200);
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

      await recordChatStage(longConvId, 'user@test.com', 'example.com');

      expect(insertedData.conversation_id).toBe(longConvId);
    });
  });

  describe('recordCartStage - Edge Cases', () => {
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

    it('handles zero cart value', async () => {
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

      await recordCartStage('conv-1', 'user@test.com', 'cart-123', 0, 0, 'low');

      expect(updateData.cart_value).toBe(0);
      expect(updateData.cart_item_count).toBe(0);
    });

    it('handles negative cart values', async () => {
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

      await recordCartStage('conv-1', 'user@test.com', 'cart-123', -50, 1, 'medium');

      expect(updateData.cart_value).toBe(-50);
    });

    it('handles database errors on cart update', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'funnel-1', chat_started_at: '2024-01-01T10:00:00Z' },
          error: null,
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        }),
      }) as any;

      const result = await recordCartStage('conv-1', 'user@test.com', 'cart-123', 100, 1, 'high');

      expect(result.success).toBe(false);
    });
  });

  describe('recordPurchaseStage - Edge Cases', () => {
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

    it('handles very low attribution confidence', async () => {
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

      await recordPurchaseStage('conv-1', 'user@test.com', 'order-123', 100, 0.01, 'email_match');

      expect(updateData.attribution_confidence).toBe(0.01);
      expect(updateData.attribution_method).toBe('email_match');
    });

    it('handles zero purchase value', async () => {
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

      await recordPurchaseStage('conv-1', 'user@test.com', 'order-123', 0, 0.9, 'session_match');

      expect(updateData.purchase_value).toBe(0);
    });

    it('handles database errors on purchase update', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'funnel-1', chat_started_at: '2024-01-01T10:00:00Z' },
          error: null,
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
        }),
      }) as any;

      const result = await recordPurchaseStage(
        'conv-1',
        'user@test.com',
        'order-123',
        100,
        0.9,
        'session_match'
      );

      expect(result.success).toBe(false);
    });
  });
});
