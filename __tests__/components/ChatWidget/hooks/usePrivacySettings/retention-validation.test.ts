/**
 * usePrivacySettings Hook - Retention Days Validation Tests
 *
 * Tests retentionDays parameter validation and boundary conditions
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

describe('usePrivacySettings - retentionDays Validation', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  it('should accept valid retentionDays (1-365)', () => {
    setURLSearchParams('?retentionDays=180');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(180);
  });

  it('should accept boundary values (1 and 365)', () => {
    setURLSearchParams('?retentionDays=1');
    const { result: result1 } = renderHook(() => usePrivacySettings({}));
    expect(result1.current.privacySettings.retentionDays).toBe(1);

    setURLSearchParams('?retentionDays=365');
    const { result: result2 } = renderHook(() => usePrivacySettings({}));
    expect(result2.current.privacySettings.retentionDays).toBe(365);
  });

  it('should reject negative numbers and default to 30', () => {
    setURLSearchParams('?retentionDays=-10');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should reject zero and default to 30', () => {
    setURLSearchParams('?retentionDays=0');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should reject values >365 and default to 30', () => {
    setURLSearchParams('?retentionDays=500');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should handle NaN and default to 30', () => {
    setURLSearchParams('?retentionDays=abc');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should handle missing param and default to 30', () => {
    setURLSearchParams('?requireConsent=true');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(30);
  });

  it('should handle decimal retentionDays values', () => {
    setURLSearchParams('?retentionDays=45.7');
    const { result } = renderHook(() => usePrivacySettings({}));
    expect(result.current.privacySettings.retentionDays).toBe(45);
  });
});
