/**
 * usePrivacySettings Hook - Production-Safe Logging Tests
 *
 * Tests environment-specific logging behavior
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { usePrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - Production-Safe Logging', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should log consent message in development', () => {
    process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
    });

    expect(context.consoleLogSpy).toHaveBeenCalledWith(
      '[usePrivacySettings] Consent given, message posted to parent'
    );
  });

  it('should not log consent message in production', () => {
    process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
    });

    expect(context.consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log postMessage errors in development only', () => {
    process.env.NODE_ENV = 'development';

    context.mockPostMessage.mockImplementation(() => {
      throw new Error('postMessage failed');
    });

    const { result } = renderHook(() => usePrivacySettings({}));

    act(() => {
      result.current.handleConsent();
    });

    expect(context.consoleErrorSpy).toHaveBeenCalledWith(
      '[usePrivacySettings] Error posting consent message:',
      expect.any(Error)
    );
  });
});
