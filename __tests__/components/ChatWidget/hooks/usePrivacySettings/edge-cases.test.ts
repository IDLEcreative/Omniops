/**
 * usePrivacySettings Hook - Edge Cases Tests
 *
 * Tests edge cases, SSR, special characters, and boundary conditions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setURLSearchParams,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - Edge Cases', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should handle empty URL params', () => {
    setURLSearchParams('');
    const { result } = renderHook(() => usePrivacySettings({}));

    expect(result.current.privacySettings).toEqual({
      allowOptOut: false,
      showPrivacyNotice: false,
      requireConsent: false,
      consentGiven: false,
      retentionDays: 30,
    });
  });

  it('should handle window undefined (SSR)', () => {
    const { result } = renderHook(() => usePrivacySettings({ demoId: 'test' }));

    // Should use defaults without crashing
    expect(result.current.privacySettings.retentionDays).toBe(30);
    expect(result.current.privacySettings.allowOptOut).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle special characters in URL params', () => {
    setURLSearchParams('?optOut=true&test=%20%21%40%23');
    const { result } = renderHook(() => usePrivacySettings({}));

    // Should parse boolean params correctly
    expect(result.current.privacySettings.allowOptOut).toBe(true);
  });

  it('should handle very large retentionDays values', () => {
    setURLSearchParams('?retentionDays=999999');
    const { result } = renderHook(() => usePrivacySettings({}));

    // Should validate and default to 30
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should handle all URL params set to false', () => {
    setURLSearchParams(
      '?optOut=false&privacyNotice=false&requireConsent=false&consentGiven=false'
    );
    const { result } = renderHook(() => usePrivacySettings({}));

    expect(result.current.privacySettings).toEqual({
      allowOptOut: false,
      showPrivacyNotice: false,
      requireConsent: false,
      consentGiven: false,
      retentionDays: 30,
    });
  });
});
