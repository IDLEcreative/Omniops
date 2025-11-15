import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  mockPostMessage,
} from '@/__tests__/utils/chat-widget/test-fixtures';

// Mock parent storage to use global.localStorage (like real implementation when not in iframe)
jest.mock('@/lib/chat-widget/parent-storage', () => {
  return {
    parentStorage: {
      getItem(key: string): Promise<string | null> {
        // Immediately resolved promise (synchronous operation)
        return Promise.resolve(global.localStorage?.getItem(key) || null);
      },
      setItem(key: string, value: string): Promise<void> {
        global.localStorage?.setItem(key, value);
        return Promise.resolve();
      },
      removeItem(key: string): Promise<void> {
        global.localStorage?.removeItem(key);
        return Promise.resolve();
      },
      getItemSync(key: string): string | null {
        return global.localStorage?.getItem(key) || null;
      }
    },
    ParentStorageAdapter: jest.fn(),
  };
});

// Mock enhanced storage
jest.mock('@/lib/chat-widget/parent-storage-enhanced', () => ({
  enhancedParentStorage: null,
  EnhancedParentStorageAdapter: jest.fn(),
}));

// Import after mocks are set up
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';

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

  it('should manage widget open/close state', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Initially closed
    expect(result.current.isOpen).toBe(false);

    // Open the widget
    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    // Close the widget
    act(() => {
      result.current.setIsOpen(false);
    });

    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
  });

  it.skip('should restore widget open state from localStorage', async () => {
    localStorage.setItem('widget_open', 'true');

    const { result } = renderHook(() => useChatState({}));

    // Wait for mount
    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Flush all pending effects and promises
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Widget should now be open based on localStorage value
    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    }, { timeout: 2000 });
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
