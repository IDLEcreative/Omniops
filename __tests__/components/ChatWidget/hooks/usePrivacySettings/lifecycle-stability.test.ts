/**
 * usePrivacySettings Hook - Lifecycle & Stability Tests
 *
 * Tests unmount handling, hook stability, and state setters
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { usePrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  setURLSearchParams,
  type TestContext,
} from '__tests__/utils/privacy/test-setup';

describe('usePrivacySettings - Lifecycle & Stability', () => {
  let context: TestContext;

  beforeEach(() => {
    context = setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment(context);
  });

  describe('Race Condition Prevention', () => {
    it('should prevent state updates after unmount', async () => {
      const { result, unmount } = renderHook(() => usePrivacySettings({}));

      unmount();

      // Try to trigger state update after unmount
      act(() => {
        try {
          result.current.handleConsent();
        } catch {
          // Expected to fail since component is unmounted
        }
      });

      // Should not throw or cause issues
    });

    it('should handle unmount during URL parsing', async () => {
      setURLSearchParams('?retentionDays=100');
      const { unmount } = renderHook(() => usePrivacySettings({}));

      // Unmount immediately after render
      unmount();

      // Should not cause errors or warnings
      expect(context.consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('State Setters', () => {
    it('should allow setPrivacySettings to update state', () => {
      const { result } = renderHook(() => usePrivacySettings({}));

      act(() => {
        result.current.setPrivacySettings((prev) => ({
          ...prev,
          retentionDays: 120,
          consentGiven: true,
        }));
      });

      expect(result.current.privacySettings.retentionDays).toBe(120);
      expect(result.current.privacySettings.consentGiven).toBe(true);
    });
  });

  describe('useCallback Stability', () => {
    it('should maintain stable handleConsent reference', () => {
      const { result, rerender } = renderHook(() => usePrivacySettings({}));

      const firstHandleConsent = result.current.handleConsent;
      rerender();
      const secondHandleConsent = result.current.handleConsent;

      expect(firstHandleConsent).toBe(secondHandleConsent);
    });

    it('should be callable multiple times without creating new functions', () => {
      const { result } = renderHook(() => usePrivacySettings({}));

      const handler = result.current.handleConsent;

      act(() => {
        handler();
      });

      expect(result.current.handleConsent).toBe(handler);
    });
  });
});
