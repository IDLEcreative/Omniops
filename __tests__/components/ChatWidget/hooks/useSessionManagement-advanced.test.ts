import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionManagement, type StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';
import { createMockStorage, createSlowStorage } from './fixtures/session-management-mocks';

/**
 * Advanced Tests: Unmount Safety, useCallback Stability, Storage Interface,
 * Production Logging, and Integration Scenarios
 */

describe('useSessionManagement Hook - Advanced Tests', () => {
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

  describe('Unmount Safety (Race Condition Prevention)', () => {
    it('should not update state after unmount', async () => {
      const slowStorage = createSlowStorage(200);

      const { result, unmount } = renderHook(() =>
        useSessionManagement({ storage: slowStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);
      unmount();

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update a component'),
        expect.anything()
      );
    });

    it('should handle unmount during setConversationId', async () => {
      const slowStorage = createSlowStorage(200);

      const { result, unmount } = renderHook(() =>
        useSessionManagement({ storage: slowStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setConversationId('conv_unmount');
      });

      unmount();
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update'),
        expect.anything()
      );
    });
  });

  describe('useCallback Stability', () => {
    it('should maintain stable setConversationId reference across re-renders', () => {
      const mockStorage = createMockStorage();

      const { result, rerender } = renderHook(
        ({ mounted }) => useSessionManagement({ storage: mockStorage, mounted }),
        { initialProps: { mounted: true } }
      );

      const firstSetConversationId = result.current.setConversationId;
      rerender({ mounted: true });
      const secondSetConversationId = result.current.setConversationId;

      expect(firstSetConversationId).toBe(secondSetConversationId);
    });

    it('should update setConversationId reference when mounted changes', () => {
      const mockStorage = createMockStorage();

      const { result, rerender } = renderHook(
        ({ mounted }) => useSessionManagement({ storage: mockStorage, mounted }),
        { initialProps: { mounted: true } }
      );

      const firstSetConversationId = result.current.setConversationId;
      rerender({ mounted: false });
      const secondSetConversationId = result.current.setConversationId;

      expect(firstSetConversationId).not.toBe(secondSetConversationId);
    });
  });

  describe('Storage Interface Compliance', () => {
    it('should call storage.getItem for both IDs in parallel', async () => {
      const mockStorage = createMockStorage();

      renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalledTimes(2);
      });

      expect(mockStorage.getItem).toHaveBeenCalledWith('session_id');
      expect(mockStorage.getItem).toHaveBeenCalledWith('conversation_id');
    });

    it('should work with custom async storage implementation', async () => {
      const operations: string[] = [];
      const customStorage: StorageAdapter = {
        getItem: jest.fn(async (key: string) => {
          operations.push(`get:${key}`);
          return null;
        }),
        setItem: jest.fn(async (key: string, value: string) => {
          operations.push(`set:${key}=${value}`);
        }),
      };

      const { result } = renderHook(() =>
        useSessionManagement({ storage: customStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(operations).toContain('get:session_id');
      expect(operations).toContain('get:conversation_id');
      expect(operations.find(op => op.startsWith('set:session_id='))).toBeTruthy();
    });
  });

  describe('Production vs Development Logging', () => {
    it('should log in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const mockStorage = createMockStorage({ session_id: 'session_dev' });

      renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          '[useSessionManagement] Restored from storage:',
          expect.objectContaining({
            session_id: 'session_dev',
          })
        );
      });
    });

    it('should not log in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const mockStorage = createMockStorage({ session_id: 'session_prod' });

      renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalled();
      });

      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[useSessionManagement]'),
        expect.anything()
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete initialization flow', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.sessionId).toBe('');
      expect(result.current.conversationId).toBe('');
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.conversationId).toBe('');
      expect(result.current.error).toBeNull();

      const conversationId = 'conv_integration_test';
      await act(async () => {
        await result.current.setConversationId(conversationId);
      });

      expect(result.current.conversationId).toBe(conversationId);
      expect(mockStorage.storage.get('session_id')).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockStorage.storage.get('conversation_id')).toBe(conversationId);
    });

    it('should persist across hook remounts', async () => {
      const persistentStorage = createMockStorage();

      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useSessionManagement({ storage: persistentStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      const sessionId1 = result1.current.sessionId;

      await act(async () => {
        await result1.current.setConversationId('conv_persist');
      });

      unmount1();

      const { result: result2 } = renderHook(() =>
        useSessionManagement({ storage: persistentStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.sessionId).toBe(sessionId1);
      expect(result2.current.conversationId).toBe('conv_persist');
    });

    it('should handle mounted changing from false to true', async () => {
      const mockStorage = createMockStorage();

      const { result, rerender } = renderHook(
        ({ mounted }) => useSessionManagement({ storage: mockStorage, mounted }),
        { initialProps: { mounted: false } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialConversationId = 'conv_unmounted';

      await act(async () => {
        await result.current.setConversationId(initialConversationId);
      });

      expect(result.current.conversationId).toBe(initialConversationId);

      const setItemCalls = (mockStorage.setItem as jest.Mock).mock.calls;
      const conversationCalls = setItemCalls.filter(call => call[0] === 'conversation_id');
      expect(conversationCalls).toHaveLength(0);

      rerender({ mounted: true });

      const mountedConversationId = 'conv_mounted';
      await act(async () => {
        await result.current.setConversationId(mountedConversationId);
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', mountedConversationId);
    });
  });
});
