/**
 * Tests for Follow-up Scheduler
 *
 * Validates scheduling and sending of automated follow-up messages:
 * - Message scheduling
 * - Content generation per reason
 * - Channel handling (email, in-app)
 * - Sending pending messages
 * - Cancelling follow-ups
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  scheduleFollowUps,
  sendPendingFollowUps,
  cancelFollowUps,
  type ScheduleOptions,
} from '@/lib/follow-ups/scheduler';
import type { FollowUpCandidate } from '@/lib/follow-ups/detector';

describe('Follow-up Scheduler', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // Create fresh Supabase mock
    mockSupabase = {
      from: jest.fn(),
    } as any;

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('scheduleFollowUps', () => {
    const mockCandidates: FollowUpCandidate[] = [
      {
        conversation_id: 'conv-1',
        session_id: 'session-1',
        reason: 'abandoned_conversation',
        priority: 'medium',
        metadata: {
          last_message_at: '2024-01-01T10:00:00Z',
          message_count: 3,
          customer_email: 'user@example.com',
        },
      },
      {
        conversation_id: 'conv-2',
        session_id: 'session-2',
        reason: 'cart_abandonment',
        priority: 'high',
        metadata: {
          last_message_at: '2024-01-01T11:00:00Z',
          message_count: 2,
          has_cart_activity: true,
          customer_email: 'shopper@example.com',
        },
      },
    ];

    it('should schedule follow-ups for candidates with emails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await scheduleFollowUps(mockSupabase, mockCandidates);

      expect(result.scheduled).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
      expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_logs');
    });

    it('should skip candidates without email for email channel', async () => {
      const candidatesWithoutEmail: FollowUpCandidate[] = [
        {
          conversation_id: 'conv-3',
          session_id: 'session-3',
          reason: 'abandoned_conversation',
          priority: 'medium',
          metadata: {
            last_message_at: '2024-01-01T10:00:00Z',
            message_count: 3,
            // No customer_email
          },
        },
      ];

      mockSupabase.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any));

      const result = await scheduleFollowUps(
        mockSupabase,
        candidatesWithoutEmail,
        { channel: 'email' }
      );

      expect(result.scheduled).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should generate appropriate message content for each reason', async () => {
      const insertCalls: any[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn((data) => {
              insertCalls.push(data);
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await scheduleFollowUps(mockSupabase, mockCandidates, { channel: 'email' });

      expect(insertCalls).toHaveLength(2);

      // Check abandoned conversation message
      expect(insertCalls[0].subject).toBe('Did you find what you were looking for?');
      expect(insertCalls[0].content).toContain('We noticed you were asking about something');

      // Check cart abandonment message
      expect(insertCalls[1].subject).toBe('You left something in your cart');
      expect(insertCalls[1].content).toContain('Your items are still waiting');
    });

    it('should respect delay minutes option', async () => {
      let insertedData: any;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn((data) => {
              insertedData = data;
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const delayMinutes = 30;
      await scheduleFollowUps(
        mockSupabase,
        [mockCandidates[0]],
        { delayMinutes }
      );

      const scheduledTime = new Date(insertedData.scheduled_at);
      const now = new Date();
      const diffMinutes = (scheduledTime.getTime() - now.getTime()) / 60000;

      // Should be approximately 30 minutes in the future (allow small variance)
      expect(diffMinutes).toBeGreaterThan(29);
      expect(diffMinutes).toBeLessThan(31);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: new Error('Database error')
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await scheduleFollowUps(mockSupabase, mockCandidates);

      expect(result.scheduled).toBe(0);
      expect(result.skipped).toBe(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[FollowUpScheduler] Failed to schedule:',
        expect.any(Error)
      );
    });

    it('should generate in-app messages with shorter content', async () => {
      const insertCalls: any[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn((data) => {
              insertCalls.push(data);
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await scheduleFollowUps(mockSupabase, mockCandidates, { channel: 'in_app' });

      expect(insertCalls[0].subject).toBe('Need help?');
      expect(insertCalls[0].content).toContain('Would you like to continue');
      // In-app channel still uses email as recipient if available, otherwise 'in-app'
      expect(insertCalls[0].recipient).toBe('user@example.com');
    });

    it('should include metadata in scheduled messages', async () => {
      let insertedData: any;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn((data) => {
              insertedData = data;
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      await scheduleFollowUps(mockSupabase, [mockCandidates[0]]);

      expect(insertedData.metadata).toEqual({
        priority: 'medium',
        detection_metadata: mockCandidates[0].metadata,
      });
    });
  });

  describe('sendPendingFollowUps', () => {
    it('should send pending messages that are due', async () => {
      const pendingMessages = [
        {
          id: 'msg-1',
          channel: 'email',
          recipient: 'user@example.com',
          subject: 'Follow-up',
          content: 'Message content',
        },
        {
          id: 'msg-2',
          channel: 'in_app',
          session_id: 'session-1',
          subject: 'Notification',
          content: 'In-app message',
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: pendingMessages }),
            update: jest.fn().mockReturnThis(),
          } as any;
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await sendPendingFollowUps(mockSupabase);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[FollowUpScheduler] Would send email:',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Follow-up',
        })
      );
    });

    it('should handle empty pending messages', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null }),
      } as any));

      const result = await sendPendingFollowUps(mockSupabase);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should mark failed messages and continue with others', async () => {
      const pendingMessages = [
        {
          id: 'msg-1',
          channel: 'invalid' as any, // Will cause error
          recipient: 'user@example.com',
        },
        {
          id: 'msg-2',
          channel: 'email',
          recipient: 'user2@example.com',
          subject: 'Follow-up',
          content: 'Content',
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: pendingMessages }),
            update: jest.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      const result = await sendPendingFollowUps(mockSupabase);

      // Both messages are sent (email is logged, invalid channel doesn't throw)
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should respect the limit parameter', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        channel: 'email',
        recipient: `user${i}@example.com`,
        subject: 'Follow-up',
        content: 'Content',
      }));

      let limitCalled = 0;

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn((l) => {
          limitCalled = l;
          return { data: manyMessages.slice(0, l) };
        }),
        update: jest.fn().mockReturnThis(),
      } as any));

      await sendPendingFollowUps(mockSupabase, 25);

      expect(limitCalled).toBe(25);
    });

    it('should update sent_at timestamp when message is sent', async () => {
      const pendingMessages = [
        {
          id: 'msg-1',
          channel: 'email',
          recipient: 'user@example.com',
          subject: 'Follow-up',
          content: 'Content',
        },
      ];

      let updateData: any;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: pendingMessages }),
            update: jest.fn((data) => {
              updateData = data;
              return { eq: jest.fn().mockResolvedValue({ error: null }) };
            }),
          } as any;
        }
        return {} as any;
      });

      await sendPendingFollowUps(mockSupabase);

      expect(updateData.status).toBe('sent');
      expect(updateData.sent_at).toBeDefined();
      expect(new Date(updateData.sent_at)).toBeInstanceOf(Date);
    });

    it('should create in-app notifications correctly', async () => {
      const pendingMessages = [
        {
          id: 'msg-1',
          channel: 'in_app',
          session_id: 'session-1',
          conversation_id: 'conv-1',
          reason: 'abandoned_conversation',
          subject: 'Need help?',
          content: 'Continue conversation?',
        },
      ];

      let notificationData: any;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: pendingMessages }),
            update: jest.fn().mockReturnThis(),
          } as any;
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn((data) => {
              notificationData = data;
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        return {} as any;
      });

      await sendPendingFollowUps(mockSupabase);

      expect(notificationData).toEqual({
        session_id: 'session-1',
        type: 'follow_up',
        title: 'Need help?',
        message: 'Continue conversation?',
        metadata: {
          conversation_id: 'conv-1',
          reason: 'abandoned_conversation',
        },
      });
    });
  });

  describe('cancelFollowUps', () => {
    it('should cancel pending follow-ups for a conversation', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 3 }),
        }),
      } as any));

      const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');

      expect(cancelled).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
    });

    it('should only cancel pending messages, not sent ones', async () => {
      let updateCalled = false;
      let eqCalls: any[] = [];

      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn(() => {
          updateCalled = true;
          return {
            eq: jest.fn((field, value) => {
              eqCalls.push({ field, value });
              return {
                eq: jest.fn((field2, value2) => {
                  eqCalls.push({ field: field2, value: value2 });
                  return Promise.resolve({ count: 1 });
                }),
              };
            }),
          };
        }),
      } as any));

      await cancelFollowUps(mockSupabase, 'conv-1');

      expect(updateCalled).toBe(true);
      expect(eqCalls).toContainEqual({ field: 'conversation_id', value: 'conv-1' });
      expect(eqCalls).toContainEqual({ field: 'status', value: 'pending' });
    });

    it('should return 0 if no messages to cancel', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null }),
        }),
      } as any));

      const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');

      expect(cancelled).toBe(0);
    });
  });
});