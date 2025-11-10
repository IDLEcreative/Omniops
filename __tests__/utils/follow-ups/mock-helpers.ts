/**
 * Mock Helpers for Follow-up Tests
 *
 * Provides reusable mock data and setup functions for follow-up detector tests.
 * Extracted to reduce main test file LOC.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface MockConversation {
  id: string;
  session_id: string;
  created_at?: string;
  metadata?: Record<string, any>;
  messages: Array<{
    id?: string;
    role?: string;
    created_at: string;
    content?: string;
  }>;
}

/**
 * Creates mock abandoned conversation data
 */
export const createAbandonedConversation = (): MockConversation => ({
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
    },
    {
      id: 'msg-2',
      role: 'assistant',
      created_at: '2024-01-01T10:25:00Z',
      content: 'Hello!',
    },
  ],
});

/**
 * Creates mock low-satisfaction conversation with negative sentiment
 */
export const createLowSatisfactionConversation = (): MockConversation => ({
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
});

/**
 * Creates mock conversation with cart abandonment indicators
 */
export const createCartAbandonmentConversation = (): MockConversation => ({
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
  messages: [{ id: 'msg-1', created_at: '2024-01-01T10:00:00Z' }],
});

/**
 * Creates mock conversation with completed checkout (no abandonment)
 */
export const createCompletedCheckoutConversation = (): MockConversation => ({
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
});

/**
 * Creates mock conversation with too few messages (should be skipped)
 */
export const createTooFewMessagesConversation = (): MockConversation => ({
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
});

/**
 * Creates mock conversation with nested email metadata
 */
export const createNestedEmailConversation = (): MockConversation => ({
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
});

/**
 * Creates mock conversation with direct email metadata
 */
export const createDirectEmailConversation = (): MockConversation => ({
  id: 'conv-7',
  session_id: 'session-7',
  metadata: {
    customer_email: 'direct@example.com',
  },
  messages: [
    { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Question' },
    { role: 'assistant', created_at: '2024-01-01T10:01:00Z', content: 'Answer' },
  ],
});

/**
 * Creates mock conversation with positive sentiment
 */
export const createHighSatisfactionConversation = (): MockConversation => ({
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
});

/**
 * Creates mock conversation with multiple attempts already sent
 */
export const createConversationWithAttempts = (): MockConversation => ({
  id: 'conv-5',
  session_id: 'session-5',
  metadata: {},
  messages: [
    { role: 'user', created_at: '2024-01-01T10:00:00Z', content: 'Help' },
    { role: 'assistant', created_at: '2024-01-01T10:01:00Z', content: 'Hi' },
  ],
});

/**
 * Sets up mock Supabase client with configurable behavior
 *
 * Handles different query patterns:
 * - gte().limit() - Returns data for low-satisfaction queries
 * - Direct limit() - Returns data for abandoned queries
 */
export function setupMockSupabase(
  conversationData: MockConversation[] = [],
  followUpLogCount: number = 0,
  options?: { splitDataByQueryPath?: boolean }
): jest.Mocked<SupabaseClient> {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  } as any;

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'conversations') {
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: conversationData }),
        }),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: options?.splitDataByQueryPath ? [] : conversationData
        }),
      } as any;
    }
    if (table === 'follow_up_logs') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: followUpLogCount }),
      } as any;
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 0 }),
    } as any;
  });

  return mockSupabase;
}
