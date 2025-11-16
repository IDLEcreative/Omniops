/**
 * Follow-up Flow Integration ― Priorities & Multi-reason Scenarios
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { detectFollowUpCandidates } from '@/lib/follow-ups/detector';
import { scheduleFollowUps } from '@/lib/follow-ups/scheduler';

type MockSupabase = jest.Mocked<SupabaseClient>;

describe('Follow-up Flow Integration ― Priority Handling', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    mockSupabase = { from: jest.fn(), rpc: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('detects low satisfaction conversations and schedules high-priority follow-ups', async () => {
    const mockConversations = [
      {
        id: 'conv-angry',
        session_id: 'session-angry',
        metadata: { customer_email: 'angry@example.com' },
        messages: [
          {
            role: 'user',
            content: 'This is terrible service! Absolutely unacceptable!',
            created_at: '2024-01-01T11:00:00Z',
          },
          {
            role: 'assistant',
            content: 'I apologize for the issue.',
            created_at: '2024-01-01T11:01:00Z',
          },
        ],
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockConversations }),
          }),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [] }),
        } as any;
      }
      if (table === 'follow_up_logs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ count: 0 }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        } as any;
      }
      if (table === 'follow_up_messages') {
        return { insert: jest.fn().mockResolvedValue({ error: null }) } as any;
      }
      return {} as any;
    });

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      lowSatisfactionThreshold: 40,
    });

    const lowSatCandidate = candidates.find((c) => c.reason === 'low_satisfaction');
    expect(lowSatCandidate).toBeDefined();
    expect(lowSatCandidate?.priority).toBe('high');
    expect(lowSatCandidate?.metadata.sentiment_score).toBeLessThan(40);

    const scheduleResult = await scheduleFollowUps(mockSupabase, candidates, {
      channel: 'email',
      delayMinutes: 5,
    });
    expect(scheduleResult.scheduled).toBeGreaterThan(0);
  });
});
