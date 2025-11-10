import { useState, useEffect } from 'react';

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
}

/**
 * Manages privacy settings including consent and retention
 * Handles URL parameter parsing for privacy options
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

  // Parse privacy settings from URL params if in embed mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !demoId) {
      const params = new URLSearchParams(window.location.search);

      // Parse privacy settings from URL
      const urlPrivacySettings = {
        allowOptOut: params.get('optOut') === 'true',
        showPrivacyNotice: params.get('privacyNotice') === 'true',
        requireConsent: params.get('requireConsent') === 'true',
        consentGiven: params.get('consentGiven') === 'true',
        retentionDays: parseInt(params.get('retentionDays') || '30'),
      };

      // Merge URL settings with prop settings
      setPrivacySettings((prev) => ({
        ...prev,
        ...urlPrivacySettings,
        ...propPrivacySettings,
      }));
    }
  }, [demoId, propPrivacySettings]);

  const handleConsent = () => {
    setPrivacySettings((prev) => ({ ...prev, consentGiven: true }));
    const targetOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    window.parent.postMessage(
      {
        type: 'privacy',
        action: 'giveConsent',
      },
      targetOrigin
    );
  };

  return {
    privacySettings,
    setPrivacySettings,
    handleConsent,
  };
}
