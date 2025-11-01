import { PrivacyPreferences } from './types';

export const PRIVACY_KEY = 'chat_widget_privacy';

const defaultPrefs: PrivacyPreferences = {
  optedOut: false,
  consentGiven: false,
};

export function getPrivacyPreferences(): PrivacyPreferences {
  try {
    const raw = localStorage.getItem(PRIVACY_KEY);
    if (!raw) return { ...defaultPrefs };
    const parsed = JSON.parse(raw) as PrivacyPreferences;
    return {
      optedOut: Boolean(parsed?.optedOut),
      consentGiven: Boolean(parsed?.consentGiven),
    };
  } catch {
    return { ...defaultPrefs };
  }
}

export function savePrivacyPreferences(prefs: PrivacyPreferences): void {
  try {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
  } catch {
    // Swallow storage errors (e.g. quota, private mode)
  }
}

