/**
 * Test Fixtures for useParentCommunication Hook
 *
 * Shared mock objects and test data used across multiple test files.
 */

import { jest } from '@jest/globals';
import type { PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';

/**
 * Creates a complete set of mock setter functions for the hook
 */
export function createMockSetters() {
  return {
    mockSetPrivacySettings: jest.fn(),
    mockSetWoocommerceEnabled: jest.fn(),
    mockSetStoreDomain: jest.fn(),
    mockSetSessionId: jest.fn(),
    mockSetConversationId: jest.fn(),
    mockSetIsOpen: jest.fn(),
    mockSetInput: jest.fn(),
    mockCleanupOldMessages: jest.fn(),
    mockOnReady: jest.fn(),
  };
}

/**
 * Creates a mock window.parent.postMessage function
 */
export function createMockPostMessage() {
  return jest.fn();
}

/**
 * Default hook props for testing
 */
export function createDefaultHookProps(overrides: any = {}) {
  return {
    conversationId: '',
    isOpen: false,
    sessionId: 'session_123',
    mounted: true,
    ...overrides,
  };
}

/**
 * Sample privacy settings for testing
 */
export const samplePrivacySettings: Partial<PrivacySettings> = {
  consentGiven: true,
};

/**
 * Sample init message data
 */
export const sampleInitMessage = {
  type: 'init',
  privacyPrefs: { consentGiven: true },
  woocommerceEnabled: true,
  storeDomain: 'shop.example.com',
};

/**
 * Sample stored data for session restoration
 */
export const sampleStoredData = {
  sessionId: 'session_from_parent',
  conversationId: 'conv_from_parent',
  widgetOpen: true,
};

/**
 * Creates a MessageEvent with proper structure
 */
export function createMessageEvent(data: any, origin: string = window.location.origin) {
  return new MessageEvent('message', { data, origin });
}

/**
 * Malicious origin for security testing
 */
export const MALICIOUS_ORIGIN = 'https://malicious-site.com';

/**
 * Sample message types
 */
export const MESSAGE_TYPES = {
  INIT: 'init',
  OPEN: 'open',
  CLOSE: 'close',
  MESSAGE: 'message',
  CLEANUP: 'cleanup',
  READY: 'ready',
  WIDGET_OPENED: 'widgetOpened',
  WIDGET_CLOSED: 'widgetClosed',
  RESIZE: 'resize',
} as const;

/**
 * Widget dimensions
 */
export const WIDGET_DIMENSIONS = {
  OPEN: { width: 400, height: 580 },
  CLOSED: { width: 64, height: 64 },
} as const;
