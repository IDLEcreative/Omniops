/**
 * usePrivacySettings Hook - URL Parameter Parsing Tests
 *
 * Tests URL parameter parsing and prop precedence
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePrivacySettings, type PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setURLSearchParams,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - URL Parameter Parsing', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should parse optOut from URL correctly', () => {
    setURLSearchParams('?optOut=true');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.allowOptOut).toBe(true);
  });

  it('should parse privacyNotice from URL', () => {
    setURLSearchParams('?privacyNotice=true');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.showPrivacyNotice).toBe(true);
  });

  it('should parse requireConsent from URL', () => {
    setURLSearchParams('?requireConsent=true');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.requireConsent).toBe(true);
  });

  it('should parse consentGiven from URL', () => {
    setURLSearchParams('?consentGiven=true');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.consentGiven).toBe(true);
  });

  it('should parse retentionDays from URL', () => {
    setURLSearchParams('?retentionDays=90');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(90);
  });

  it('should merge URL params with defaults', () => {
    setURLSearchParams('?requireConsent=true&retentionDays=45');
    const { result } = renderHook(() => usePrivacySettings({}));

    expect(result.current.privacySettings).toEqual({
      allowOptOut: false,
      showPrivacyNotice: false,
      requireConsent: true,
      consentGiven: false,
      retentionDays: 45,
    });
  });

  it('should allow props to override URL params', () => {
    setURLSearchParams('?retentionDays=90&requireConsent=true');

    const propSettings: Partial<PrivacySettings> = {
      retentionDays: 60,
      requireConsent: false,
    };

    const { result } = renderHook(() =>
      usePrivacySettings({ propPrivacySettings: propSettings })
    );

    expect(result.current.privacySettings.retentionDays).toBe(60);
    expect(result.current.privacySettings.requireConsent).toBe(false);
  });
});
