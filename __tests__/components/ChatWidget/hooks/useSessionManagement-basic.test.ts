/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionManagement } from '@/components/ChatWidget/hooks/useSessionManagement';
import { createMockStorage, createSlowStorage, createFailingStorage } from './fixtures/session-management-mocks';

/**
 * Basic Session Management Tests
 * Tests: Session ID generation, restoration, and conversation ID persistence
 */

describe('useSessionManagement Hook - Basic Tests', () => {
  let originalEnv: string | undefined;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Session ID Management', () => {
    it('should restore session ID from storage on mount', async () => {
      const existingSessionId = 'session_1234567890_abcdefg';
      const mockStorage = createMockStorage({ session_id: existingSessionId });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.sessionId).toBe('');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toBe(existingSessionId);
      expect(mockStorage.getItem).toHaveBeenCalledWith('session_id');
    });

    it('should create new session ID if none exists', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'session_id',
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
      );
    });

    it('should not create duplicate session IDs on re-render', async () => {
      const mockStorage = createMockStorage();

      const { result, rerender } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstSessionId = result.current.sessionId;
      rerender();

      await waitFor(() => {
        expect(result.current.sessionId).toBe(firstSessionId);
      });

      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should generate unique session IDs', async () => {
      const storage1 = createMockStorage();
      const storage2 = createMockStorage();

      const { result: result1 } = renderHook(() =>
        useSessionManagement({ storage: storage1, mounted: true })
      );

      const { result: result2 } = renderHook(() =>
        useSessionManagement({ storage: storage2, mounted: true })
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
    });
  });

  describe('Conversation ID Management', () => {
    it('should restore conversation ID from storage on mount', async () => {
      const existingConversationId = 'conv_123456';
      const mockStorage = createMockStorage({
        session_id: 'session_123',
        conversation_id: existingConversationId,
      });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversationId).toBe(existingConversationId);
      expect(mockStorage.getItem).toHaveBeenCalledWith('conversation_id');
    });

    it('should start with empty conversation ID if none exists', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversationId).toBe('');
    });

    it('should persist conversation ID when set', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newConversationId = 'conv_new_123';

      await act(async () => {
        await result.current.setConversationId(newConversationId);
      });

      expect(result.current.conversationId).toBe(newConversationId);
      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', newConversationId);
    });

    it('should update conversation ID immediately for UI responsiveness', async () => {
      const mockStorage = createMockStorage({ session_id: 'existing_session' });

      const originalSetItem = mockStorage.setItem as jest.Mock;
      originalSetItem.mockImplementation(async (key: string, value: string) => {
        if (key === 'conversation_id') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        mockStorage.storage.set(key, value);
      });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newConversationId = 'conv_immediate';

      act(() => {
        result.current.setConversationId(newConversationId);
      });

      expect(result.current.conversationId).toBe(newConversationId);
      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', newConversationId);

      await waitFor(() => {
        expect(mockStorage.storage.get('conversation_id')).toBe(newConversationId);
      }, { timeout: 1000 });
    });
  });

  describe('Loading States', () => {
    it('should be loading initially', () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after initialization', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should remain loading while storage operations are pending', async () => {
      const slowStorage = createSlowStorage(200);

      const { result } = renderHook(() =>
        useSessionManagement({ storage: slowStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });
    });
  });
});
