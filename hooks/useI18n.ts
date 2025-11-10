/**
 * useI18n Hook
 *
 * React hook for internationalization (UI translations only)
 * Chat responses are handled natively by GPT-4
 */

import { useState, useEffect, useCallback } from 'react';
import { t as translateFn, getAvailableLanguages } from '@/lib/i18n';
import { type LanguageCode, isRTL as checkRTL } from '@/lib/translation/language-detector';

export interface UseI18nOptions {
  initialLanguage?: LanguageCode;
  persist?: boolean; // Save to localStorage
}

export interface UseI18nResult {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
  availableLanguages: LanguageCode[];
}

const STORAGE_KEY = 'omniops_ui_language';

export function useI18n(options: UseI18nOptions = {}): UseI18nResult {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Try to load from localStorage if persist is enabled
    if (options.persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored as LanguageCode;
    }
    return options.initialLanguage || 'en';
  });

  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    setIsRTL(checkRTL(language));

    // Update HTML dir attribute for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', checkRTL(language) ? 'rtl' : 'ltr');
    }
  }, [language]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      setLanguageState(lang);

      // Persist to localStorage if enabled
      if (options.persist && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    },
    [options.persist]
  );

  const t = useCallback(
    (key: string) => {
      return translateFn(key, language);
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
    isRTL,
    availableLanguages: getAvailableLanguages(),
  };
}
