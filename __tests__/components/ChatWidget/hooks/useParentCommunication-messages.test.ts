/**
 * useParentCommunication Hook - Message Type Handling Tests
 *
 * Tests for:
 * - Init message processing
 * - Open/close messages
 * - Text input messages
 * - Cleanup messages
 * - Unknown message types
 * - Session restoration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useParentCommunication } from '@/components/ChatWidget/hooks/useParentCommunication';
import type { PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';

describe('useParentCommunication Hook - Message Handling', () => {
  let originalEnv: string | undefined;
  let originalAppUrl: string | undefined;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let mockPostMessage: jest.Mock;
  let mockSetPrivacySettings: jest.Mock;
  let mockSetWoocommerceEnabled: jest.Mock;
  let mockSetStoreDomain: jest.Mock;
  let mockSetSessionId: jest.Mock;
  let mockSetConversationId: jest.Mock;
  let mockSetIsOpen: jest.Mock;
  let mockSetInput: jest.Mock;
  let mockCleanupOldMessages: jest.Mock;
  let mockOnReady: jest.Mock;
  let originalParent: Window;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    mockSetPrivacySettings = jest.fn();
    mockSetWoocommerceEnabled = jest.fn();
    mockSetStoreDomain = jest.fn();
    mockSetSessionId = jest.fn();
    mockSetConversationId = jest.fn();
    mockSetIsOpen = jest.fn();
    mockSetInput = jest.fn();
    mockCleanupOldMessages = jest.fn();
    mockOnReady = jest.fn();

    mockPostMessage = jest.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    mockPostMessage.mockClear();
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
  });

  describe('Message Type Handling', () => {
    it('should handle init message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: '',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              privacyPrefs: { consentGiven: true },
              woocommerceEnabled: true,
              storeDomain: 'shop.example.com',
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetPrivacySettings).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetWoocommerceEnabled).toHaveBeenCalledWith(true);
      expect(mockSetStoreDomain).toHaveBeenCalledWith('shop.example.com');
    });

    it('should handle open message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'open' },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetIsOpen).toHaveBeenCalledWith(true);
    });

    it('should handle close message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: true,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'close' },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetIsOpen).toHaveBeenCalledWith(false);
    });

    it('should handle message with text input', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'message', message: 'Hello from parent' },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetInput).toHaveBeenCalledWith('Hello from parent');
    });

    it('should handle cleanup message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'cleanup', retentionDays: 30 },
            origin: window.location.origin,
          })
        );
      });

      expect(mockCleanupOldMessages).toHaveBeenCalledWith(30);
    });

    it('should ignore unknown message types', () => {
      process.env.NODE_ENV = 'development';

      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: { type: 'unknown-type' },
            origin: window.location.origin,
          })
        );
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown message type'),
        'unknown-type'
      );
    });
  });

  describe('Init Message Processing', () => {
    it('should set privacy settings from privacyPrefs', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              privacyPrefs: { consentGiven: true },
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetPrivacySettings).toHaveBeenCalledWith(expect.any(Function));

      const updaterFn = mockSetPrivacySettings.mock.calls[0][0];
      const prev = { consentGiven: false } as PrivacySettings;
      const result = updaterFn(prev);
      expect(result.consentGiven).toBe(true);
    });

    it('should set woocommerceEnabled from message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              woocommerceEnabled: true,
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetWoocommerceEnabled).toHaveBeenCalledWith(true);
    });

    it('should set storeDomain from message', () => {
      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              storeDomain: 'shop.example.com',
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetStoreDomain).toHaveBeenCalledWith('shop.example.com');
    });

    it('should restore sessionId from storedData', () => {
      process.env.NODE_ENV = 'development';

      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: '',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              storedData: {
                sessionId: 'session_from_parent',
              },
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetSessionId).toHaveBeenCalledWith('session_from_parent');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restored session ID from parent'),
        'session_from_parent'
      );
    });

    it('should restore conversationId from storedData', () => {
      process.env.NODE_ENV = 'development';

      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              storedData: {
                conversationId: 'conv_from_parent',
              },
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetConversationId).toHaveBeenCalledWith('conv_from_parent');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restored conversation ID from parent'),
        'conv_from_parent'
      );
    });

    it('should restore widget open state from storedData', () => {
      process.env.NODE_ENV = 'development';

      renderHook(() =>
        useParentCommunication({
          conversationId: '',
          isOpen: false,
          sessionId: 'session_123',
          mounted: true,
          setPrivacySettings: mockSetPrivacySettings,
          setWoocommerceEnabled: mockSetWoocommerceEnabled,
          setStoreDomain: mockSetStoreDomain,
          setSessionId: mockSetSessionId,
          setConversationId: mockSetConversationId,
          setIsOpen: mockSetIsOpen,
          setInput: mockSetInput,
          cleanupOldMessages: mockCleanupOldMessages,
        })
      );

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'init',
              storedData: {
                widgetOpen: true,
              },
            },
            origin: window.location.origin,
          })
        );
      });

      expect(mockSetIsOpen).toHaveBeenCalledWith(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Widget was open, restoring state')
      );
    });
  });
});
