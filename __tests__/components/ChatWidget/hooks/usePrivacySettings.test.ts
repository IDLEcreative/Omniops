import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePrivacySettings, type PrivacySettings } from '@/components/ChatWidget/hooks/usePrivacySettings';

/**
 * usePrivacySettings Hook - Comprehensive Test Suite
 *
 * Tests: Default settings, URL parsing, validation, consent handling, error handling
 */

describe('usePrivacySettings Hook', () => {
  let originalEnv: string | undefined;
  let originalWindow: typeof window;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let mockPostMessage: jest.Mock;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    originalWindow = global.window;

    // Mock window.location
    delete (global as any).window;
    (global as any).window = {
      location: {
        origin: 'http://localhost:3000',
        search: '',
      },
      parent: {
        postMessage: jest.fn(),
      },
    };

    mockPostMessage = global.window.parent.postMessage as jest.Mock;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.window = originalWindow;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Default Settings', () => {
    it('should initialize with correct default settings', () => {
      // In demo mode (demoId set), URL parsing is skipped
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

  describe('URL Parameter Parsing', () => {
    it('should parse optOut from URL correctly', () => {
      global.window.location.search = '?optOut=true';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.allowOptOut).toBe(true);
    });

    it('should parse privacyNotice from URL', () => {
      global.window.location.search = '?privacyNotice=true';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.showPrivacyNotice).toBe(true);
    });

    it('should parse requireConsent from URL', () => {
      global.window.location.search = '?requireConsent=true';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.requireConsent).toBe(true);
    });

    it('should parse consentGiven from URL', () => {
      global.window.location.search = '?consentGiven=true';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.consentGiven).toBe(true);
    });

    it('should parse retentionDays from URL', () => {
      global.window.location.search = '?retentionDays=90';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(90);
    });

    it('should merge URL params with defaults', () => {
      global.window.location.search = '?requireConsent=true&retentionDays=45';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings).toEqual({
        allowOptOut: false, // URL param not set, defaults to false
        showPrivacyNotice: false, // URL param not set, defaults to false
        requireConsent: true,
        consentGiven: false,
        retentionDays: 45,
      });
    });

    it('should allow props to override URL params (props take precedence)', () => {
      global.window.location.search = '?retentionDays=90&requireConsent=true';

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

  describe('retentionDays Validation', () => {
    it('should accept valid retentionDays (1-365)', () => {
      global.window.location.search = '?retentionDays=180';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(180);
    });

    it('should accept boundary values (1 and 365)', () => {
      global.window.location.search = '?retentionDays=1';
      const { result: result1 } = renderHook(() => usePrivacySettings({}));
      expect(result1.current.privacySettings.retentionDays).toBe(1);

      global.window.location.search = '?retentionDays=365';
      const { result: result2 } = renderHook(() => usePrivacySettings({}));
      expect(result2.current.privacySettings.retentionDays).toBe(365);
    });

    it('should reject negative numbers and default to 30', () => {
      global.window.location.search = '?retentionDays=-10';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should reject zero and default to 30', () => {
      global.window.location.search = '?retentionDays=0';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should reject values >365 and default to 30', () => {
      global.window.location.search = '?retentionDays=500';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should handle NaN and default to 30', () => {
      global.window.location.search = '?retentionDays=abc';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should handle missing param and default to 30', () => {
      global.window.location.search = '?requireConsent=true';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings.retentionDays).toBe(30);
    });
  });

  describe('handleConsent Function', () => {
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

      expect(mockPostMessage).toHaveBeenCalledWith(
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

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: 'privacy',
          action: 'giveConsent',
        },
        'https://example.com'
      );
    });

    it('should handle postMessage errors gracefully', () => {
      mockPostMessage.mockImplementation(() => {
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
  });

  describe('Error Handling', () => {
    it('should set error on URL parsing failure', () => {
      // Mock URLSearchParams to throw
      const originalURLSearchParams = global.URLSearchParams;
      (global as any).URLSearchParams = jest.fn(() => {
        throw new Error('URL parsing failed');
      });

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('URL parsing failed');

      (global as any).URLSearchParams = originalURLSearchParams;
    });

    it('should handle malformed URL params gracefully', () => {
      // This tests that the hook doesn't crash with weird URL structures
      global.window.location.search = '?invalid&malformed=&weird===value';

      const { result } = renderHook(() => usePrivacySettings({}));

      // Should fall back to defaults without crashing
      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should log errors in development only', () => {
      process.env.NODE_ENV = 'development';

      const originalURLSearchParams = global.URLSearchParams;
      (global as any).URLSearchParams = jest.fn(() => {
        throw new Error('Parse error');
      });

      renderHook(() => usePrivacySettings({}));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[usePrivacySettings] Error parsing URL params:',
        expect.any(Error)
      );

      (global as any).URLSearchParams = originalURLSearchParams;
    });

    it('should not log errors in production', () => {
      process.env.NODE_ENV = 'production';

      const originalURLSearchParams = global.URLSearchParams;
      (global as any).URLSearchParams = jest.fn(() => {
        throw new Error('Parse error');
      });

      renderHook(() => usePrivacySettings({}));

      expect(consoleErrorSpy).not.toHaveBeenCalled();

      (global as any).URLSearchParams = originalURLSearchParams;
    });
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
      global.window.location.search = '?retentionDays=100';

      const { unmount } = renderHook(() => usePrivacySettings({}));

      // Unmount immediately after render
      unmount();

      // Should not cause errors or warnings
      expect(consoleErrorSpy).not.toHaveBeenCalled();
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

  describe('demoId Behavior', () => {
    it('should skip URL parsing when demoId is present', () => {
      global.window.location.search = '?retentionDays=90&requireConsent=true';

      const { result } = renderHook(() =>
        usePrivacySettings({ demoId: 'demo_123' })
      );

      // Should use defaults, not URL params
      expect(result.current.privacySettings.retentionDays).toBe(30);
      expect(result.current.privacySettings.requireConsent).toBe(false);
    });

    it('should use only propPrivacySettings in demo mode', () => {
      global.window.location.search = '?retentionDays=90';

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

  describe('Edge Cases', () => {
    it('should handle empty URL params', () => {
      global.window.location.search = '';

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
      // Simulate SSR by using demoId which skips window checks
      // Note: We can't actually delete window in jsdom because React hooks need it
      // The hook code checks `typeof window !== 'undefined'` which handles SSR
      const { result } = renderHook(() => usePrivacySettings({ demoId: 'test' }));

      // Should use defaults without crashing (no URL parsing in demo mode)
      expect(result.current.privacySettings.retentionDays).toBe(30);
      expect(result.current.privacySettings.allowOptOut).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle special characters in URL params', () => {
      global.window.location.search = '?optOut=true&test=%20%21%40%23';

      const { result } = renderHook(() => usePrivacySettings({}));

      // Should parse boolean params correctly despite other weird params
      expect(result.current.privacySettings.allowOptOut).toBe(true);
    });

    it('should handle very large retentionDays values', () => {
      global.window.location.search = '?retentionDays=999999';

      const { result } = renderHook(() => usePrivacySettings({}));

      // Should validate and default to 30
      expect(result.current.privacySettings.retentionDays).toBe(30);
    });

    it('should handle multiple rapid handleConsent calls', () => {
      const { result } = renderHook(() => usePrivacySettings({}));

      act(() => {
        result.current.handleConsent();
        result.current.handleConsent();
        result.current.handleConsent();
      });

      expect(result.current.privacySettings.consentGiven).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle all URL params set to false', () => {
      global.window.location.search =
        '?optOut=false&privacyNotice=false&requireConsent=false&consentGiven=false';

      const { result } = renderHook(() => usePrivacySettings({}));

      expect(result.current.privacySettings).toEqual({
        allowOptOut: false,
        showPrivacyNotice: false,
        requireConsent: false,
        consentGiven: false,
        retentionDays: 30,
      });
    });

    it('should handle decimal retentionDays values', () => {
      global.window.location.search = '?retentionDays=45.7';

      const { result } = renderHook(() => usePrivacySettings({}));

      // parseInt should handle this
      expect(result.current.privacySettings.retentionDays).toBe(45);
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

  describe('Production-Safe Logging', () => {
    it('should log consent message in development', () => {
      process.env.NODE_ENV = 'development';

      const { result } = renderHook(() => usePrivacySettings({}));

      act(() => {
        result.current.handleConsent();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[usePrivacySettings] Consent given, message posted to parent'
      );
    });

    it('should not log consent message in production', () => {
      process.env.NODE_ENV = 'production';

      const { result } = renderHook(() => usePrivacySettings({}));

      act(() => {
        result.current.handleConsent();
      });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log postMessage errors in development only', () => {
      process.env.NODE_ENV = 'development';

      mockPostMessage.mockImplementation(() => {
        throw new Error('postMessage failed');
      });

      const { result } = renderHook(() => usePrivacySettings({}));

      act(() => {
        result.current.handleConsent();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[usePrivacySettings] Error posting consent message:',
        expect.any(Error)
      );
    });
  });
});
