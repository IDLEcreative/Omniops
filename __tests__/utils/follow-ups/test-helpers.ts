/**
 * Test Helpers for Follow-up Scheduler Tests
 *
 * Provides shared mocks, test data, and setup utilities for follow-up testing.
 * Reduces duplication across scheduler test modules.
 */

import { jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowUpCandidate } from '@/lib/follow-ups/detector';

/**
 * Creates a fresh Supabase mock with default implementations
 */
export function createMockSupabase(): jest.Mocked<SupabaseClient> {
  return {
    from: jest.fn(),
  } as any;
}

/**
 * Mock candidates for testing
 */
export const MOCK_CANDIDATES: FollowUpCandidate[] = [
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

/**
 * Candidate without email for testing email channel validation
 */
export const CANDIDATE_WITHOUT_EMAIL: FollowUpCandidate[] = [
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

/**
 * Mock pending message data for sendPendingFollowUps tests
 */
export const PENDING_EMAIL_MESSAGES = [
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

/**
 * Mock pending message with invalid channel
 */
export const PENDING_INVALID_CHANNEL_MESSAGES = [
  {
    id: 'msg-1',
    channel: 'invalid' as any,
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

/**
 * Helper to configure Supabase mock for follow_up_messages and follow_up_logs
 */
export function mockSupabaseForScheduling(
  mockSupabase: jest.Mocked<SupabaseClient>,
  onInsert?: (data: any) => void
): void {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'follow_up_messages') {
      return {
        insert: jest.fn((data) => {
          onInsert?.(data);
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
}

/**
 * Helper to configure Supabase mock for sending pending messages
 */
export function mockSupabaseForSending(
  mockSupabase: jest.Mocked<SupabaseClient>,
  messages: any[],
  onInsertNotification?: (data: any) => void
): void {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'follow_up_messages') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: messages }),
        update: jest.fn().mockReturnThis(),
      } as any;
    }
    if (table === 'notifications') {
      return {
        insert: jest.fn((data) => {
          onInsertNotification?.(data);
          return Promise.resolve({ error: null });
        }),
      } as any;
    }
    return {} as any;
  });
}

/**
 * Helper to configure Supabase mock for sending with update tracking
 */
export function mockSupabaseForSendingWithUpdate(
  mockSupabase: jest.Mocked<SupabaseClient>,
  messages: any[],
  onUpdate?: (data: any) => void
): void {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'follow_up_messages') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: messages }),
        update: jest.fn((data) => {
          onUpdate?.(data);
          return { eq: jest.fn().mockResolvedValue({ error: null }) };
        }),
      } as any;
    }
    return {} as any;
  });
}

/**
 * Helper to configure Supabase mock for cancellation
 */
export function mockSupabaseForCancellation(
  mockSupabase: jest.Mocked<SupabaseClient>,
  eqCallbacks?: Array<(field: string, value: any) => void>
): void {
  mockSupabase.from.mockImplementation(() => ({
    update: jest.fn(() => {
      return {
        eq: jest.fn((field, value) => {
          eqCallbacks?.[0]?.(field, value);
          return {
            eq: jest.fn((field2, value2) => {
              eqCallbacks?.[1]?.(field2, value2);
              return Promise.resolve({ count: 1 });
            }),
          };
        }),
      };
    }),
  } as any));
}

/**
 * Helper to create a large batch of mock pending messages
 */
export function createManyPendingMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    channel: 'email',
    recipient: `user${i}@example.com`,
    subject: 'Follow-up',
    content: 'Content',
  }));
}

/**
 * Helper to create in-app notification test data
 */
export const IN_APP_NOTIFICATION_MESSAGES = [
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
