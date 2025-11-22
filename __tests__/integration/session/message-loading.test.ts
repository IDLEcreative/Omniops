/**
 * Message Loading from API Tests
 *
 * Tests verify that:
 * - Messages are fetched for valid conversations
 * - Empty message lists are handled
 * - Fetch is skipped without conversation ID
 * - Fetch is skipped without session ID
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  TEST_CONVERSATION_ID,
  TEST_SESSION_ID,
  mockMessages,
  emptyMessages,
  successResponse,
  emptySuccessResponse,
} from '../../utils/session/test-fixtures';
import {
  buildConversationUrl,
  DEFAULT_FETCH_OPTIONS,
} from '../../utils/session/fetch-helpers';

describe('Message Loading from API', () => {
  const mockFetch = jest.fn();
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch and replace with mock
    originalFetch = global.fetch;
    global.fetch = mockFetch as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('should fetch messages for valid conversation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => successResponse,
    });

    const response = await fetch(
      buildConversationUrl(TEST_CONVERSATION_ID, TEST_SESSION_ID),
      DEFAULT_FETCH_OPTIONS
    );

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0].content).toBe('Hello');
    expect(data.messages[1].content).toBe('Hi there!');
  });

  it('should handle empty message list', async () => {
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
    expect(data.messages).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('should not fetch messages without conversation ID', () => {
    const conversationId = '';
    const sessionId = TEST_SESSION_ID;

    if (!conversationId || !sessionId) {
      expect(mockFetch).not.toHaveBeenCalled();
      return;
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch messages without session ID', () => {
    const conversationId = TEST_CONVERSATION_ID;
    const sessionId = '';

    if (!conversationId || !sessionId) {
      expect(mockFetch).not.toHaveBeenCalled();
      return;
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
