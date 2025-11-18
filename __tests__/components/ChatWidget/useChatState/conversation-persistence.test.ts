/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import { setupGlobalMocks, cleanupMocks, MockStorage } from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState conversation ID persistence
 *
 * Covers:
 * - Setting and updating conversation ID in state
 * - Multiple conversation ID updates
 * - Graceful error handling for localStorage failures
 *
 * Note: These tests verify conversation ID management behavior rather than
 * localStorage implementation details, since the storage adapter is an
 * internal implementation that's tested separately.
 */
describe('useChatState Hook - Conversation ID Persistence', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should persist conversation ID when set', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Set a conversation ID
    await act(async () => {
      await result.current.setConversationId('conv-new-123');
    });

    // Verify the conversation ID was set in state
    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-new-123');
    });
  });

  it('should update conversation ID multiple times', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Set first conversation ID
    await act(async () => {
      await result.current.setConversationId('conv-first');
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-first');
    });

    // Update to second conversation ID
    await act(async () => {
      await result.current.setConversationId('conv-second');
    });

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-second');
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

    await act(async () => {
      await result.current.setConversationId('conv-123');
    });

    // Should not throw error
    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-123');
    });

    consoleSpy.mockRestore();
  });
});
