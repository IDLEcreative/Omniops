/**
 * Follow-up Flow Integration ― Complete Workflow
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { detectFollowUpCandidates, prioritizeFollowUps } from '@/lib/follow-ups/detector';
import { scheduleFollowUps } from '@/lib/follow-ups/scheduler';
import { sendPendingFollowUps } from '@/lib/follow-ups/message-sender';
import { trackFollowUpResponse } from '@/lib/follow-ups/analytics';

type MockSupabase = jest.Mocked<SupabaseClient>;

describe('Follow-up Flow Integration ― Full Workflow', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    mockSupabase = { from: jest.fn(), rpc: jest.fn() } as any;
    jest.clearAllMocks();
  });

  it('runs detect → schedule → send → track successfully', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        session_id: 'session-1',
        created_at: '2024-01-01T10:00:00Z',
        metadata: { customer_email: 'user@example.com' },
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            created_at: '2024-01-01T10:30:00Z',
            content: 'I need help with my order',
            metadata: {},
          },
          {
            id: 'msg-2',
            role: 'assistant',
            created_at: '2024-01-01T10:25:00Z',
            content: 'I can help you with that',
            metadata: {},
          },
        ],
      },
      {
        id: 'conv-2',
        session_id: 'session-2',
        metadata: {
          customer_email: 'shopper@example.com',
          session_metadata: {
            page_views: [
              { url: '/products/item-1', timestamp: '2024-01-01T09:00:00Z' },
              { url: '/cart', timestamp: '2024-01-01T09:05:00Z' },
            ],
          },
        },
        messages: [{ id: 'msg-3', created_at: '2024-01-01T09:00:00Z' }],
      },
    ];

    let followUpMessageId = 1;
    const scheduledMessages: any[] = [];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: mockConversations }),
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
        const createMockChain = () => {
          const mockChain: any = {
            insert: jest.fn((data) => {
              const messageWithId = {
                ...data,
                id: `msg-${followUpMessageId++}`,
                sent_at: new Date().toISOString()
              };
              scheduledMessages.push(messageWithId);
              return Promise.resolve({ error: null });
            }),
            select: jest.fn(() => mockChain),
            eq: jest.fn(() => mockChain),
            lte: jest.fn(() => mockChain),
            lt: jest.fn(() => mockChain),
            order: jest.fn(() => mockChain),
            limit: jest.fn(() => mockChain),
            single: jest.fn(() => Promise.resolve({
              data: scheduledMessages[0] || null,
              error: null,
            })),
            update: jest.fn(() => mockChain),
            // Make the chain thenable so it can be awaited
            then: jest.fn((resolve) => {
              resolve({ data: scheduledMessages, error: null });
            }),
          };
          return mockChain;
        };

        return createMockChain();
      }
      if (table === 'notifications') {
        return { insert: jest.fn().mockResolvedValue({ error: null }) } as any;
      }
      return {} as any;
    });

    const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1'], {
      abandonmentThresholdMinutes: 60,
    });
    expect(candidates).toHaveLength(2);
    expect(candidates[0].reason).toBe('abandoned_conversation');
    expect(candidates[1].reason).toBe('cart_abandonment');

    const prioritized = prioritizeFollowUps(candidates);
    expect(prioritized[0].priority).toBe('high');

    const scheduleResult = await scheduleFollowUps(mockSupabase, prioritized);
    expect(scheduleResult.scheduled).toBe(2);
    expect(scheduleResult.skipped).toBe(0);

    const sendResult = await sendPendingFollowUps(mockSupabase);
    expect(sendResult.sent).toBe(2);
    expect(sendResult.failed).toBe(0);

    await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T14:00:00Z');

    const updateCalls = (mockSupabase.from as jest.Mock).mock.calls.filter(
      ([table]) => table === 'follow_up_messages'
    );
    expect(updateCalls.length).toBeGreaterThan(0);
  });
});
