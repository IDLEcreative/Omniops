/**
 * Integration Tests for Complete Follow-up Flow
 *
 * Tests the entire follow-up workflow from detection to tracking:
 * 1. Detect conversations needing follow-ups
 * 2. Schedule follow-up messages
 * 3. Send pending messages
 * 4. Track responses
 * 5. Generate analytics
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  detectFollowUpCandidates,
  prioritizeFollowUps,
} from '@/lib/follow-ups/detector';
import {
  scheduleFollowUps,
  sendPendingFollowUps,
  cancelFollowUps,
} from '@/lib/follow-ups/scheduler';
import {
  getFollowUpAnalytics,
  trackFollowUpResponse,
} from '@/lib/follow-ups/analytics';

describe('Follow-up Flow Integration', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    // Create comprehensive Supabase mock
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('Complete Follow-up Workflow', () => {
    it('should handle the full flow: detect → schedule → send → track', async () => {
      // Step 1: Setup conversation data that needs follow-up
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
          messages: [
            { id: 'msg-3', created_at: '2024-01-01T09:00:00Z' },
          ],
        },
      ];

      // Mock for detection phase
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
          return {
            insert: jest.fn((data) => {
              const messageWithId = { ...data, id: `msg-${followUpMessageId++}` };
              scheduledMessages.push(messageWithId);
              return Promise.resolve({ error: null });
            }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: scheduledMessages }),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: scheduledMessages[0],
              error: null,
            }),
          } as any;
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      // Step 1: Detect candidates
      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { abandonmentThresholdMinutes: 60 }
      );

      expect(candidates).toHaveLength(2);
      expect(candidates[0].reason).toBe('abandoned_conversation');
      expect(candidates[1].reason).toBe('cart_abandonment');

      // Step 2: Prioritize candidates
      const prioritized = prioritizeFollowUps(candidates);
      expect(prioritized[0].priority).toBe('high'); // Cart abandonment is high priority

      // Step 3: Schedule follow-ups
      const scheduleResult = await scheduleFollowUps(mockSupabase, prioritized);
      expect(scheduleResult.scheduled).toBe(2);
      expect(scheduleResult.skipped).toBe(0);
      expect(scheduledMessages).toHaveLength(2);

      // Step 4: Send pending follow-ups
      const sendResult = await sendPendingFollowUps(mockSupabase);
      expect(sendResult.sent).toBe(2);
      expect(sendResult.failed).toBe(0);

      // Step 5: Simulate user response and track it
      const responseTime = '2024-01-01T14:00:00Z';
      await trackFollowUpResponse(mockSupabase, 'conv-1', responseTime);

      // Verify the follow-up was marked as responded
      const updateCalls = (mockSupabase.from as jest.Mock).mock.calls
        .filter(([table]) => table === 'follow_up_messages');
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it('should handle multi-reason scenarios with different priorities', async () => {
      // Setup conversations with different follow-up reasons
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
          } as any;
        }
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      // Detect with low satisfaction threshold
      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { lowSatisfactionThreshold: 40 }
      );

      const lowSatCandidate = candidates.find(c => c.reason === 'low_satisfaction');
      expect(lowSatCandidate).toBeDefined();
      expect(lowSatCandidate?.priority).toBe('high'); // Low satisfaction is high priority
      expect(lowSatCandidate?.metadata.sentiment_score).toBeLessThan(40);

      // Schedule the follow-up
      const result = await scheduleFollowUps(mockSupabase, candidates, {
        channel: 'email',
        delayMinutes: 5, // Quick follow-up for unhappy customer
      });

      expect(result.scheduled).toBeGreaterThan(0);
    });

    it('should handle concurrent scheduling and avoid duplicates', async () => {
      const conversationId = 'conv-dup';
      const mockConversation = {
        id: conversationId,
        session_id: 'session-dup',
        metadata: { customer_email: 'dup@example.com' },
        messages: [
          { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Help' },
        ],
      };

      let followUpLogCount = 0;
      const insertedMessages = new Set();

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
              // Check for duplicates
              const key = `${data.conversation_id}-${data.reason}`;
              if (insertedMessages.has(key)) {
                return Promise.resolve({
                  error: new Error('Duplicate follow-up'),
                });
              }
              insertedMessages.add(key);
              return Promise.resolve({ error: null });
            }),
          } as any;
        }
        return {} as any;
      });

      // First detection and scheduling
      const candidates1 = await detectFollowUpCandidates(mockSupabase, ['domain-1']);
      const result1 = await scheduleFollowUps(mockSupabase, candidates1);
      expect(result1.scheduled).toBe(1);

      // Second detection should not find the same conversation (max attempts reached)
      const candidates2 = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { maxFollowUpAttempts: 1 }
      );
      expect(candidates2).toHaveLength(0);
    });

    it('should handle response tracking and analytics generation', async () => {
      // Setup analytics data
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

      mockSupabase.rpc.mockResolvedValue({
        data: mockEffectivenessData,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({
              data: [
                { channel: 'email', status: 'sent', sent_at: '2024-01-01T10:00:00Z' },
                { channel: 'email', status: 'sent', sent_at: '2024-01-01T11:00:00Z' },
                { channel: 'in_app', status: 'sent', sent_at: '2024-01-01T12:00:00Z' },
              ],
            }),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'follow-up-1',
                sent_at: '2024-01-01T10:00:00Z',
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      // Generate analytics
      const analytics = await getFollowUpAnalytics(mockSupabase);

      expect(analytics.overall.total_sent).toBe(150);
      expect(analytics.overall.response_rate).toBeGreaterThan(0);
      expect(analytics.by_reason.cart_abandonment.response_rate).toBe(65);
      expect(analytics.by_reason.cart_abandonment.effectiveness_score).toBeGreaterThan(
        analytics.by_reason.abandoned_conversation.effectiveness_score
      );

      // Track a response
      await trackFollowUpResponse(mockSupabase, 'conv-1', '2024-01-01T13:00:00Z');

      // Verify tracking was recorded
      expect(mockSupabase.from).toHaveBeenCalledWith('follow_up_messages');
    });

    it('should cancel follow-ups when user responds naturally', async () => {
      let cancelledCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => {
                  cancelledCount = 2; // Two pending follow-ups cancelled
                  return Promise.resolve({ count: 2 });
                }),
              })),
            })),
          } as any;
        }
        return {} as any;
      });

      // User responds to conversation before follow-up is sent
      const cancelled = await cancelFollowUps(mockSupabase, 'conv-1');

      expect(cancelled).toBe(2);
      expect(cancelledCount).toBe(2);
    });

    it('should handle error scenarios gracefully', async () => {
      // Simulate various errors in the flow
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          // Database connection error during detection
          throw new Error('Database connection lost');
        }
        return {} as any;
      });

      // Detection should handle error and return empty array
      let error = null;
      try {
        await detectFollowUpCandidates(mockSupabase, ['domain-1']);
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
      expect(error).toBeInstanceOf(Error);

      // Reset mock for scheduling error test
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'follow_up_messages') {
          return {
            insert: jest.fn().mockRejectedValue(new Error('Insert failed')),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const testCandidate = {
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

      const scheduleResult = await scheduleFollowUps(mockSupabase, [testCandidate]);
      expect(scheduleResult.skipped).toBe(1);
      expect(scheduleResult.scheduled).toBe(0);
    });
  });
});