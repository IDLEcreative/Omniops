/**
 * Tests for Follow-up Detector
 *
 * Validates detection of conversations needing automated follow-ups:
 * - Abandoned conversations
 * - Low satisfaction
 * - Cart abandonment
 * - Max follow-up enforcement
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  detectFollowUpCandidates,
  prioritizeFollowUps,
  type FollowUpCandidate,
  type DetectionOptions,
  type FollowUpReason,
} from '@/lib/follow-ups/detector';

describe('Follow-up Detector', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    // Create fresh Supabase mock
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  describe('detectFollowUpCandidates', () => {
    it('should detect abandoned conversations with user\'s last message', async () => {
      // Mock abandoned conversations query
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
              content: 'Can you help me?',
              metadata: {},
            },
            {
              id: 'msg-2',
              role: 'assistant',
              created_at: '2024-01-01T10:25:00Z',
              content: 'Hello!',
              metadata: {},
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
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockConversations }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 0 }),
          } as any;
        }
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { abandonmentThresholdMinutes: 30 }
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({
        conversation_id: 'conv-1',
        session_id: 'session-1',
        reason: 'abandoned_conversation',
        priority: 'medium',
        metadata: {
          last_message_at: '2024-01-01T10:30:00Z',
          message_count: 2,
          customer_email: 'user@example.com',
        },
      });
    });

    it('should skip conversations with too few messages', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          session_id: 'session-1',
          metadata: {},
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              created_at: '2024-01-01T10:00:00Z',
              content: 'Hi',
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
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockConversations }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ count: 0 }),
        } as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { minMessagesForFollowUp: 2 }
      );

      expect(candidates).toHaveLength(0);
    });

    it('should detect low satisfaction conversations', async () => {
      const mockConversations = [
        {
          id: 'conv-2',
          session_id: 'session-2',
          metadata: { customer_email: 'angry@example.com' },
          messages: [
            {
              role: 'user',
              content: 'This is terrible and broken!',
              created_at: '2024-01-01T11:00:00Z',
            },
            {
              role: 'assistant',
              content: 'I apologize for the issue.',
              created_at: '2024-01-01T11:01:00Z',
            },
            {
              role: 'user',
              content: 'This is unacceptable and frustrating!',
              created_at: '2024-01-01T11:02:00Z',
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
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { lowSatisfactionThreshold: 40 }
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({
        conversation_id: 'conv-2',
        reason: 'low_satisfaction',
        priority: 'high',
        metadata: expect.objectContaining({
          sentiment_score: expect.any(Number),
          customer_email: 'angry@example.com',
        }),
      });
      // Sentiment should be low due to negative keywords
      expect(candidates[0].metadata.sentiment_score).toBeLessThan(40);
    });

    it('should detect cart abandonment from session metadata', async () => {
      const mockConversations = [
        {
          id: 'conv-3',
          session_id: 'session-3',
          metadata: {
            customer_email: 'shopper@example.com',
            session_metadata: {
              page_views: [
                { url: '/products/item-1', timestamp: '2024-01-01T10:00:00Z' },
                { url: '/cart', timestamp: '2024-01-01T10:05:00Z' },
                { url: '/products/item-2', timestamp: '2024-01-01T10:10:00Z' },
              ],
            },
          },
          messages: [
            { id: 'msg-1', created_at: '2024-01-01T10:00:00Z' },
          ],
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: table === 'conversations' ? mockConversations : []
            }),
          } as any;
        }
        if (table === 'follow_up_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ count: 0 }),
          } as any;
        }
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1']
      );

      expect(candidates.find(c => c.reason === 'cart_abandonment')).toBeDefined();
      const cartCandidate = candidates.find(c => c.reason === 'cart_abandonment');
      expect(cartCandidate).toMatchObject({
        conversation_id: 'conv-3',
        reason: 'cart_abandonment',
        priority: 'high',
        metadata: expect.objectContaining({
          has_cart_activity: true,
          customer_email: 'shopper@example.com',
        }),
      });
    });

    it('should not detect cart abandonment if checkout completed', async () => {
      const mockConversations = [
        {
          id: 'conv-4',
          session_id: 'session-4',
          metadata: {
            session_metadata: {
              page_views: [
                { url: '/cart', timestamp: '2024-01-01T10:00:00Z' },
                { url: '/checkout', timestamp: '2024-01-01T10:05:00Z' },
                { url: '/order-confirmation', timestamp: '2024-01-01T10:10:00Z' },
              ],
            },
          },
          messages: [{ id: 'msg-1', created_at: '2024-01-01T10:00:00Z' }],
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: table === 'conversations' ? mockConversations : []
            }),
          } as any;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ count: 0 }),
        } as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1']
      );

      expect(candidates.find(c => c.reason === 'cart_abandonment')).toBeUndefined();
    });

    it('should enforce max follow-up attempts', async () => {
      const mockConversations = [
        {
          id: 'conv-5',
          session_id: 'session-5',
          metadata: {},
          messages: [
            { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Help' },
            { role: 'assistant', created_at: '2024-01-01T10:01:00Z', content: 'Hi' },
          ],
        },
      ];

      // Mock that 2 follow-ups already sent
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
            eq: jest.fn().mockResolvedValue({ count: 2 }), // Already sent 2
          } as any;
        }
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { maxFollowUpAttempts: 2 }
      );

      expect(candidates).toHaveLength(0); // Should skip due to max attempts reached
    });

    it('should extract email from different metadata locations', async () => {
      const mockConversations = [
        {
          id: 'conv-6',
          session_id: 'session-6',
          metadata: {
            session_metadata: {
              customer_email: 'nested@example.com',
            },
          },
          messages: [
            { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Help' },
            { role: 'assistant', created_at: '2024-01-01T10:01:00Z', content: 'Sure' },
          ],
        },
        {
          id: 'conv-7',
          session_id: 'session-7',
          metadata: {
            customer_email: 'direct@example.com',
          },
          messages: [
            { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Question' },
            { role: 'assistant', created_at: '2024-01-01T10:01:00Z', content: 'Answer' },
          ],
        },
      ];

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
          } as any;
        }
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1']
      );

      expect(candidates[0].metadata.customer_email).toBe('nested@example.com');
      expect(candidates[1].metadata.customer_email).toBe('direct@example.com');
    });

    it('should handle empty results gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null }),
      } as any));

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1']
      );

      expect(candidates).toEqual([]);
    });

    it('should analyze sentiment with multiple keywords', async () => {
      const mockConversations = [
        {
          id: 'conv-8',
          session_id: 'session-8',
          metadata: {},
          messages: [
            {
              role: 'user',
              content: 'Thank you, this is perfect and amazing!',
              created_at: '2024-01-01T10:00:00Z',
            },
            {
              role: 'assistant',
              content: 'Glad to help!',
              created_at: '2024-01-01T10:01:00Z',
            },
            {
              role: 'user',
              content: 'I really appreciate the excellent service!',
              created_at: '2024-01-01T10:02:00Z',
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
        return {} as any;
      });

      const candidates = await detectFollowUpCandidates(
        mockSupabase,
        ['domain-1'],
        { lowSatisfactionThreshold: 40 }
      );

      // Should not detect as low satisfaction due to positive sentiment
      expect(candidates.find(c => c.reason === 'low_satisfaction')).toBeUndefined();
    });
  });

  describe('prioritizeFollowUps', () => {
    it('should sort candidates by priority (high to low)', () => {
      const candidates: FollowUpCandidate[] = [
        {
          conversation_id: 'conv-1',
          session_id: 'session-1',
          reason: 'abandoned_conversation',
          priority: 'low',
          metadata: {
            last_message_at: '2024-01-01T10:00:00Z',
            message_count: 2,
          },
        },
        {
          conversation_id: 'conv-2',
          session_id: 'session-2',
          reason: 'cart_abandonment',
          priority: 'high',
          metadata: {
            last_message_at: '2024-01-01T10:00:00Z',
            message_count: 3,
            has_cart_activity: true,
          },
        },
        {
          conversation_id: 'conv-3',
          session_id: 'session-3',
          reason: 'low_satisfaction',
          priority: 'medium',
          metadata: {
            last_message_at: '2024-01-01T10:00:00Z',
            message_count: 4,
            sentiment_score: 30,
          },
        },
      ];

      const prioritized = prioritizeFollowUps(candidates);

      expect(prioritized[0].priority).toBe('high');
      expect(prioritized[1].priority).toBe('medium');
      expect(prioritized[2].priority).toBe('low');
    });

    it('should maintain order for same priority levels', () => {
      const candidates: FollowUpCandidate[] = [
        {
          conversation_id: 'conv-1',
          session_id: 'session-1',
          reason: 'abandoned_conversation',
          priority: 'medium',
          metadata: {
            last_message_at: '2024-01-01T10:00:00Z',
            message_count: 2,
          },
        },
        {
          conversation_id: 'conv-2',
          session_id: 'session-2',
          reason: 'unresolved_issue',
          priority: 'medium',
          metadata: {
            last_message_at: '2024-01-01T11:00:00Z',
            message_count: 3,
          },
        },
      ];

      const prioritized = prioritizeFollowUps(candidates);

      expect(prioritized[0].conversation_id).toBe('conv-1');
      expect(prioritized[1].conversation_id).toBe('conv-2');
    });

    it('should handle empty array', () => {
      const prioritized = prioritizeFollowUps([]);
      expect(prioritized).toEqual([]);
    });
  });
});