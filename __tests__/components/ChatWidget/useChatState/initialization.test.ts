import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import { setupGlobalMocks, cleanupMocks, MockStorage } from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState hook initialization
 *
 * Covers:
 * - Default state values
 * - Session ID generation
 * - Session ID restoration from localStorage
 * - Conversation ID restoration from localStorage
 */
describe('useChatState Hook - Initialization', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatState({}));

    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMessages).toBe(false);
    expect(result.current.conversationId).toBe('');
    expect(result.current.sessionId).toBe('');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.mounted).toBe(false);
  });

  it('should generate session ID on mount', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.sessionId).not.toBe('');
    });

    expect(result.current.sessionId).toMatch(/^session_/);
  });

  it('should restore session ID from localStorage', async () => {
    const existingSessionId = 'session_existing_123';
    localStorage.setItem('chat_session_id', existingSessionId);

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.sessionId).toBe(existingSessionId);
    });
  });

  it('should restore conversation ID from localStorage', async () => {
    const existingConversationId = 'conv-existing-456';
    localStorage.setItem('chat_conversation_id', existingConversationId);

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.conversationId).toBe(existingConversationId);
    });
  });
});
