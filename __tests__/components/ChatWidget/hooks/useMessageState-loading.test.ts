import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessageState } from '@/components/ChatWidget/hooks/useMessageState';
import type { ChatWidgetConfig } from '@/components/ChatWidget/hooks/useChatState';
import { createMockStorage } from '@/__tests__/utils/chat-widget/session-management-helpers';
import { mockMessages, createMockResponse, createEmptyResponse, createErrorResponse } from './fixtures/useMessageState-fixtures';
import { loadMessagesAndWait, type UseMessageStateParams } from './helpers/useMessageState-helpers';

/**
 * useMessageState Hook - Loading Tests
 * Tests message loading, API handling, and loading states
 */

describe('useMessageState Hook - Loading', () => {
  let mockStorage: any;
  let mockFetch: jest.SpiedFunction<typeof global.fetch>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(createMockResponse(mockMessages));
  });

  afterEach(() => {
    mockFetch.mockRestore();
    jest.clearAllMocks();
  });

  describe('Message Loading', () => {
    it('should load previous messages when conversationId and sessionId provided', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.messages).toEqual([]);
      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messages).toEqual(mockMessages);
    });

    it('should start with empty messages if no previous conversation', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: '',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.messages).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should prevent duplicate loading', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.loadPreviousMessages('conv_123', 'session_456');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use serverUrl from config if available', async () => {
      const config: ChatWidgetConfig = {
        serverUrl: 'https://example.com',
        appearance: { primaryColor: '#000' },
      };

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          demoConfig: config,
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/conversations/conv_123/messages?session_id=session_456',
        expect.any(Object)
      );
    });

    it('should not load if conversationId is empty', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: '',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await act(async () => {
        await result.current.loadPreviousMessages('', 'session_456');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not load if sessionId is empty', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: '',
          storage: mockStorage,
        })
      );

      await act(async () => {
        await result.current.loadPreviousMessages('conv_123', '');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('API Response Handling', () => {
    it('should handle successful API response with messages', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.messagesLoadError).toBeNull();
    });

    it('should handle empty messages response', async () => {
      mockFetch.mockResolvedValueOnce(createEmptyResponse());

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messages).toEqual([]);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('conversation_id');
    });

    it('should handle non-200 status codes', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse(500, 'Internal Server Error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messagesLoadError).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messagesLoadError).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should set loadingMessages true during fetch', async () => {
      let resolvePromise: (value: Response) => void;
      mockFetch.mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.loadingMessages).toBe(false);

      act(() => {
        void result.current.loadPreviousMessages('conv_123', 'session_456');
      });

      await waitFor(() => {
        expect(result.current.loadingMessages).toBe(true);
      });

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, messages: mockMessages }),
        } as Response);
      });
    });

    it('should set loadingMessages false after success', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.loadingMessages).toBe(false);
    });

    it('should set loadingMessages false after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.loadingMessages).toBe(false);
    });
  });
});
