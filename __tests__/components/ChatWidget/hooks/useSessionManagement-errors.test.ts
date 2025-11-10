import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionManagement, type StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';
import { createMockStorage, createFailingStorage } from './fixtures/session-management-mocks';

/**
 * Error Handling and Edge Cases Tests
 */

describe('useSessionManagement Hook - Error Handling', () => {
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

  describe('Error Handling', () => {
    it('should handle storage.getItem errors gracefully', async () => {
      const failingStorage = createFailingStorage('Read error');

      const { result } = renderHook(() =>
        useSessionManagement({ storage: failingStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Read error');
      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useSessionManagement] Initialization error:',
        expect.any(Error)
      );
    });

    it('should handle storage.setItem errors gracefully when persisting conversation ID', async () => {
      const mockStorage = createMockStorage();
      const originalSetItem = mockStorage.setItem as jest.Mock;

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      originalSetItem.mockRejectedValueOnce(new Error('Write error'));

      await act(async () => {
        await result.current.setConversationId('conv_fail');
      });

      expect(result.current.conversationId).toBe('conv_fail');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useSessionManagement] Failed to persist conversation ID:',
        expect.any(Error)
      );
    });

    it('should create fallback session ID when storage completely fails', async () => {
      const failingStorage = createFailingStorage('Complete failure');

      const { result } = renderHook(() =>
        useSessionManagement({ storage: failingStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle non-Error exceptions', async () => {
      const throwingStorage: StorageAdapter = {
        getItem: jest.fn(async () => {
          throw 'String error';
        }),
        setItem: jest.fn(async () => {}),
      };

      const { result } = renderHook(() =>
        useSessionManagement({ storage: throwingStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe('Failed to initialize storage');
      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null storage values', async () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => {}),
      };

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.conversationId).toBe('');
    });

    it('should handle empty string storage values', async () => {
      const mockStorage = createMockStorage({
        session_id: '',
        conversation_id: '',
      });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.conversationId).toBe('');
    });

    it('should handle very long session IDs', async () => {
      const longSessionId = 'session_' + 'a'.repeat(1000);
      const mockStorage = createMockStorage({ session_id: longSessionId });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toBe(longSessionId);
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'conv_🎉_unicode_✨_test';
      const mockStorage = createMockStorage({ conversation_id: specialId });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.conversationId).toBe(specialId);
    });

    it('should handle rapid setConversationId calls', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ids = ['conv_1', 'conv_2', 'conv_3', 'conv_4', 'conv_5'];

      await act(async () => {
        for (const id of ids) {
          result.current.setConversationId(id);
        }
      });

      expect(result.current.conversationId).toBe('conv_5');

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenLastCalledWith('conversation_id', 'conv_5');
      });
    });

    it('should handle storage returning unexpected types', async () => {
      const weirdStorage: StorageAdapter = {
        getItem: jest.fn(async (key: string) => {
          if (key === 'session_id') return 12345 as any;
          if (key === 'conversation_id') return { id: 'object' } as any;
          return null;
        }),
        setItem: jest.fn(async () => {}),
      };

      const { result } = renderHook(() =>
        useSessionManagement({ storage: weirdStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toBe(12345);
      expect(result.current.conversationId).toEqual({ id: 'object' });
    });
  });
});
