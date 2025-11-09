import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  mockPostMessage,
} from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState widget open/close state
 *
 * Covers:
 * - Persisting widget open state to localStorage
 * - Restoring widget open state from localStorage
 * - Notifying parent window on open/close events
 */
describe('useChatState Hook - Widget Open/Close State', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should persist widget open state to localStorage', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_widget_open')).toBe('true');
    });

    act(() => {
      result.current.setIsOpen(false);
    });

    await waitFor(() => {
      expect(localStorage.getItem('chat_widget_open')).toBe('false');
    });
  });

  it('should restore widget open state from localStorage', async () => {
    localStorage.setItem('chat_widget_open', 'true');

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });
  });

  it('should notify parent window on open/close', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'widgetOpened' }, '*');
    });

    act(() => {
      result.current.setIsOpen(false);
    });

    await waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'widgetClosed' }, '*');
    });
  });
});
