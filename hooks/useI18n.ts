/**
 * useI18n Hook
 *
 * React hook for internationalization (UI translations only)
 * Chat responses are handled natively by GPT-4
 */

import { useState, useEffect, useCallback } from 'react';
import { t as translateFn, getAvailableLanguages, type LanguageCode as I18nLanguageCode, type Language } from '@/lib/i18n';
import { isRTL as checkRTL } from '@/lib/translation/language-detector';

export interface UseI18nOptions {
  initialLanguage?: I18nLanguageCode;
  persist?: boolean; // Save to localStorage
}

export interface UseI18nResult {
  language: I18nLanguageCode;
  setLanguage: (lang: I18nLanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
  availableLanguages: Language[];
}

const STORAGE_KEY = 'omniops_ui_language';

export function useI18n(options: UseI18nOptions = {}): UseI18nResult {
  const [language, setLanguageState] = useState<I18nLanguageCode>(() => {
    // Try to load from localStorage if persist is enabled
    if (options.persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored as I18nLanguageCode;
    }
    return options.initialLanguage || 'en';
  });

  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    setIsRTL(checkRTL(language as any));

    // Update HTML dir attribute for RTL support
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', checkRTL(language as any) ? 'rtl' : 'ltr');
    }
  }, [language]);

  const setLanguage = useCallback(
    (lang: I18nLanguageCode) => {
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
