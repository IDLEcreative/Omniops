/**
 * useParentCommunication Hook - Widget State Notifications Tests
 *
 * Tests for:
 * - Widget opened/closed notifications
 * - Resize messages
 * - Message statistics tracking
 * - Production vs development logging
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useParentCommunication } from '@/components/ChatWidget/hooks/useParentCommunication';
import {
  createMockSetters,
  createMockPostMessage,
  createDefaultHookProps,
  WIDGET_DIMENSIONS,
} from './fixtures/useParentCommunication-fixtures';
import {
  mockWindowParent,
  restoreWindowParent,
  setupEnv,
  restoreEnv,
  createConsoleSpy,
  restoreConsoleSpy,
  dispatchMessageEvent,
} from './helpers/useParentCommunication-helpers';

describe('useParentCommunication Hook - Notifications', () => {
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

  describe('Widget Open/Close Notifications', () => {
    it('should send widgetOpened message when widget opens', () => {
      const { rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useParentCommunication({
            ...createDefaultHookProps({ isOpen }),
            ...mocks,
          }),
        { initialProps: { isOpen: false } }
      );

      mockPostMessage.mockClear();

      rerender({ isOpen: true });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'widgetOpened' }, expect.any(String));
    });

    it('should send resize message when widget opens (400x580)', () => {
      const { rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useParentCommunication({
            ...createDefaultHookProps({ isOpen }),
            ...mocks,
          }),
        { initialProps: { isOpen: false } }
      );

      mockPostMessage.mockClear();

      rerender({ isOpen: true });

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'resize', width: WIDGET_DIMENSIONS.OPEN.width, height: WIDGET_DIMENSIONS.OPEN.height },
        expect.any(String)
      );
    });

    it('should send widgetClosed message when widget closes', () => {
      const { rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useParentCommunication({
            ...createDefaultHookProps({ isOpen }),
            ...mocks,
          }),
        { initialProps: { isOpen: true } }
      );

      mockPostMessage.mockClear();

      rerender({ isOpen: false });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'widgetClosed' }, expect.any(String));
    });

    it('should send resize message when widget closes (64x64)', () => {
      const { rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useParentCommunication({
            ...createDefaultHookProps({ isOpen }),
            ...mocks,
          }),
        { initialProps: { isOpen: true } }
      );

      mockPostMessage.mockClear();

      rerender({ isOpen: false });

      expect(mockPostMessage).toHaveBeenCalledWith(
        { type: 'resize', width: WIDGET_DIMENSIONS.CLOSED.width, height: WIDGET_DIMENSIONS.CLOSED.height },
        expect.any(String)
      );
    });
  });

  describe('Message Statistics', () => {
    it('should increment messagesReceived count', () => {
      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      const initialCount = result.current.messagesReceived;

      dispatchMessageEvent({ type: 'open' });

      expect(result.current.messagesReceived).toBe(initialCount + 1);
    });

    it('should update lastMessageType', () => {
      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      dispatchMessageEvent({ type: 'open' });

      expect(result.current.lastMessageType).toBe('open');

      dispatchMessageEvent({ type: 'close' });

      expect(result.current.lastMessageType).toBe('close');
    });

    it('should track multiple messages correctly', () => {
      const { result } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      const initialCount = result.current.messagesReceived;

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'open' },
            origin: window.location.origin,
          })
        );
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'message', message: 'Test' },
            origin: window.location.origin,
          })
        );
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'close' },
            origin: window.location.origin,
          })
        );
      });

      expect(result.current.messagesReceived).toBe(initialCount + 3);
      expect(result.current.lastMessageType).toBe('close');
    });

    it('should reset on re-mount', () => {
      const { result, unmount } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      dispatchMessageEvent({ type: 'open' });

      expect(result.current.messagesReceived).toBeGreaterThan(0);

      unmount();

      const { result: newResult } = renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(newResult.current.messagesReceived).toBeGreaterThanOrEqual(0);
      expect(newResult.current.messagesReceived).toBeLessThan(result.current.messagesReceived);
    });
  });

  describe('Production vs Development Logging', () => {
    it('should log in development mode', () => {
      process.env.NODE_ENV = 'development';

      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps({ sessionId: '' }),
          ...mocks,
        })
      );

      dispatchMessageEvent({
        type: 'init',
        storedData: { sessionId: 'session_123' },
      });

      expect(consoleSpy.consoleLogSpy).toHaveBeenCalled();
    });

    it('should be silent in production mode', () => {
      process.env.NODE_ENV = 'production';

      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps({ sessionId: '' }),
          ...mocks,
        })
      );

      dispatchMessageEvent({
        type: 'init',
        storedData: { sessionId: 'session_123' },
      });

      expect(consoleSpy.consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should respect ChatWidgetDebug flag', () => {
      (window as any).ChatWidgetDebug = true;

      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      consoleSpy.consoleLogSpy.mockClear();

      dispatchMessageEvent({ type: 'open' });

      expect(consoleSpy.consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received message'),
        'open',
        'from',
        window.location.origin
      );

      delete (window as any).ChatWidgetDebug;
    });

    it('should always log critical errors in production', () => {
      process.env.NODE_ENV = 'production';

      mockPostMessage.mockImplementation(() => {
        throw new Error('Critical postMessage failure');
      });

      renderHook(() =>
        useParentCommunication({
          ...createDefaultHookProps(),
          ...mocks,
        })
      );

      expect(consoleSpy.consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
