import { useState, useEffect, useCallback, useRef } from 'react';

export interface PrivacySettings {
  allowOptOut: boolean;
  showPrivacyNotice: boolean;
  requireConsent: boolean;
  consentGiven: boolean;
  retentionDays: number;
}

export interface UsePrivacySettingsProps {
  propPrivacySettings?: Partial<PrivacySettings>;
  demoId?: string;
  initialOpen?: boolean;
  forceClose?: boolean;
}

export interface PrivacySettingsState {
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  handleConsent: () => void;
  error: Error | null;
}

/**
 * Validates retentionDays to be a positive integer between 1 and 365
 * Returns 30 (default) if invalid
 */
function validateRetentionDays(value: number): number {
  if (isNaN(value) || value < 1 || value > 365) {
    return 30;
  }
  return value;
}

/**
 * Manages privacy settings including consent and retention
 * Handles URL parameter parsing for privacy options
 *
 * Features:
 * - Parses privacy settings from URL parameters
 * - Validates retentionDays (1-365 range)
 * - Handles consent state and parent window messaging
 * - Prevents race conditions on unmount
 * - Production-safe logging
 *
 * @param propPrivacySettings - Privacy settings from props (override URL)
 * @param demoId - Demo mode identifier (skips URL parsing)
 * @returns Privacy state and handlers
 */
export function usePrivacySettings({
  propPrivacySettings,
  demoId,
  initialOpen,
  forceClose,
}: UsePrivacySettingsProps): PrivacySettingsState {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    consentGiven: false,
    retentionDays: 30,
    ...propPrivacySettings,
  });
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Parse privacy settings from URL params if in embed mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !demoId) {
      try {
        const params = new URLSearchParams(window.location.search);

        // Parse retention days with validation
        let retentionDays = parseInt(params.get('retentionDays') || '30');
        retentionDays = validateRetentionDays(retentionDays);

        // Parse privacy settings from URL
        const urlPrivacySettings = {
          allowOptOut: params.get('optOut') === 'true',
          showPrivacyNotice: params.get('privacyNotice') === 'true',
          requireConsent: params.get('requireConsent') === 'true',
          consentGiven: params.get('consentGiven') === 'true',
          retentionDays,
        };

        // Check if still mounted before updating state
        if (!isMountedRef.current) return;

        // Merge URL settings with prop settings (props take precedence)
        setPrivacySettings((prev) => ({
          ...prev,
          ...urlPrivacySettings,
          ...propPrivacySettings,
        }));
      } catch (err) {
        if (!isMountedRef.current) return;

        const error = err instanceof Error ? err : new Error('Failed to parse privacy settings');
        setError(error);

        if (process.env.NODE_ENV === 'development') {
          console.error('[usePrivacySettings] Error parsing URL params:', error);
        }
      }
    }

    // Cleanup: mark as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, [demoId, propPrivacySettings]);

  // Memoized consent handler
  const handleConsent = useCallback(() => {
    setPrivacySettings((prev) => ({ ...prev, consentGiven: true }));

    try {
      const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      window.parent.postMessage(
        {
          type: 'privacy',
          action: 'giveConsent',
        },
        targetOrigin
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[usePrivacySettings] Consent given, message posted to parent');
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[usePrivacySettings] Error posting consent message:', err);
      }
    }
  }, []);

  return {
    privacySettings,
    setPrivacySettings,
    handleConsent,
    error,
  };
}
