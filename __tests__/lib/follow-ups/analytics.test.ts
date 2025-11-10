/**
 * Tests for Follow-up Analytics
 *
 * Validates analytics and effectiveness tracking:
 * - Overall metrics calculation
 * - Metrics by reason and channel
 * - Trend data generation
 * - Response tracking
 * - Summary statistics
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getFollowUpAnalytics,
  getFollowUpSummary,
  trackFollowUpResponse,
  type FollowUpAnalytics,
  type FollowUpSummary,
} from '@/lib/follow-ups/analytics';

describe('Follow-up Analytics', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    // Create fresh Supabase mock
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('getFollowUpAnalytics', () => {
    it('should fetch and calculate overall analytics', async () => {
      const mockEffectivenessData = [
        {
          reason: 'abandoned_conversation',
          total_sent: 50,
          response_rate: 45,
          avg_response_time_hours: 12,
        },
        {
          reason: 'cart_abandonment',
          total_sent: 30,
          response_rate: 60,
          avg_response_time_hours: 6,
        },
        {
          reason: 'low_satisfaction',
          total_sent: 20,
          response_rate: 30,
          avg_response_time_hours: 24,
        },
      ];

      const mockChannelData = [
        { channel: 'email', status: 'sent', sent_at: '2024-01-01T10:00:00Z' },
        { channel: 'email', status: 'sent', sent_at: '2024-01-01T11:00:00Z' },
        { channel: 'in_app', status: 'sent', sent_at: '2024-01-01T12:00:00Z' },
      ];

      const mockTrendData = [
        { sent_at: '2024-01-01T10:00:00Z', conversation_id: 'conv-1' },
        { sent_at: '2024-01-01T10:30:00Z', conversation_id: 'conv-2' },
        { sent_at: '2024-01-02T10:00:00Z', conversation_id: 'conv-3' },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockEffectivenessData,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ data: mockChannelData }),
            order: jest.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      const analytics = await getFollowUpAnalytics(mockSupabase, { days: 30 });

      // Check overall metrics
      expect(analytics.overall.total_sent).toBe(100); // Sum of all sent
      expect(analytics.overall.response_rate).toBeCloseTo(47); // Weighted average
      expect(analytics.overall.avg_response_time_hours).toBeCloseTo(11.4); // Weighted average

      // Check by_reason metrics
      expect(analytics.by_reason).toHaveProperty('abandoned_conversation');
      expect(analytics.by_reason.abandoned_conversation.total_sent).toBe(50);
      expect(analytics.by_reason.abandoned_conversation.response_rate).toBe(45);

      // Check by_channel metrics
      expect(analytics.by_channel.email.total_sent).toBe(2);
      expect(analytics.by_channel.in_app.total_sent).toBe(1);
    });

    it('should calculate effectiveness scores correctly', async () => {
      const mockEffectivenessData = [
        {
          reason: 'cart_abandonment',
          total_sent: 10,
          response_rate: 80, // High response rate
          avg_response_time_hours: 12, // Fast response
        },
        {
          reason: 'low_satisfaction',
          total_sent: 10,
          response_rate: 20, // Low response rate
          avg_response_time_hours: 72, // Slow response
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockEffectivenessData,
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
      } as any));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      // High performing reason should have high effectiveness score
      expect(analytics.by_reason.cart_abandonment.effectiveness_score).toBeGreaterThan(70);

      // Low performing reason should have low effectiveness score
      expect(analytics.by_reason.low_satisfaction.effectiveness_score).toBeLessThan(30);
    });

    it('should generate trend data grouped by date', async () => {
      const mockMessages = [
        { sent_at: '2024-01-01T10:00:00Z', conversation_id: 'conv-1' },
        { sent_at: '2024-01-01T14:00:00Z', conversation_id: 'conv-2' },
        { sent_at: '2024-01-02T09:00:00Z', conversation_id: 'conv-3' },
        { sent_at: '2024-01-02T15:00:00Z', conversation_id: 'conv-4' },
        { sent_at: '2024-01-03T11:00:00Z', conversation_id: 'conv-5' },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockMessages }),
          } as any;
        }
        return {} as any;
      });

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.trend).toHaveLength(3); // 3 unique dates
      expect(analytics.trend[0]).toEqual({
        date: '2024-01-01',
        sent: 2,
        responded: 0,
      });
      expect(analytics.trend[1]).toEqual({
        date: '2024-01-02',
        sent: 2,
        responded: 0,
      });
      expect(analytics.trend[2]).toEqual({
        date: '2024-01-03',
        sent: 1,
        responded: 0,
      });
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: null }),
        order: jest.fn().mockResolvedValue({ data: null }),
      } as any));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.overall.total_sent).toBe(0);
      expect(analytics.overall.response_rate).toBe(0);
      expect(analytics.overall.effectiveness_score).toBe(0);
      expect(analytics.by_reason).toEqual({});
      expect(analytics.trend).toEqual([]);
    });

    it('should respect the days parameter for filtering', async () => {
      let rpcCallParams: any;

      mockSupabase.rpc.mockImplementation((name, params) => {
        rpcCallParams = params;
        return Promise.resolve({ data: [], error: null });
      });

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
        order: jest.fn().mockResolvedValue({ data: [] }),
      } as any));

      await getFollowUpAnalytics(mockSupabase, { days: 7 });

      expect(rpcCallParams.p_days).toBe(7);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('Database error') });

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [] }),
        order: jest.fn().mockResolvedValue({ data: [] }),
      } as any));

      // Should not throw, but return empty analytics
      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.overall.total_sent).toBe(0);
    });
  });

  describe('getFollowUpSummary', () => {
    it('should calculate summary statistics correctly', async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Mock counts for different time periods
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => {
        callIndex++;
        const count = callIndex === 1 ? 5 :    // today
                      callIndex === 2 ? 25 :   // week
                      callIndex === 3 ? 100 :  // month
                      10;                      // pending
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count }),
          }),
        };
      });

      // Mock effectiveness data
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
      expect(Math.round(summary.avg_response_rate * 100) / 100).toBe(48.33); // Average of 75, 45, 25
      expect(summary.most_effective_reason).toBe('cart_abandonment');
      expect(summary.least_effective_reason).toBe('low_satisfaction');
    });

    it('should handle no effectiveness data', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ count: 0 }),
      } as any));

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const summary = await getFollowUpSummary(mockSupabase);

      expect(summary.total_sent_today).toBe(0);
      expect(summary.avg_response_rate).toBe(0);
      expect(summary.most_effective_reason).toBe('N/A');
      expect(summary.least_effective_reason).toBe('N/A');
    });

    it('should handle partial data correctly', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ count: null }),
      } as any));

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { reason: 'cart_abandonment', response_rate: 50 },
        ],
        error: null,
      });

      const summary = await getFollowUpSummary(mockSupabase);

      expect(summary.total_sent_today).toBe(0);
      expect(summary.total_sent_this_week).toBe(0);
      expect(summary.avg_response_rate).toBe(50);
      expect(summary.most_effective_reason).toBe('cart_abandonment');
      expect(summary.least_effective_reason).toBe('cart_abandonment'); // Only one reason
    });
  });

  describe('trackFollowUpResponse', () => {
    it('should update follow-up message with response metadata', async () => {
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
        response_time_hours: '2.00', // 2 hours between sent and response
      });
    });

    it('should calculate response time correctly', async () => {
      const conversationId = 'conv-1';
      const sentAt = '2024-01-01T10:00:00Z';
      const responseAt = '2024-01-01T15:30:00Z'; // 5.5 hours later

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

      await trackFollowUpResponse(mockSupabase, conversationId, responseAt);

      expect(updateData.metadata.response_time_hours).toBe('5.50');
    });

    it('should do nothing if no follow-up found', async () => {
      const updateMock = jest.fn();

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null, // No follow-up found
          error: null,
        }),
        update: updateMock,
      } as any));

      await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T12:00:00Z');

      expect(updateMock).not.toHaveBeenCalled();
    });

    it('should find the most recent sent follow-up', async () => {
      let queryCalls: string[] = [];

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

      // Verify the query chain was called correctly
      expect(queryCalls).toEqual(['select', 'eq', 'eq', 'lt', 'order', 'limit']);
    });
  });
});