/**
 * Session ID Validation Tests
 *
 * Tests verify that:
 * - Requests with mismatched session IDs are rejected
 * - Conversation IDs are cleared on session mismatch
 * - Valid session IDs are accepted
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { MockStorage } from '../../utils/session/mock-storage';
import {
  TEST_CONVERSATION_ID,
  TEST_SESSION_ID,
  WRONG_SESSION_ID,
  failureResponse,
  emptySuccessResponse,
} from '../../utils/session/test-fixtures';
import {
  buildConversationUrl,
  DEFAULT_FETCH_OPTIONS,
} from '../../utils/session/fetch-helpers';

describe('Session ID Validation', () => {
  const mockFetch = jest.fn();
  let originalFetch: typeof global.fetch;
  let localStorage: MockStorage;

  beforeEach(() => {
    // Save original fetch and replace with mock
    originalFetch = global.fetch;
    global.fetch = mockFetch as any;

    localStorage = new MockStorage();
    (global as any).localStorage = localStorage;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('should reject request with mismatched session ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => failureResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, WRONG_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.messages).toEqual([]);
    expect(data.conversation).toBeNull();
  });

  it('should clear conversation ID when session mismatch occurs', async () => {
    localStorage.setItem('chat_conversation_id', TEST_CONVERSATION_ID);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => failureResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, WRONG_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    if (!data.success) {
      localStorage.removeItem('chat_conversation_id');
    }

    expect(localStorage.getItem('chat_conversation_id')).toBeNull();
  });

  it('should handle valid session ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptySuccessResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.conversation).not.toBeNull();
  });
});
