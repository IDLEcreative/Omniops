import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import { setupGlobalMocks, cleanupMocks, MockStorage } from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState message state management
 *
 * Covers:
 * - Updating messages array
 * - Clearing messages
 */
describe('useChatState Hook - Message State Management', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should update messages array', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setMessages([
        { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Test', created_at: '2025-01-01T00:00:00Z' },
      ]);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Test');
  });

  it('should clear messages', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setMessages([
        { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Test', created_at: '2025-01-01T00:00:00Z' },
      ]);
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.setMessages([]);
    });

    expect(result.current.messages).toHaveLength(0);
  });
});
