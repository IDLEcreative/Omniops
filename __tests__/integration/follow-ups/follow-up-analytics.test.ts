/**
 * Follow-up Flow Integration ― Analytics, Tracking & Cancellation
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getFollowUpAnalytics, trackFollowUpResponse } from '@/lib/follow-ups/analytics';
import { cancelFollowUps } from '@/lib/follow-ups/scheduler';

type MockSupabase = jest.Mocked<SupabaseClient>;

describe('Follow-up Flow Integration ― Analytics & Cancellation', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    mockSupabase = { from: jest.fn(), rpc: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('computes analytics and records responses', async () => {
    const mockEffectivenessData = [
      {
        reason: 'abandoned_conversation',
        total_sent: 100,
        response_rate: 45,
        avg_response_time_hours: 12,
      },
      {
        reason: 'cart_abandonment',
        total_sent: 50,
        response_rate: 65,
        avg_response_time_hours: 6,
      },
    ];

    mockSupabase.rpc.mockResolvedValue({ data: mockEffectivenessData, error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'follow_up_messages') {
        const mockData = [
          { channel: 'email', status: 'sent', sent_at: '2024-01-01T10:00:00Z', conversation_id: 'conv-1' },
          { channel: 'email', status: 'sent', sent_at: '2024-01-01T11:00:00Z', conversation_id: 'conv-2' },
          { channel: 'in_app', status: 'sent', sent_at: '2024-01-01T12:00:00Z', conversation_id: 'conv-3' },
        ];

        // Create a fresh chain for each .from() call
        let hasLt = false;

        const mockChain = {
          select: jest.fn(function() { return this; }),
          eq: jest.fn(function() { return this; }),
          gte: jest.fn(function() { return this; }),
          lt: jest.fn(function() {
            hasLt = true;
            return this;
          }),
          order: jest.fn(function() {
            // If this is the getTrendData query (no .lt() called), resolve with data
            if (!hasLt) {
              return Promise.resolve({ data: mockData, error: null });
            }
            // Otherwise, continue the chain for trackFollowUpResponse
            return this;
          }),
          limit: jest.fn(function() { return this; }),
          single: jest.fn().mockResolvedValue({
            data: { id: 'follow-up-1', sent_at: '2024-01-01T10:00:00Z' },
            error: null,
          }),
          update: jest.fn(function() {
            // Return an object with .eq() for the update chain
            return {
              eq: jest.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            };
          }),
        };

        return mockChain as any;
      }
      return {} as any;
    });

    const analytics = await getFollowUpAnalytics(mockSupabase);
    expect(analytics.overall.total_sent).toBe(150);
    expect(analytics.by_reason.cart_abandonment.response_rate).toBe(65);

    await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T13:00:00Z');
    expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
  });

  it('cancels pending follow-ups when user replies naturally', async () => {
    let cancelledCount = 0;

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'follow_up_messages') {
        return {
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => {
                cancelledCount = 2;
                return Promise.resolve({ count: 2 });
              }),
            })),
          })),
        } as any;
      }
      return {} as any;
    });

    const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');
    expect(cancelled).toBe(2);
    expect(cancelledCount).toBe(2);
  });
});
