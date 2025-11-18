/**
 * @jest-environment jsdom
 */
/**
 * usePrivacySettings Hook - Consent Handling Tests
 *
 * Tests consent state management and postMessage communication
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { usePrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - handleConsent Function', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should set consentGiven to true', () => {
    const { result } = renderHook(() => usePrivacySettings({}));

    expect(result.current.privacySettings.consentGiven).toBe(false);

    act(() => {
      result.current.handleConsent();
    });

    expect(result.current.privacySettings.consentGiven).toBe(true);
  });

  it('should post message to parent window', () => {
    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
    });

    expect(context.mockPostMessage).toHaveBeenCalledWith(
      {
        type: 'privacy',
        action: 'giveConsent',
      },
      'http://localhost:3000'
    );
  });

  it('should use correct targetOrigin from environment variable', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
    });

    expect(context.mockPostMessage).toHaveBeenCalledWith(
      {
        type: 'privacy',
        action: 'giveConsent',
      },
      'https://example.com'
    );
  });

  it('should handle postMessage errors gracefully', () => {
    context.mockPostMessage.mockImplementation(() => {
      throw new Error('postMessage failed');
    });

    const { result } = renderHook(() => usePrivacySettings({}));

    expect(() => {
      act(() => {
        result.current.handleConsent();
      });
    }).not.toThrow();

    expect(result.current.privacySettings.consentGiven).toBe(true);
  });

  it('should handle multiple rapid handleConsent calls', () => {
    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
      result.current.handleConsent();
      result.current.handleConsent();
    });

    expect(result.current.privacySettings.consentGiven).toBe(true);
    expect(context.mockPostMessage).toHaveBeenCalledTimes(3);
  });
});
