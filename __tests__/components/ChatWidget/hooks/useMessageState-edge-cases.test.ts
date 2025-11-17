import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMessageState } from '@/components/ChatWidget/hooks/useMessageState';
import { createMockStorage } from '@/__tests__/utils/chat-widget/session-management-helpers';
import { mockMessages, createMockResponse, largeMessageList } from './fixtures/useMessageState-fixtures';
import { loadMessagesAndWait } from './helpers/useMessageState-helpers';

/**
 * useMessageState Hook - Edge Cases
 * Tests production/development logging, state setters, and edge cases
 */

describe('useMessageState Hook - Edge Cases', () => {
  let mockStorage: any;
  let mockFetch: jest.SpiedFunction<typeof global.fetch>;
  let originalEnv: string | undefined;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    mockStorage = createMockStorage();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue(createMockResponse(mockMessages));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    mockFetch.mockRestore();
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Production vs Development Logging', () => {
    it('should log in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useMessageState] 📦 Loaded previous messages from DB'),
        expect.any(Object)
      );
    });

    it('should log in production mode (logging is not gated by NODE_ENV)', async () => {
      process.env.NODE_ENV = 'production';

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');

      // NOTE: Most logging in useMessageState is not gated by NODE_ENV
      // Only specific logs (like "No messages found") check for development mode
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useMessageState] 📦 Loaded previous messages from DB'),
        expect.any(Object)
      );
    });
  });

  describe('Input State Management', () => {
    it('should update input state correctly', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.input).toBe('');

      act(() => {
        result.current.setInput('Hello world');
      });

      expect(result.current.input).toBe('Hello world');
    });

    it('should allow setInput to work as expected', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      act(() => {
        result.current.setInput('Test message');
      });

      expect(result.current.input).toBe('Test message');

      act(() => {
        result.current.setInput('');
      });

      expect(result.current.input).toBe('');
    });
  });

  describe('Message State Setters', () => {
    it('should allow direct message manipulation via setMessages', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      const newMessages = [{
        id: 'msg_new',
        conversation_id: 'conv_123',
        role: 'user' as const,
        content: 'New message',
        created_at: new Date().toISOString(),
      }];

      act(() => {
        result.current.setMessages(newMessages);
      });

      expect(result.current.messages).toEqual(newMessages);
    });

    it('should allow loading state manipulation', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null conversationId gracefully', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: null as any,
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await act(async () => {
        await result.current.loadPreviousMessages(null as any, 'session_456');
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle very large message lists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, messages: largeMessageList }),
      } as Response);

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, 'conv_123', 'session_456');
      expect(result.current.messages).toHaveLength(1000);
    });

    it('should handle special characters in IDs', async () => {
      const specialConvId = 'conv_with_special-chars.!@#$%^&*()';
      const specialSessionId = 'session_123_äöü_€';

      const { result } = renderHook(() =>
        useMessageState({
          conversationId: specialConvId,
          sessionId: specialSessionId,
          storage: mockStorage,
        })
      );

      await loadMessagesAndWait(result, specialConvId, specialSessionId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(specialConvId),
        expect.any(Object)
      );
    });

    it('should handle rapid consecutive calls', async () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      await act(async () => {
        const promise1 = result.current.loadPreviousMessages('conv_123', 'session_456');
        const promise2 = result.current.loadPreviousMessages('conv_123', 'session_456');
        const promise3 = result.current.loadPreviousMessages('conv_123', 'session_456');
        await Promise.all([promise1, promise2, promise3]);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Container Ref', () => {
    it('should properly initialize messagesContainerRef', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      expect(result.current.messagesContainerRef).toBeDefined();
      expect(result.current.messagesContainerRef.current).toBeNull();
    });

    it('should allow ref to be attached to DOM element', () => {
      const { result } = renderHook(() =>
        useMessageState({
          conversationId: 'conv_123',
          sessionId: 'session_456',
          storage: mockStorage,
        })
      );

      const div = document.createElement('div');

      if (result.current.messagesContainerRef) {
        (result.current.messagesContainerRef as any).current = div;
      }

      expect(result.current.messagesContainerRef.current).toBe(div);
    });
  });
});
