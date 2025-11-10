/**
 * Test Data Builders for Phase 3 Enhancements
 *
 * Provides reusable mock data factories for all Phase 3 integration tests.
 * Centralized here to maintain consistency across test suites.
 */

import { Message } from '@/types/database';

/**
 * Creates a mock message with default values
 */
export const createMockMessage = (
  id: string,
  role: 'user' | 'assistant',
  content: string,
  createdAt: Date = new Date()
): Message => ({
  id,
  conversation_id: 'conv-1',
  role,
  content,
  created_at: createdAt.toISOString(),
});

/**
 * Creates a full mock conversation with N messages
 * Messages alternate between user and assistant, 2 seconds apart
 */
export const createMockConversation = (messageCount: number): Message[] => {
  const messages: Message[] = [];
  const baseTime = new Date('2025-01-01T10:00:00Z');

  for (let i = 0; i < messageCount; i++) {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    const time = new Date(baseTime.getTime() + i * 2000);
    messages.push(
      createMockMessage(
        `msg-${i}`,
        role,
        `Message ${i} from ${role}`,
        time
      )
    );
  }

  return messages;
};

/**
 * Creates a mock message with metadata (for product/topic testing)
 */
export const createMockMessageWithMetadata = (
  id: string,
  role: 'user' | 'assistant',
  content: string,
  metadata: Record<string, any> = {}
): Message => ({
  ...createMockMessage(id, role, content),
  metadata,
});
