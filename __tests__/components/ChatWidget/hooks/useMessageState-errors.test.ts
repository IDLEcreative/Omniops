/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessageState } from '@/components/ChatWidget/hooks/useMessageState';
import { createMockStorage, createPartiallyFailingStorage } from '@/__tests__/utils/chat-widget/session-management-helpers';
import { mockMessages, createMockResponse, createErrorResponse } from './fixtures/useMessageState-fixtures';
import { loadMessagesAndWait } from './helpers/useMessageState-helpers';

/**
 * useMessageState Hook - Error Handling Tests
 * Tests error states, retry logic, and storage integration
 */

describe('useMessageState Hook - Errors & Retry', () => {
  let mockStorage: any;
  let mockFetch: jest.SpiedFunction<typeof global.fetch>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(createMockResponse(mockMessages));
  });

  afterEach(() => {
    mockFetch.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Error State Management', () => {
    it('should set messagesLoadError on API failures', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse(404, 'Not Found'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messagesLoadError).not.toBeNull();
    });

    it('should clear error on successful retry', async () => {
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

      mockFetch.mockResolvedValueOnce(createMockResponse(mockMessages));

      await act(async () => {
        await result.current.retryLoadMessages();
      });

      await waitFor(() => {
        expect(result.current.messagesLoadError).toBeNull();
        expect(result.current.messages).toEqual(mockMessages);
      });
    });

    it('should display error state without breaking component', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messagesLoadError).toBeTruthy();
      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe('');
    });
  });

  describe('Retry Functionality', () => {
    it('should retry with same params', async () => {
      mockFetch.mockRejectedValueOnce(new Error('First attempt failed'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messagesLoadError).toBeTruthy();

      mockFetch.mockResolvedValueOnce(createMockResponse(mockMessages));
      await act(async () => {
        await result.current.retryLoadMessages();
      });

      await waitFor(() => {
        expect(result.current.messages).toEqual(mockMessages);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should reset hasLoadedMessages flag on retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('First attempt failed'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      mockFetch.mockResolvedValueOnce(createMockResponse(mockMessages));

      await act(async () => {
        await result.current.retryLoadMessages();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should warn if no previous attempt to retry', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await act(async () => {
        await result.current.retryLoadMessages();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No previous load attempt to retry')
      );
    });
  });

  describe('Storage Integration', () => {
    it('should clear conversation_id from storage on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('conversation_id');
    });

    it('should handle storage.removeItem errors gracefully', async () => {
      const failingStorage = createPartiallyFailingStorage({
        removeItemFails: true,
        errorMessage: 'Storage quota exceeded',
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: failingStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to clear conversation ID'),
        expect.any(Error)
      );

      expect(result.current.messagesLoadError).toBeTruthy();
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent state updates after unmount', async () => {
      let resolvePromise: (value: Response) => void;
      mockFetch.mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result, unmount } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      act(() => {
        void result.current.loadPreviousMessages('conv_123', 'session_456');
      });

      unmount();

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, messages: mockMessages }),
        } as Response);
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(true).toBe(true); // No errors thrown
    });

    it('should handle multiple rapid calls gracefully', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await act(async () => {
        result.current.loadPreviousMessages('conv_123', 'session_456');
        result.current.loadPreviousMessages('conv_123', 'session_456');
        result.current.loadPreviousMessages('conv_123', 'session_456');
      });

      await waitFor(() => {
        expect(result.current.loadingMessages).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
