/**
 * Follow-up Flow Integration ― Concurrency & Deduplication
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { detectFollowUpCandidates } from '@/lib/follow-ups/detector';
import { scheduleFollowUps } from '@/lib/follow-ups/scheduler';

type MockSupabase = jest.Mocked<SupabaseClient>;

describe('Follow-up Flow Integration ― Concurrency Safety', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    mockSupabase = { from: jest.fn(), rpc: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('prevents duplicate scheduling when multiple workers run', async () => {
    const conversationId = 'conv-dup';
    const mockConversation = {
      id: conversationId,
      session_id: 'session-dup',
      metadata: { customer_email: 'dup@example.com' },
      messages: [{ role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Help' }],
    };

    let followUpLogCount = 0;
    const insertedMessages = new Set<string>();

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [mockConversation] }),
        } as any;
      }
      if (table === 'follow_up_logs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ count: followUpLogCount }),
          insert: jest.fn(() => {
            followUpLogCount++;
            return Promise.resolve({ error: null });
          }),
        } as any;
      }
      if (table === 'follow_up_messages') {
        return {
          insert: jest.fn((data) => {
            const key = `${data.conversation_id}-${data.reason}`;
            if (insertedMessages.has(key)) {
              return Promise.resolve({ error: new Error('Duplicate follow-up') });
            }
            insertedMessages.add(key);
            return Promise.resolve({ error: null });
          }),
        } as any;
      }
      return {} as any;
    });

    const firstCandidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);
    const firstSchedule = await scheduleFollowUps(mockSupabase, firstCandidates);
    expect(firstSchedule.scheduled).toBe(1);

    const secondCandidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      maxFollowUpAttempts: 1,
    });
    expect(secondCandidates).toHaveLength(0);
  });
});
