/**
 * Test Fixtures for useMessageState Hook Tests
 */

import type { Message } from '@/types';

export const mockMessages: Message[] = [
  {
    id: 'msg_1',
    conversation_id: 'conv_123',
    role: 'user',
    content: 'Hello',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'msg_2',
    conversation_id: 'conv_123',
    role: 'assistant',
    content: 'Hi there!',
    created_at: '2025-01-01T00:00:01Z',
  },
];

export const largeMessageList = Array.from({ length: 1000 }, (_, i) => ({
  id: `msg_${i}`,
  conversation_id: 'conv_123',
  role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
  content: `Message ${i}`,
  created_at: new Date().toISOString(),
}));

export const createMockResponse = (messages: Message[]) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => ({ success: true, messages }),
} as Response);

export const createErrorResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
} as Response);

export const createEmptyResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, messages: [] }),
} as Response);
