/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  MockParentStorage,
  mockFetch,
  mockMessages,
  createSuccessResponse,
} from '@/__tests__/utils/chat-widget/test-fixtures';

// Mock the parent storage module
jest.mock('@/lib/chat-widget/parent-storage', () => {
  const { MockStorage, MockParentStorage } = jest.requireActual<typeof import('@/__tests__/utils/chat-widget/test-fixtures')>('@/__tests__/utils/chat-widget/test-fixtures');
  const storage = new MockStorage();
  const adapter = new MockParentStorage(storage);
  return {
    parentStorage: adapter,
    ParentStorageAdapter: jest.fn(() => adapter),
  };
});

// Mock enhanced storage
jest.mock('@/lib/chat-widget/parent-storage-enhanced', () => ({
  enhancedParentStorage: null,
  EnhancedParentStorageAdapter: jest.fn(),
}));

// Now we can import the hook after mocks are set up
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';

/**
 * Tests for useChatState loading previous messages
 *
 * Covers:
 * - Preventing message load without conversation ID
 * - Preventing message load without session ID
 * - Loading messages when widget opens
 * - Loading state management
 * - Preventing duplicate loads
 * - Custom server URL handling
 *
 * FIXED: Infinite loop resolved by using useRef pattern in useParentCommunication hook.
 * The handleMessage callback is now stored in a ref and updated independently of the
 * event listener registration, preventing infinite useEffect loops.
 */
describe('useChatState Hook - Loading Previous Messages', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should not load messages without conversation ID', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    // Widget config endpoint should be called, but not messages endpoint
    await waitFor(() => {
      const messagesCalls = mockFetch.mock.calls.filter((call: any) =>
        call[0]?.includes('/api/conversations')
      );
      expect(messagesCalls.length).toBe(0);
    });
  });

  it('should not load messages without session ID', async () => {
    localStorage.setItem('conversation_id', 'conv-123');

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.conversationId).toBe('conv-123');
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    // Widget config endpoint should be called, but not messages endpoint
    const messagesCalls = mockFetch.mock.calls.filter((call: any) =>
      call[0]?.includes('/api/conversations')
    );
    expect(messagesCalls.length).toBe(0);
  });

  it('should load messages when widget opens with existing conversation', async () => {
    localStorage.setItem('conversation_id', 'conv-123');
    localStorage.setItem('session_id', 'sess-456');

    // Override default mock to handle both widget config and messages endpoints
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/widget/config')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            config: { domain: 'test.example.com', woocommerce_enabled: false },
          }),
        });
      }
      if (url.includes('/api/conversations/conv-123/messages')) {
        return Promise.resolve(createSuccessResponse(mockMessages));
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
      expect(result.current.sessionId).toBe('sess-456');
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/conversations/conv-123/messages'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
  });

  it('should set loading state while fetching messages', async () => {
    localStorage.setItem('conversation_id', 'conv-123');
    localStorage.setItem('session_id', 'sess-456');

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/widget/config')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            config: { domain: 'test.example.com', woocommerce_enabled: false },
          }),
        });
      }
      if (url.includes('/api/conversations/conv-123/messages')) {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  messages: [],
                  conversation: { id: 'conv-123', created_at: '2025-01-01T00:00:00Z' },
                  count: 0,
                }),
              }),
            100
          )
        );
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(result.current.loadingMessages).toBe(true);
    });

    await waitFor(
      () => {
        expect(result.current.loadingMessages).toBe(false);
      },
      { timeout: 200 }
    );
  });

  it('should only load messages once', async () => {
    localStorage.setItem('conversation_id', 'conv-123');
    localStorage.setItem('session_id', 'sess-456');

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/widget/config')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            config: { domain: 'test.example.com', woocommerce_enabled: false },
          }),
        });
      }
      if (url.includes('/api/conversations/conv-123/messages')) {
        return Promise.resolve(createSuccessResponse([]));
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Track calls to messages endpoint only
    const messagesCalls = () =>
      mockFetch.mock.calls.filter((call: any) =>
        call[0]?.includes('/api/conversations/conv-123/messages')
      ).length;

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(messagesCalls()).toBe(1);
    });

    // Close and reopen
    act(() => {
      result.current.setIsOpen(false);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    // Should not fetch messages again
    await waitFor(() => {
      expect(messagesCalls()).toBe(1);
    });
  });

  it('should use serverUrl from config when provided', async () => {
    localStorage.setItem('conversation_id', 'conv-123');
    localStorage.setItem('session_id', 'sess-456');

    const serverUrl = 'https://api.example.com';

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/widget/config')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            config: { domain: 'test.example.com', woocommerce_enabled: false },
          }),
        });
      }
      if (url.includes('/api/conversations/conv-123/messages')) {
        return Promise.resolve(createSuccessResponse([]));
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    const { result } = renderHook(() =>
      useChatState({
        demoConfig: { serverUrl },
      })
    );

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${serverUrl}/api/conversations/conv-123/messages`),
        expect.any(Object)
      );
    });
  });
});
