/**
 * Metrics-focused tests for Follow-up Analytics
 *
 * Validates getFollowUpAnalytics calculations, covering:
 * - Overall metrics
 * - Effectiveness scoring
 * - Trend aggregation
 * - Channel breakdowns
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFollowUpAnalytics } from '@/lib/follow-ups/analytics';
import {
  createChannelQuery,
  createTrendQuery,
  createFollowUpSelectQuery,
  createFollowUpUpdateQuery,
} from './analytics-test-helpers';

describe('Follow-up Analytics Metrics', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('getFollowUpAnalytics', () => {
    it('fetches and calculates overall analytics', async () => {
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

      const channelQuery = createChannelQuery(mockChannelData);
      const trendQuery = createTrendQuery(mockTrendData);
      const followUpSelect = createFollowUpSelectQuery({
        id: 'follow-up-1',
        sent_at: '2024-01-01T10:00:00Z',
      });
      const followUpUpdate = createFollowUpUpdateQuery();

      mockSupabase.from
        .mockImplementationOnce(() => channelQuery)
        .mockImplementationOnce(() => trendQuery)
        .mockImplementationOnce(() => followUpSelect)
        .mockImplementationOnce(() => followUpUpdate);

      const analytics = await getFollowUpAnalytics(mockSupabase, { days: 30 });

      expect(analytics.overall.total_sent).toBe(100);
      expect(analytics.overall.response_rate).toBeCloseTo(46.5);
      expect(analytics.overall.avg_response_time_hours).toBeCloseTo(12.6);
      expect(analytics.by_reason.abandoned_conversation.total_sent).toBe(50);
      expect(analytics.by_channel.email.total_sent).toBe(2);
    });

    it('calculates effectiveness scores correctly', async () => {
      const mockEffectivenessData = [
        {
          reason: 'cart_abandonment',
          total_sent: 10,
          response_rate: 80,
          avg_response_time_hours: 12,
        },
        {
          reason: 'low_satisfaction',
          total_sent: 10,
          response_rate: 20,
          avg_response_time_hours: 72,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockEffectivenessData,
        error: null,
      });

      mockSupabase.from
        .mockImplementationOnce(() => createChannelQuery([]))
        .mockImplementationOnce(() => createTrendQuery([]));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.by_reason.cart_abandonment.effectiveness_score).toBeGreaterThan(70);
      expect(analytics.by_reason.low_satisfaction.effectiveness_score).toBeLessThan(30);
    });

    it('generates trend data grouped by date', async () => {
      const mockMessages = [
        { sent_at: '2024-01-01T10:00:00Z', conversation_id: 'conv-1' },
        { sent_at: '2024-01-01T14:00:00Z', conversation_id: 'conv-2' },
        { sent_at: '2024-01-02T09:00:00Z', conversation_id: 'conv-3' },
        { sent_at: '2024-01-02T15:00:00Z', conversation_id: 'conv-4' },
        { sent_at: '2024-01-03T11:00:00Z', conversation_id: 'conv-5' },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      mockSupabase.from
        .mockImplementationOnce(() => createChannelQuery([]))
        .mockImplementationOnce(() => createTrendQuery(mockMessages));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.trends[0].date).toBe('2024-01-01');
      expect(analytics.trends[0].count).toBe(2);
      expect(analytics.trends[1].date).toBe('2024-01-02');
      expect(analytics.trends[1].count).toBe(2);
      expect(analytics.trends[2].date).toBe('2024-01-03');
      expect(analytics.trends[2].count).toBe(1);
    });

    it('handles empty trend and channel data', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      mockSupabase.from
        .mockImplementationOnce(() => createChannelQuery([]))
        .mockImplementationOnce(() => createTrendQuery([]));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.overall.total_sent).toBe(0);
      expect(analytics.trends).toHaveLength(0);
      expect(analytics.by_channel).toEqual({});
    });

    it('handles Supabase errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('Database error') });

      mockSupabase.from
        .mockImplementationOnce(() => createChannelQuery([]))
        .mockImplementationOnce(() => createTrendQuery([]));

      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.overall.total_sent).toBe(0);
      expect(analytics.by_reason).toEqual({});
    });
  });
});
