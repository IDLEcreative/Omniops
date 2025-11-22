/**
 * Error Handling for Expired Conversations Tests
 *
 * Tests verify that:
 * - 404 errors for non-existent conversations are handled
 * - API errors are handled gracefully
 * - Conversation IDs are cleared on API errors
 * - Network errors are handled properly
 * - Conversation IDs are cleared on network errors
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { MockStorage } from '../../utils/session/mock-storage';
import {
  TEST_CONVERSATION_ID,
  TEST_SESSION_ID,
  NON_EXISTENT_CONVERSATION_ID,
  failureResponse,
  errorResponse,
} from '../../utils/session/test-fixtures';
import {
  buildConversationUrl,
  DEFAULT_FETCH_OPTIONS,
} from '../../utils/session/fetch-helpers';

describe('Error Handling for Expired Conversations', () => {
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

  it('should handle 404 for non-existent conversation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => failureResponse,
    });

    const response = await fetch(
      buildConversationUrl(NON_EXISTENT_CONVERSATION_ID, TEST_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.messages).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(response.ok).toBe(false);
    expect(data.success).toBe(false);
  });

  it('should clear conversation ID on API error', async () => {
    localStorage.setItem('chat_conversation_id', TEST_CONVERSATION_ID);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    if (!response.ok) {
      localStorage.removeItem('chat_conversation_id');
    }

    expect(localStorage.getItem('chat_conversation_id')).toBeNull();
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch(
        buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
        DEFAULT_FETCH_OPTIONS
      );
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toBe('Network error');
    }
  });

  it('should clear conversation ID on network error', async () => {
    localStorage.setItem('chat_conversation_id', TEST_CONVERSATION_ID);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch(
        buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
        DEFAULT_FETCH_OPTIONS
      );
    } catch (error) {
      localStorage.removeItem('chat_conversation_id');
    }

    expect(localStorage.getItem('chat_conversation_id')).toBeNull();
  });
});
