import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  mockFetch,
  createErrorResponse,
  createNotFoundResponse,
} from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState error recovery
 *
 * Covers:
 * - Clearing conversation ID on API errors
 * - Clearing conversation ID when conversation not found
 * - Graceful network error handling
 * - Conversation ID reset on fetch failures
 */
describe('useChatState Hook - Error Recovery', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should clear conversation ID on API error', async () => {
    localStorage.setItem('chat_conversation_id', 'conv-123');
    localStorage.setItem('chat_session_id', 'sess-456');

    mockFetch.mockResolvedValueOnce(createErrorResponse(500, 'Internal server error'));

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });
  });

  it('should clear conversation ID when conversation not found', async () => {
    localStorage.setItem('chat_conversation_id', 'conv-expired');
    localStorage.setItem('chat_session_id', 'sess-456');

    mockFetch.mockResolvedValueOnce(createNotFoundResponse());

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });
  });

  it('should handle network errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    localStorage.setItem('chat_conversation_id', 'conv-123');
    localStorage.setItem('chat_session_id', 'sess-456');

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.loadingMessages).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it('should reset conversation ID on error', async () => {
    localStorage.setItem('chat_conversation_id', 'conv-123');
    localStorage.setItem('chat_session_id', 'sess-456');

    mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('');
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });
  });
});
