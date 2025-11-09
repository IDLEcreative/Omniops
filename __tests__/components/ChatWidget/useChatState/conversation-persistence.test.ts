import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import { setupGlobalMocks, cleanupMocks, MockStorage } from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState conversation ID persistence
 *
 * Covers:
 * - Persisting conversation ID to localStorage
 * - Updating localStorage when conversation ID changes
 * - Graceful error handling for localStorage failures
 */
describe('useChatState Hook - Conversation ID Persistence', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should persist conversation ID to localStorage when it changes', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setConversationId('conv-new-123');
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-new-123');
    });
  });

  it('should update localStorage when conversation ID changes', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setConversationId('conv-first');
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-first');
    });

    act(() => {
      result.current.setConversationId('conv-second');
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-second');
    });
  });

  it('should handle localStorage errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };

    (global as any).localStorage = mockStorage;

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setConversationId('conv-123');
    });

    // Should not throw error
    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-123');
    });

    consoleSpy.mockRestore();
  });
});
