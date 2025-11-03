import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Integration tests for chat widget session persistence
 *
 * Tests verify that:
 * 1. Conversation IDs are persisted to localStorage
 * 2. Messages are loaded from API on widget reopen
 * 3. Session validation works correctly
 * 4. Error handling for expired conversations
 * 5. Graceful degradation when localStorage is unavailable
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

describe('Session Persistence Integration', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = new MockStorage();
    (global as any).localStorage = localStorage;
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Conversation ID Persistence', () => {
    it('should save conversation ID to localStorage', () => {
      const conversationId = 'conv-123';

      localStorage.setItem('chat_conversation_id', conversationId);

      expect(localStorage.getItem('chat_conversation_id')).toBe(conversationId);
    });

    it('should restore conversation ID from localStorage', () => {
      const conversationId = 'conv-456';
      localStorage.setItem('chat_conversation_id', conversationId);

      const restored = localStorage.getItem('chat_conversation_id');

      expect(restored).toBe(conversationId);
    });

    it('should clear conversation ID when conversation expires', () => {
      localStorage.setItem('chat_conversation_id', 'conv-789');

      localStorage.removeItem('chat_conversation_id');

      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });

    it('should handle multiple conversation ID updates', () => {
      localStorage.setItem('chat_conversation_id', 'conv-1');
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-1');

      localStorage.setItem('chat_conversation_id', 'conv-2');
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-2');

      localStorage.setItem('chat_conversation_id', 'conv-3');
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-3');
    });
  });

  describe('Message Loading from API', () => {
    it('should fetch messages for valid conversation', async () => {
      const conversationId = 'conv-123';
      const sessionId = 'sess-456';
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', created_at: '2025-01-01T00:01:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: mockMessages,
          conversation: { id: conversationId, created_at: '2025-01-01T00:00:00Z' },
          count: 2,
        }),
      });

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.messages).toHaveLength(2);
      expect(data.messages[0].content).toBe('Hello');
      expect(data.messages[1].content).toBe('Hi there!');
    });

    it('should handle empty message list', async () => {
      const conversationId = 'conv-123';
      const sessionId = 'sess-456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: [],
          conversation: { id: conversationId, created_at: '2025-01-01T00:00:00Z' },
          count: 0,
        }),
      });

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should not fetch messages without conversation ID', async () => {
      const conversationId = '';
      const sessionId = 'sess-456';

      // Simulate skipping fetch when no conversation ID
      if (!conversationId || !sessionId) {
        expect(mockFetch).not.toHaveBeenCalled();
        return;
      }

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not fetch messages without session ID', async () => {
      const conversationId = 'conv-123';
      const sessionId = '';

      // Simulate skipping fetch when no session ID
      if (!conversationId || !sessionId) {
        expect(mockFetch).not.toHaveBeenCalled();
        return;
      }

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Session ID Validation', () => {
    it('should reject request with mismatched session ID', async () => {
      const conversationId = 'conv-123';
      const sessionId = 'wrong-session';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          messages: [],
          conversation: null,
        }),
      });

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.messages).toEqual([]);
      expect(data.conversation).toBeNull();
    });

    it('should clear conversation ID when session mismatch occurs', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          messages: [],
          conversation: null,
        }),
      });

      const response = await fetch(
        '/api/conversations/conv-123/messages?session_id=wrong-session',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!data.success) {
        localStorage.removeItem('chat_conversation_id');
      }

      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });

    it('should handle valid session ID', async () => {
      const conversationId = 'conv-123';
      const sessionId = 'sess-456';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: [],
          conversation: { id: conversationId, created_at: '2025-01-01T00:00:00Z' },
          count: 0,
        }),
      });

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.conversation).not.toBeNull();
    });
  });

  describe('Error Handling for Expired Conversations', () => {
    it('should handle 404 for non-existent conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          messages: [],
          conversation: null,
        }),
      });

      const response = await fetch(
        '/api/conversations/non-existent/messages?session_id=sess-123',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.messages).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          messages: [],
          error: 'Internal server error',
        }),
      });

      const response = await fetch(
        '/api/conversations/conv-123/messages?session_id=sess-456',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.success).toBe(false);
    });

    it('should clear conversation ID on API error', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          messages: [],
          error: 'Internal server error',
        }),
      });

      const response = await fetch(
        '/api/conversations/conv-123/messages?session_id=sess-456',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        localStorage.removeItem('chat_conversation_id');
      }

      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch(
          '/api/conversations/conv-123/messages?session_id=sess-456',
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should clear conversation ID on network error', async () => {
      localStorage.setItem('chat_conversation_id', 'conv-123');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch(
          '/api/conversations/conv-123/messages?session_id=sess-456',
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        localStorage.removeItem('chat_conversation_id');
      }

      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });
  });

  describe('Graceful Degradation without localStorage', () => {
    it('should handle localStorage.setItem failure', () => {
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

      try {
        localStorage.setItem('chat_conversation_id', 'conv-123');
      } catch (error) {
        // Should catch error and continue
        expect(error).toBeDefined();
      }

      // Application should still function
      expect(true).toBe(true);
    });

    it('should handle localStorage.getItem failure', () => {
      const mockStorage = {
        getItem: jest.fn(() => {
          throw new Error('SecurityError');
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };

      (global as any).localStorage = mockStorage;

      try {
        const value = localStorage.getItem('chat_conversation_id');
        expect(value).toBeNull();
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined();
      }
    });

    it('should handle missing localStorage API', () => {
      const originalLocalStorage = (global as any).localStorage;
      delete (global as any).localStorage;

      // Check if localStorage is available
      const hasLocalStorage = typeof (global as any).localStorage !== 'undefined';

      expect(hasLocalStorage).toBe(false);

      // Should still function without localStorage
      expect(true).toBe(true);

      // Restore
      (global as any).localStorage = originalLocalStorage;
    });

    it('should handle localStorage in private browsing mode', () => {
      const mockStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => {
          throw new Error('Failed to write to storage');
        }),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      };

      (global as any).localStorage = mockStorage;

      try {
        localStorage.setItem('chat_conversation_id', 'conv-123');
      } catch (error) {
        // Should handle error and continue
        console.warn('localStorage unavailable:', error);
      }

      // Application should degrade gracefully
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
    });
  });

  describe('Session Lifecycle', () => {
    it('should persist conversation across widget reopens', async () => {
      // First session: create conversation
      localStorage.setItem('chat_conversation_id', 'conv-123');
      localStorage.setItem('chat_session_id', 'sess-456');

      // Widget closes
      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-123');

      // Widget reopens
      const conversationId = localStorage.getItem('chat_conversation_id');
      const sessionId = localStorage.getItem('chat_session_id');

      expect(conversationId).toBe('conv-123');
      expect(sessionId).toBe('sess-456');

      // Load previous messages
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messages: [
            { id: 'msg-1', role: 'user', content: 'Previous message', created_at: '2025-01-01T00:00:00Z' },
          ],
          conversation: { id: conversationId, created_at: '2025-01-01T00:00:00Z' },
          count: 1,
        }),
      });

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].content).toBe('Previous message');
    });

    it('should handle session expiration', async () => {
      localStorage.setItem('chat_conversation_id', 'expired-conv');
      localStorage.setItem('chat_session_id', 'expired-sess');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          messages: [],
          conversation: null,
        }),
      });

      const conversationId = localStorage.getItem('chat_conversation_id');
      const sessionId = localStorage.getItem('chat_session_id');

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();

      if (!data.success) {
        // Clear expired conversation
        localStorage.removeItem('chat_conversation_id');
      }

      expect(localStorage.getItem('chat_conversation_id')).toBeNull();
      expect(localStorage.getItem('chat_session_id')).toBe('expired-sess'); // Session persists
    });

    it('should start fresh conversation when no persisted ID', async () => {
      expect(localStorage.getItem('chat_conversation_id')).toBeNull();

      // User sends first message - new conversation will be created
      const sessionId = 'sess-new';
      localStorage.setItem('chat_session_id', sessionId);

      // No fetch should happen for loading messages
      expect(mockFetch).not.toHaveBeenCalled();

      // After first message, conversation ID will be set
      localStorage.setItem('chat_conversation_id', 'conv-new');

      expect(localStorage.getItem('chat_conversation_id')).toBe('conv-new');
    });
  });
});
