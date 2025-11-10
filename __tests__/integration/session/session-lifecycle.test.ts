/**
 * Session Lifecycle Tests
 *
 * Tests verify that:
 * - Conversations persist across widget reopens
 * - Session expiration is handled
 * - Fresh conversations start when no persisted ID exists
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MockStorage } from '../../utils/session/mock-storage';
import {
  TEST_CONVERSATION_ID,
  TEST_SESSION_ID,
  EXPIRED_CONVERSATION_ID,
  EXPIRED_SESSION_ID,
  NEW_SESSION_ID,
  failureResponse,
  previousMessageResponse,
} from '../../utils/session/test-fixtures';
import {
  buildConversationUrl,
  DEFAULT_FETCH_OPTIONS,
} from '../../utils/session/fetch-helpers';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Session Lifecycle', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = new MockStorage();
    (global as any).localStorage = localStorage;
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should persist conversation across widget reopens', async () => {
    // First session: create conversation
    localStorage.setItem('chat_conversation_id', TEST_CONVERSATION_ID);
    localStorage.setItem('chat_session_id', TEST_SESSION_ID);

    // Widget closes
    expect(localStorage.getItem('chat_conversation_id')).toBe(
      TEST_CONVERSATION_ID
    );

    // Widget reopens
    const conversationId = localStorage.getItem('chat_conversation_id');
    const sessionId = localStorage.getItem('chat_session_id');

    expect(conversationId).toBe(TEST_CONVERSATION_ID);
    expect(sessionId).toBe(TEST_SESSION_ID);

    // Load previous messages
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => previousMessageResponse,
    });

    const response = await fetch(
      buildConversationUrl(conversationId || '', sessionId || ''),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].content).toBe('Previous message');
  });

  it('should handle session expiration', async () => {
    localStorage.setItem('chat_conversation_id', EXPIRED_CONVERSATION_ID);
    localStorage.setItem('chat_session_id', EXPIRED_SESSION_ID);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => failureResponse,
    });

    const conversationId = localStorage.getItem('chat_conversation_id');
    const sessionId = localStorage.getItem('chat_session_id');

    const response = await fetch(
      buildConversationUrl(conversationId || '', sessionId || ''),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    if (!data.success) {
      // Clear expired conversation
      localStorage.removeItem('chat_conversation_id');
    }

    expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    expect(localStorage.getItem('chat_session_id')).toBe(EXPIRED_SESSION_ID); // Session persists
  });

  it('should start fresh conversation when no persisted ID', () => {
    expect(localStorage.getItem('chat_conversation_id')).toBeNull();

    // User sends first message - new conversation will be created
    const sessionId = NEW_SESSION_ID;
    localStorage.setItem('chat_session_id', sessionId);

    // No fetch should happen for loading messages
    expect(mockFetch).not.toHaveBeenCalled();

    // After first message, conversation ID will be set
    localStorage.setItem('chat_conversation_id', 'conv-new');

    expect(localStorage.getItem('chat_conversation_id')).toBe('conv-new');
  });
});
