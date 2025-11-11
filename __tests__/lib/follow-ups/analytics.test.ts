/**
 * Follow-up analytics summary + response tracking tests
 *
 * Focuses on:
 * - High-level summary aggregation
 * - Pending/period counts
 * - Response tracking metadata
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFollowUpSummary, trackFollowUpResponse } from '@/lib/follow-ups/analytics';
import { createPendingCountQuery, createPeriodCountQuery } from './analytics-test-helpers';

describe('Follow-up Analytics Summary & Tracking', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('getFollowUpSummary', () => {
    it('aggregates summary metrics with effectiveness insights', async () => {
      mockSupabase.from
        .mockImplementationOnce(() => createPeriodCountQuery(5))
        .mockImplementationOnce(() => createPeriodCountQuery(25))
        .mockImplementationOnce(() => createPeriodCountQuery(100))
        .mockImplementationOnce(() => createPendingCountQuery(10));

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { reason: 'cart_abandonment', response_rate: 75 },
          { reason: 'abandoned_conversation', response_rate: 45 },
          { reason: 'low_satisfaction', response_rate: 25 },
        ],
        error: null,
      });

      const summary = await getFollowUpSummary(mockSupabase);

      expect(summary.total_sent_today).toBe(5);
      expect(summary.total_sent_this_week).toBe(25);
      expect(summary.total_sent_this_month).toBe(100);
      expect(summary.pending_count).toBe(10);
      expect(Math.round(summary.avg_response_rate * 100) / 100).toBe(48.33);
      expect(summary.most_effective_reason).toBe('cart_abandonment');
      expect(summary.least_effective_reason).toBe('low_satisfaction');
    });

    it('handles missing effectiveness data', async () => {
      mockSupabase.from
        .mockImplementationOnce(() => createPeriodCountQuery(0))
        .mockImplementationOnce(() => createPeriodCountQuery(0))
        .mockImplementationOnce(() => createPeriodCountQuery(0))
        .mockImplementationOnce(() => createPendingCountQuery(0));

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const summary = await getFollowUpSummary(mockSupabase);

      expect(summary.total_sent_today).toBe(0);
      expect(summary.avg_response_rate).toBe(0);
      expect(summary.most_effective_reason).toBe('N/A');
      expect(summary.least_effective_reason).toBe('N/A');
    });

    it('handles partial counts gracefully', async () => {
      mockSupabase.from
        .mockImplementationOnce(() => createPeriodCountQuery(null))
        .mockImplementationOnce(() => createPeriodCountQuery(null))
        .mockImplementationOnce(() => createPeriodCountQuery(null))
        .mockImplementationOnce(() => createPendingCountQuery(null));

      mockSupabase.rpc.mockResolvedValue({
        data: [{ reason: 'cart_abandonment', response_rate: 50 }],
        error: null,
      });

      const summary = await getFollowUpSummary(mockSupabase);

      expect(summary.total_sent_today).toBe(0);
      expect(summary.total_sent_this_week).toBe(0);
      expect(summary.avg_response_rate).toBe(50);
      expect(summary.most_effective_reason).toBe('cart_abandonment');
      expect(summary.least_effective_reason).toBe('cart_abandonment');
    });
  });

  describe('trackFollowUpResponse', () => {
    it('updates follow-up message with response metadata', async () => {
      const conversationId = 'conv-1';
      const messageTimestamp = '2024-01-01T12:00:00Z';
      const sentAt = '2024-01-01T10:00:00Z';

      let updateData: any;

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'follow-up-1', sent_at: sentAt },
          error: null,
        }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      } as any));

      await trackFollowUpResponse(mockSupabase, conversationId, messageTimestamp);

      expect(updateData.metadata).toEqual({
        responded: true,
        response_at: messageTimestamp,
        response_time_hours: '2.00',
      });
    });

    it('calculates fractional response times', async () => {
      const sentAt = '2024-01-01T10:00:00Z';
      const responseAt = '2024-01-01T15:30:00Z';

      let updateData: any;

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'follow-up-1', sent_at: sentAt },
          error: null,
        }),
        update: jest.fn((data) => {
          updateData = data;
          return {
            eq: jest.fn().mockResolvedValue({ error: null }),
          };
        }),
      } as any));

      await trackFollowUpResponse(mockSupabase, 'conv-1', responseAt);

      expect(updateData.metadata.response_time_hours).toBe('5.50');
    });

    it('does nothing when no follow-up is found', async () => {
      const updateMock = jest.fn();

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        update: updateMock,
      } as any));

      await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T12:00:00Z');

      expect(updateMock).not.toHaveBeenCalled();
    });

    it('queries for the most recent sent follow-up', async () => {
      const queryCalls: string[] = [];

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => {
          queryCalls.push('select');
          return {
            eq: jest.fn(() => {
              queryCalls.push('eq');
              return {
                eq: jest.fn(() => {
                  queryCalls.push('eq');
                  return {
                    lt: jest.fn(() => {
                      queryCalls.push('lt');
                      return {
                        order: jest.fn(() => {
                          queryCalls.push('order');
                          return {
                            limit: jest.fn(() => {
                              queryCalls.push('limit');
                              return {
                                single: jest.fn().mockResolvedValue({ data: null }),
                              };
                            }),
                          };
                        }),
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
        update: jest.fn(),
      } as any));

      await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T12:00:00Z');

      expect(queryCalls).toEqual(['select', 'eq', 'eq', 'lt', 'order', 'limit']);
    });
  });
});
