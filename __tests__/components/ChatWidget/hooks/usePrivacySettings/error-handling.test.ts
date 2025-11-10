/**
 * usePrivacySettings Hook - Error Handling Tests
 *
 * Tests error recovery and environment-specific logging
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setURLSearchParams,
  mockURLSearchParamsError,
  restoreURLSearchParams,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - Error Handling', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should set error on URL parsing failure', () => {
    const originalURLSearchParams = global.URLSearchParams;
    mockURLSearchParamsError(originalURLSearchParams);

    const { result } = renderHook(() => usePrivacySettings({}));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('URL parsing failed');

    restoreURLSearchParams(originalURLSearchParams);
  });

  it('should handle malformed URL params gracefully', () => {
    setURLSearchParams('?invalid&malformed=&weird===value');
    const { result } = renderHook(() => usePrivacySettings({}));

    // Should fall back to defaults without crashing
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should log errors in development only', () => {
    process.env.NODE_ENV = 'development';

    const originalURLSearchParams = global.URLSearchParams;
    mockURLSearchParamsError(originalURLSearchParams);

    renderHook(() => usePrivacySettings({}));

    expect(context.consoleErrorSpy).toHaveBeenCalledWith(
      '[usePrivacySettings] Error parsing URL params:',
      expect.any(Error)
    );

    restoreURLSearchParams(originalURLSearchParams);
  });

  it('should not log errors in production', () => {
    process.env.NODE_ENV = 'production';

    const originalURLSearchParams = global.URLSearchParams;
    mockURLSearchParamsError(originalURLSearchParams);

    renderHook(() => usePrivacySettings({}));

    expect(context.consoleErrorSpy).not.toHaveBeenCalled();

    restoreURLSearchParams(originalURLSearchParams);
  });
});
