/**
 * Supabase Test Helpers
 *
 * Reusable utilities for testing Supabase-based API routes
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

/**
 * Create Supabase mock with conversation and messages
 */
export const createSupabaseMock = (conversation: unknown = null, messages: unknown[] = []) => {
  const conversationBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: conversation,
      error: conversation ? null : { message: 'Not found' }
    }),
  };

  const messagesBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: messages, error: null }),
  };

  return {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return conversationBuilder;
      }
      if (table === 'messages') {
        return messagesBuilder;
      }
      return conversationBuilder;
    }),
  };
};

/**
 * Create Supabase mock with error on messages fetch
 */
export const createSupabaseMockWithMessagesError = (conversation: unknown, errorMessage: string) => {
  const mockClient = createSupabaseMock(conversation, []);
  const messagesError = { message: errorMessage };

  mockClient.from = jest.fn((table: string) => {
    if (table === 'conversations') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: conversation, error: null }),
      };
    }
    if (table === 'messages') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: messagesError }),
      };
    }
    return {};
  });

  return mockClient;
};

/**
 * Create NextRequest for conversation messages endpoint
 */
export const makeConversationMessagesRequest = (
  conversationId: string,
  sessionId?: string,
  limit?: number
): NextRequest => {
  const url = new URL(`http://localhost:3000/api/conversations/${conversationId}/messages`);
  if (sessionId) url.searchParams.set('session_id', sessionId);
  if (limit) url.searchParams.set('limit', limit.toString());

  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Create mock conversation data
 */
export const createMockConversation = (id: string, sessionId: string) => ({
  id,
  session_id: sessionId,
  created_at: '2025-01-01T00:00:00Z',
});

/**
 * Create mock message data
 */
export const createMockMessage = (id: string, role: 'user' | 'assistant', content: string) => ({
  id,
  role,
  content,
  created_at: '2025-01-01T00:00:00Z',
});

/**
 * Create mock messages array
 */
export const createMockMessages = (count: number) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    messages.push(createMockMessage(
      `msg-${i + 1}`,
      i % 2 === 0 ? 'user' : 'assistant',
      `Message ${i + 1}`
    ));
  }
  return messages;
};
