/**
 * @jest-environment jsdom
 */
/**
 * usePrivacySettings Hook - Demo Mode Tests
 *
 * Tests demo mode behavior with URL parsing suppression
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

describe('usePrivacySettings - demoId Behavior', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should skip URL parsing when demoId is present', () => {
    setURLSearchParams('?retentionDays=90&requireConsent=true');

    const { result } = renderHook(() =>
      usePrivacySettings({ demoId: 'demo_123' })
    );

    // Should use defaults, not URL params
    expect(result.current.privacySettings.retentionDays).toBe(30);
    expect(result.current.privacySettings.requireConsent).toBe(false);
  });

  it('should use only propPrivacySettings in demo mode', () => {
    setURLSearchParams('?retentionDays=90');

    const propSettings: Partial<PrivacySettings> = {
      retentionDays: 60,
      requireConsent: true,
    };

    const { result } = renderHook(() =>
      usePrivacySettings({
        demoId: 'demo_456',
        propPrivacySettings: propSettings,
      })
    );

    expect(result.current.privacySettings.retentionDays).toBe(60);
    expect(result.current.privacySettings.requireConsent).toBe(true);
  });
});
