/**
 * @jest-environment jsdom
 */
/**
 * useParentCommunication Hook - Setup & Lifecycle Tests
 *
 * Tests for:
 * - Event listener setup on mount
 * - Event listener cleanup on unmount
 * - Ready message sending
 * - onReady callback execution
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useParentCommunication } from '@/components/ChatWidget/hooks/useParentCommunication';
import {
  createMockSetters,
  createMockPostMessage,
  createDefaultHookProps,
} from './fixtures/useParentCommunication-fixtures';
import {
  mockWindowParent,
  restoreWindowParent,
  setupEnv,
  restoreEnv,
  createConsoleSpy,
  restoreConsoleSpy,
} from './helpers/useParentCommunication-helpers';

describe('useParentCommunication Hook - Setup & Lifecycle', () => {
  let env: ReturnType<typeof setupEnv>;
  let consoleSpy: ReturnType<typeof createConsoleSpy>;
  let mockPostMessage: jest.Mock;
  let mocks: ReturnType<typeof createMockSetters>;
  let originalParent: Window;

  beforeEach(() => {
    env = setupEnv();
    consoleSpy = createConsoleSpy();
    mocks = createMockSetters();
    mockPostMessage = createMockPostMessage();
    originalParent = mockWindowParent(mockPostMessage);
  });

  afterEach(() => {
    restoreEnv(env);
    restoreConsoleSpy(consoleSpy);
    mockPostMessage.mockClear();
    restoreWindowParent(originalParent);
    jest.clearAllMocks();
  });

  describe('Message Handler Setup', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      expect(result.current.messagesReceived).toBeGreaterThanOrEqual(0);
      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should send ready message to parent on mount', () => {
      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' }, expect.any(String));
    });

    it('should call onReady callback when provided', () => {
      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
          onReady: mocks.mockOnReady,
        })
      );

      expect(mocks.mockOnReady).toHaveBeenCalled();
    });
  });

  describe('Error Handling in Setup', () => {
    it('should set error on addEventListener failure', () => {
      const addEventListenerSpy = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation(() => {
          throw new Error('addEventListener failed');
        });

      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(result.current.error).toEqual(expect.any(Error));
      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });

    it('should set error on postMessage failure', () => {
      mockPostMessage.mockImplementation(() => {
        throw new Error('postMessage failed');
      });

      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(result.current.error).toEqual(expect.any(Error));
      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle removeEventListener errors gracefully', () => {
      process.env.NODE_ENV = 'development';

      const removeEventListenerSpy = jest
        .spyOn(window, 'removeEventListener')
        .mockImplementation(() => {
          throw new Error('removeEventListener failed');
        });

      const { unmount } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      unmount();

      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup error'),
        expect.any(Error)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should handle onReady callback errors gracefully', () => {
      process.env.NODE_ENV = 'development';

      const failingOnReady = jest.fn(() => {
        throw new Error('onReady failed');
      });

      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
          onReady: failingOnReady,
        })
      );

      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in onReady callback'),
        expect.any(Error)
      );
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle window.parent === window (not in iframe)', () => {
      const originalParentSaved = window.parent;
      Object.defineProperty(window, 'parent', {
        value: window,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(mockPostMessage).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();

      Object.defineProperty(window, 'parent', {
        value: originalParentSaved,
        writable: true,
        configurable: true,
      });
    });

    it('should handle missing NEXT_PUBLIC_APP_URL', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' }, window.location.origin);
    });

    it('should handle postMessage to closed window', () => {
      mockPostMessage.mockImplementation(() => {
        throw new Error('Window is closed');
      });

      const { result, rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useParentCommunication({
            ...createDefaultHookProps({ isOpen }),
            ...mocks,
          }),
        { initialProps: { isOpen: false } }
      );

      rerender({ isOpen: true });

      expect(result.current.error).toEqual(expect.any(Error));
      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
