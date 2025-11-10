import { renderHook, act } from '@testing-library/react';
import { useParentCommunication } from '@/components/ChatWidget/hooks/useParentCommunication';
import type { PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';

type HookProps = Parameters<typeof useParentCommunication>[0];

export interface HookHarness {
  renderHookWithProps: (overrides?: Partial<HookProps>) => void;
  dispatchMessage: (data: Record<string, unknown>) => void;
  mocks: HookMocks;
  spies: HookSpies;
  restore: () => void;
  setEnv: (key: string, value: string) => void;
}

interface HookMocks {
  setPrivacySettings: jest.Mock;
  setWoocommerceEnabled: jest.Mock;
  setStoreDomain: jest.Mock;
  setSessionId: jest.Mock;
  setConversationId: jest.Mock;
  setIsOpen: jest.Mock;
  setInput: jest.Mock;
  cleanupOldMessages: jest.Mock;
  onReady: jest.Mock;
}

interface HookSpies {
  log: jest.SpiedFunction<typeof console.log>;
  warn: jest.SpiedFunction<typeof console.warn>;
  error: jest.SpiedFunction<typeof console.error>;
  postMessage: jest.Mock;
}

export function createHookHarness(): HookHarness {
  const envSnapshot = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const spies: HookSpies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    postMessage: jest.fn(),
  };

  const mockParent = { postMessage: spies.postMessage };
  const originalParent = window.parent;

  Object.defineProperty(window, 'parent', {
    value: mockParent,
    writable: true,
    configurable: true,
  });

  const mocks: HookMocks = {
    setPrivacySettings: jest.fn(),
    setWoocommerceEnabled: jest.fn(),
    setStoreDomain: jest.fn(),
    setSessionId: jest.fn(),
    setConversationId: jest.fn(),
    setIsOpen: jest.fn(),
    setInput: jest.fn(),
    cleanupOldMessages: jest.fn(),
    onReady: jest.fn(),
  };

  const baseProps: HookProps = {
    conversationId: '',
    isOpen: false,
    sessionId: '',
    mounted: true,
    setPrivacySettings: mocks.setPrivacySettings,
    setWoocommerceEnabled: mocks.setWoocommerceEnabled,
    setStoreDomain: mocks.setStoreDomain,
    setSessionId: mocks.setSessionId,
    setConversationId: mocks.setConversationId,
    setIsOpen: mocks.setIsOpen,
    setInput: mocks.setInput,
    cleanupOldMessages: mocks.cleanupOldMessages,
  };

  const renderHookWithProps = (overrides: Partial<HookProps> = {}) => {
    renderHook(() =>
      useParentCommunication({
        ...baseProps,
        ...overrides,
      }),
    );
  };

  const dispatchMessage = (data: Record<string, unknown>) => {
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data,
          origin: window.location.origin,
        }),
      );
    });
  };

  const setEnv = (key: string, value: string) => {
    process.env[key] = value;
  };

  const restore = () => {
    process.env.NODE_ENV = envSnapshot.NODE_ENV;
    process.env.NEXT_PUBLIC_APP_URL = envSnapshot.NEXT_PUBLIC_APP_URL;
    spies.log.mockRestore();
    spies.warn.mockRestore();
    spies.error.mockRestore();
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
  };

  return {
    renderHookWithProps,
    dispatchMessage,
    mocks,
    spies,
    setEnv,
    restore,
  };
}

export function applyPrivacyUpdate(updater: (prev: PrivacySettings) => PrivacySettings) {
  const prev: PrivacySettings = { consentGiven: false } as PrivacySettings;
  return updater(prev);
}
