/**
 * Follow-up Flow Integration ― Error Handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { detectFollowUpCandidates } from '@/lib/follow-ups/detector';
import { scheduleFollowUps } from '@/lib/follow-ups/scheduler';

type MockSupabase = jest.Mocked<SupabaseClient>;

describe('Follow-up Flow Integration ― Error Handling', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    mockSupabase = { from: jest.fn(), rpc: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('surfaces detection and scheduling errors cleanly', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        throw new Error('Database connection lost');
      }
      return {} as any;
    });

    await expect(detectFollowUpCandidates(mockSupabase, ['domain-1'])).rejects.toThrow(
      'Database connection lost'
    );

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'follow_up_messages') {
        return { insert: jest.fn().mockRejectedValue(new Error('Insert failed')) } as any;
      }
      if (table === 'follow_up_logs') {
        return { insert: jest.fn().mockResolvedValue({ error: null }) } as any;
      }
      return {} as any;
    });

    const candidate = {
      conversation_id: 'conv-error',
      session_id: 'session-error',
      reason: 'abandoned_conversation' as const,
      priority: 'medium' as const,
      metadata: {
        last_message_at: '2024-01-01T10:00:00Z',
        message_count: 2,
        customer_email: 'error@example.com',
      },
    };

    const scheduleResult = await scheduleFollowUps(mockSupabase, [candidate]);
    expect(scheduleResult.skipped).toBe(1);
    expect(scheduleResult.scheduled).toBe(0);
  });
});
