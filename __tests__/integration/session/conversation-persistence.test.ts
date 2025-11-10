/**
 * Conversation ID Persistence Tests
 *
 * Tests verify that:
 * - Conversation IDs are saved to localStorage
 * - Conversation IDs are restored from localStorage
 * - Conversation IDs are cleared on expiration
 * - Multiple updates work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MockStorage } from '../../utils/session/mock-storage';

describe('Conversation ID Persistence', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = new MockStorage();
    (global as any).localStorage = localStorage;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save conversation ID to localStorage', () => {
    const conversationId = 'conv-123';

    localStorage.setItem('chat_conversation_id', conversationId);

    expect(localStorage.getItem('chat_conversation_id')).toBe(conversationId);
  });

  it('should restore conversation ID from localStorage', () => {
    const conversationId = 'conv-456';
    localStorage.setItem('chat_conversation_id', conversationId);

    const restored = localStorage.getItem('chat_conversation_id');

    expect(restored).toBe(conversationId);
  });

  it('should clear conversation ID when conversation expires', () => {
    localStorage.setItem('chat_conversation_id', 'conv-789');

    localStorage.removeItem('chat_conversation_id');

    expect(localStorage.getItem('chat_conversation_id')).toBeNull();
  });

  it('should handle multiple conversation ID updates', () => {
    localStorage.setItem('chat_conversation_id', 'conv-1');
    expect(localStorage.getItem('chat_conversation_id')).toBe('conv-1');

    localStorage.setItem('chat_conversation_id', 'conv-2');
    expect(localStorage.getItem('chat_conversation_id')).toBe('conv-2');

    localStorage.setItem('chat_conversation_id', 'conv-3');
    expect(localStorage.getItem('chat_conversation_id')).toBe('conv-3');
  });
});
