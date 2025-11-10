import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSessionManagement, type StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';

/**
 * Comprehensive test suite for useSessionManagement hook
 *
 * Tests:
 * - Session ID generation and restoration
 * - Conversation ID persistence
 * - Loading and error states
 * - Race condition prevention
 * - Storage adapter interface compliance
 * - Edge cases and error scenarios
 */

// Test utilities
function createMockStorage(
  initialData: Record<string, string> = {}
): StorageAdapter & { storage: Map<string, string> } {
  const storage = new Map<string, string>(Object.entries(initialData));

  return {
    storage, // Expose for testing
    getItem: jest.fn(async (key: string) => storage.get(key) || null),
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
}

function createSlowStorage(delayMs: number = 100, initialData: Record<string, string> = {}): StorageAdapter {
  const storage = new Map<string, string>(Object.entries(initialData));

  return {
    getItem: jest.fn(async (key: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return storage.get(key) || null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      storage.set(key, value);
    }),
  };
}

function createFailingStorage(errorMessage: string = 'Storage error'): StorageAdapter {
  return {
    getItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
    setItem: jest.fn(async () => {
      throw new Error(errorMessage);
    }),
  };
}

describe('useSessionManagement Hook', () => {
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

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.sessionId).toBe('');

      // Wait for async initialization
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

      // Should have created a new session ID
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

      // Force re-render
      rerender();

      await waitFor(() => {
        expect(result.current.sessionId).toBe(firstSessionId);
      });

      // setItem should only be called once for session creation
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
      // Use fast storage with existing session to avoid initialization delay
      const mockStorage = createMockStorage({ session_id: 'existing_session' });

      // Make setItem slow to test async behavior
      const originalSetItem = mockStorage.setItem as jest.Mock;
      originalSetItem.mockImplementation(async (key: string, value: string) => {
        // Delay only for conversation_id updates
        if (key === 'conversation_id') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        mockStorage.storage.set(key, value);
      });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      // Wait for fast initialization
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newConversationId = 'conv_immediate';

      act(() => {
        // Don't await - test immediate update
        result.current.setConversationId(newConversationId);
      });

      // State should update immediately (before storage completes)
      expect(result.current.conversationId).toBe(newConversationId);

      // Verify setItem was called but may not have completed yet
      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', newConversationId);

      // Wait for storage operation to complete
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

      // Check still loading after 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(result.current.isLoading).toBe(true);

      // Should finish after storage completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });
    });
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

      // Should have error but still function with fallback session
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
      // Make setItem fail after initialization
      const originalSetItem = mockStorage.setItem as jest.Mock;

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now make setItem fail
      originalSetItem.mockRejectedValueOnce(new Error('Write error'));

      await act(async () => {
        await result.current.setConversationId('conv_fail');
      });

      // State should still update despite storage error
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

      // Should have session ID despite storage failure
      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle non-Error exceptions', async () => {
      const throwingStorage: StorageAdapter = {
        getItem: jest.fn(async () => {
          throw 'String error'; // Non-Error throw
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

  describe('Unmount Safety (Race Condition Prevention)', () => {
    it('should not update state after unmount', async () => {
      const slowStorage = createSlowStorage(200);

      const { result, unmount } = renderHook(() =>
        useSessionManagement({ storage: slowStorage, mounted: true })
      );

      expect(result.current.isLoading).toBe(true);

      // Unmount before storage completes
      unmount();

      // Wait for storage to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // No state updates should have occurred after unmount
      // React Testing Library handles this internally and would warn if state was updated
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update a component'),
        expect.anything()
      );
    });

    it('should ignore late storage responses after unmount', async () => {
      const verySlowStorage = createSlowStorage(1000);

      const { unmount } = renderHook(() =>
        useSessionManagement({ storage: verySlowStorage, mounted: true })
      );

      // Unmount immediately
      unmount();

      // Wait for storage to complete
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should not have any warnings about state updates
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update'),
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

      // Start setting conversation ID
      act(() => {
        result.current.setConversationId('conv_unmount');
      });

      // Unmount while storage operation is pending
      unmount();

      // Wait for storage operation to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should not have warnings
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

      // Re-render with same props
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

      // Re-render with different mounted prop
      rerender({ mounted: false });

      const secondSetConversationId = result.current.setConversationId;

      expect(firstSetConversationId).not.toBe(secondSetConversationId);
    });

    it('should update setConversationId reference when storage changes', () => {
      const storage1 = createMockStorage();
      const storage2 = createMockStorage();

      const { result, rerender } = renderHook(
        ({ storage }) => useSessionManagement({ storage, mounted: true }),
        { initialProps: { storage: storage1 } }
      );

      const firstSetConversationId = result.current.setConversationId;

      // Re-render with different storage
      rerender({ storage: storage2 });

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

      // Both getItem calls should happen immediately
      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalledTimes(2);
      });

      expect(mockStorage.getItem).toHaveBeenCalledWith('session_id');
      expect(mockStorage.getItem).toHaveBeenCalledWith('conversation_id');
    });

    it('should call storage.setItem with correct key-value pairs', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const conversationId = 'conv_test_123';

      await act(async () => {
        await result.current.setConversationId(conversationId);
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', conversationId);
    });

    it('should work with custom async storage implementation', async () => {
      // Custom storage that tracks operations
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

      // Check operations happened in expected order
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

    it('should log conversation ID persistence in development', async () => {
      process.env.NODE_ENV = 'development';
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setConversationId('conv_dev_log');
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useSessionManagement] Persisted conversation ID:',
        'conv_dev_log'
      );
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

      // Empty session ID should trigger new generation
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

      // Rapidly call setConversationId
      const ids = ['conv_1', 'conv_2', 'conv_3', 'conv_4', 'conv_5'];

      await act(async () => {
        for (const id of ids) {
          result.current.setConversationId(id);
        }
      });

      // Final value should be the last one
      expect(result.current.conversationId).toBe('conv_5');

      // All calls should have been made
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenLastCalledWith('conversation_id', 'conv_5');
      });
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

      // Set conversation while unmounted
      await act(async () => {
        await result.current.setConversationId(initialConversationId);
      });

      // Should update state but not persist (mounted = false)
      expect(result.current.conversationId).toBe(initialConversationId);

      // setItem shouldn't be called for conversation (only for session creation)
      const setItemCalls = (mockStorage.setItem as jest.Mock).mock.calls;
      const conversationCalls = setItemCalls.filter(call => call[0] === 'conversation_id');
      expect(conversationCalls).toHaveLength(0);

      // Change to mounted
      rerender({ mounted: true });

      // Now set conversation while mounted
      const mountedConversationId = 'conv_mounted';
      await act(async () => {
        await result.current.setConversationId(mountedConversationId);
      });

      // Should persist now
      expect(mockStorage.setItem).toHaveBeenCalledWith('conversation_id', mountedConversationId);
    });

    it('should handle storage returning unexpected types', async () => {
      const weirdStorage: StorageAdapter = {
        getItem: jest.fn(async (key: string) => {
          // Return non-string values (shouldn't happen but defensive)
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

      // The hook treats non-string values as truthy but stores them as-is
      // This test documents current behavior - the hook doesn't do type coercion
      // If session_id is a number, it will be stored as a number
      expect(result.current.sessionId).toBe(12345);

      // For conversation_id, objects are stored as-is too
      expect(result.current.conversationId).toEqual({ id: 'object' });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete initialization flow', async () => {
      const mockStorage = createMockStorage();

      const { result } = renderHook(() =>
        useSessionManagement({ storage: mockStorage, mounted: true })
      );

      // Step 1: Loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.sessionId).toBe('');
      expect(result.current.conversationId).toBe('');
      expect(result.current.error).toBeNull();

      // Step 2: Initialization complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.current.conversationId).toBe('');
      expect(result.current.error).toBeNull();

      // Step 3: Set conversation ID
      const conversationId = 'conv_integration_test';
      await act(async () => {
        await result.current.setConversationId(conversationId);
      });

      expect(result.current.conversationId).toBe(conversationId);

      // Step 4: Verify persistence
      expect(mockStorage.storage.get('session_id')).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(mockStorage.storage.get('conversation_id')).toBe(conversationId);
    });

    it('should persist across hook remounts', async () => {
      const persistentStorage = createMockStorage();

      // First mount
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

      // Second mount - should restore previous values
      const { result: result2 } = renderHook(() =>
        useSessionManagement({ storage: persistentStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.sessionId).toBe(sessionId1);
      expect(result2.current.conversationId).toBe('conv_persist');
    });

    it('should handle storage migration scenario', async () => {
      // Simulate old storage format
      const legacyStorage = createMockStorage({
        session_id: 'old_format_session',
        conversation_id: 'old_format_conv',
      });

      const { result } = renderHook(() =>
        useSessionManagement({ storage: legacyStorage, mounted: true })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should accept old format
      expect(result.current.sessionId).toBe('old_format_session');
      expect(result.current.conversationId).toBe('old_format_conv');

      // Update to new format
      await act(async () => {
        await result.current.setConversationId('new_format_conv');
      });

      // Verify new format is persisted
      expect(legacyStorage.storage.get('conversation_id')).toBe('new_format_conv');
    });
  });
});