import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';

/**
 * Tests for useChatState hook
 *
 * Focuses on:
 * 1. Conversation ID persistence to localStorage
 * 2. loadPreviousMessages function behavior
 * 3. Loading states during message fetch
 * 4. Error recovery scenarios
 */

// Mock localStorage
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock window.parent
const mockPostMessage = jest.fn();
Object.defineProperty(window, 'parent', {
  writable: true,
  value: {
    postMessage: mockPostMessage,
  },
});

describe('useChatState Hook', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = new MockStorage();
    (global as any).localStorage = localStorage;
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
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

  describe('Conversation ID Persistence', () => {
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

  describe('Loading Previous Messages', () => {
    it('should not load messages without conversation ID', async () => {
      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      // No fetch should occur
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should not load messages without session ID', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.conversationId).toBe('conv-123');
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      // Should not fetch without session ID
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should load messages when widget opens with existing conversation', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', created_at: '2025-01-01T00:01:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: mockMessages,
          conversation: { id: 'conv-123', created_at: '2025-01-01T00:00:00Z' },
          count: 2,
        }),
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
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
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
          )
      );

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
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          messages: [],
          conversation: { id: 'conv-123', created_at: '2025-01-01T00:00:00Z' },
          count: 0,
        }),
      });

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Close and reopen
      act(() => {
        result.current.setIsOpen(false);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      // Should not fetch again
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should use serverUrl from config when provided', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      const serverUrl = 'https://api.example.com';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: [],
          conversation: { id: 'conv-123', created_at: '2025-01-01T00:00:00Z' },
          count: 0,
        }),
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

  describe('Error Recovery', () => {
    it('should clear conversation ID on API error', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          messages: [],
          error: 'Internal server error',
        }),
      });

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      await waitFor(() => {
        expect(localStorage.getItem('chat_conversation_id')).toBeNull();
      });
    });

    it('should clear conversation ID when conversation not found', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-expired');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          messages: [],
          conversation: null,
        }),
      });

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      await waitFor(() => {
        expect(localStorage.getItem('chat_conversation_id')).toBeNull();
      });
    });

    it('should handle network errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      await waitFor(() => {
        expect(localStorage.getItem('chat_conversation_id')).toBeNull();
      });

      await waitFor(() => {
        expect(result.current.loadingMessages).toBe(false);
      });

      consoleErrorSpy.mockRestore();
    });

    it('should reset conversation ID on error', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      mockFetch.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.setIsOpen(true);
      });

      await waitFor(() => {
        expect(result.current.conversationId).toBe('');
      });

      await waitFor(() => {
        expect(localStorage.getItem('chat_conversation_id')).toBeNull();
      });
    });
  });

  describe('Widget Open/Close State', () => {
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

  describe('Message State Management', () => {
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

  describe('Privacy Settings', () => {
    it('should initialize with default privacy settings', () => {
      const { result } = renderHook(() => useChatState({}));

      expect(result.current.privacySettings).toEqual({
        allowOptOut: true,
        showPrivacyNotice: true,
        requireConsent: false,
        consentGiven: false,
        retentionDays: 30,
      });
    });

    it('should accept custom privacy settings', async () => {
      const customSettings = {
        requireConsent: true,
        consentGiven: true,
        retentionDays: 90,
      };

      const { result } = renderHook(() =>
        useChatState({
          privacySettings: customSettings,
        })
      );

      await waitFor(() => {
        expect(result.current.privacySettings.requireConsent).toBe(true);
        expect(result.current.privacySettings.consentGiven).toBe(true);
        expect(result.current.privacySettings.retentionDays).toBe(90);
      });
    });

    it('should handle consent given', async () => {
      const { result } = renderHook(() => useChatState({}));

      await waitFor(() => {
        expect(result.current.mounted).toBe(true);
      });

      act(() => {
        result.current.handleConsent();
      });

      expect(result.current.privacySettings.consentGiven).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'privacy', action: 'giveConsent' },
        '*'
      );
    });
  });
});
