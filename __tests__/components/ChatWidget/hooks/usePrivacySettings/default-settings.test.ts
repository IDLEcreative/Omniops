/**
 * @jest-environment jsdom
 */
/**
 * usePrivacySettings Hook - Default Settings Tests
 *
 * Tests default initialization and prop overrides
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { usePrivacySettings, type PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - Default Settings', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should initialize with correct default settings', () => {
    const { result } = renderHook(() => usePrivacySettings({ demoId: 'test' }));

    expect(result.current.privacySettings).toEqual({
      allowOptOut: true,
      showPrivacyNotice: true,
      requireConsent: false,
      consentGiven: false,
      retentionDays: 30,
    });
    expect(result.current.error).toBeNull();
  });

  it('should apply propPrivacySettings over defaults', () => {
    const propSettings: Partial<PrivacySettings> = {
      allowOptOut: false,
      requireConsent: true,
      retentionDays: 60,
    };

    const { result } = renderHook(() =>
      usePrivacySettings({ propPrivacySettings: propSettings, demoId: 'test' })
    );

    expect(result.current.privacySettings).toEqual({
      allowOptOut: false,
      showPrivacyNotice: true,
      requireConsent: true,
      consentGiven: false,
      retentionDays: 60,
    });
  });

  it('should handle missing propPrivacySettings', () => {
    const { result } = renderHook(() => usePrivacySettings({ demoId: 'test' }));

    expect(result.current.privacySettings.retentionDays).toBe(30);
    expect(result.current.privacySettings.allowOptOut).toBe(true);
  });
});
