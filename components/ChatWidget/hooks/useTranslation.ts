/**
 * Translation Hook for Chat Widget
 *
 * Provides translation functions and language management for the widget.
 * Reads language preference from localStorage and provides t() function for translations.
 */

import { useState, useEffect, useCallback } from 'react';
import { t as translate, type LanguageCode, getAvailableLanguages, checkRTL } from '@/lib/i18n';

interface UseTranslationReturn {
  /** Current language code */
  language: LanguageCode;
  /** Translation function */
  t: (key: string) => string;
  /** Change current language */
  changeLanguage: (newLanguage: LanguageCode) => void;
  /** Available languages */
  availableLanguages: ReturnType<typeof getAvailableLanguages>;
  /** Whether current language is RTL */
  isRTL: boolean;
}

/**
 * Hook for accessing translations in the widget
 *
 * Usage:
 * ```typescript
 * const { t, language, changeLanguage } = useTranslation();
 *
 * return <input placeholder={t('chat.placeholder')} />;
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('omniops_ui_language') as LanguageCode | null;
      if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'es' || storedLanguage === 'ar')) {
        setLanguage(storedLanguage);
      } else {
        // Detect browser language
        const browserLang = navigator.language.substring(0, 2) as LanguageCode;
        if (browserLang === 'en' || browserLang === 'es' || browserLang === 'ar') {
          setLanguage(browserLang);
        }
      }
    }
  }, []);

  // Translation function that uses current language
  const t = useCallback((key: string): string => {
    return translate(key, language);
  }, [language]);

  // Change language and persist to localStorage
  const changeLanguage = useCallback((newLanguage: LanguageCode) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('omniops_ui_language', newLanguage);
      console.log(`[i18n] Language changed: ${newLanguage}, translations loaded`);

      // Notify parent window of language change (for analytics)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'language_changed',
          language: newLanguage,
        }, '*');
      }
    }
  }, []);

  return {
    language,
    t,
    changeLanguage,
    availableLanguages: getAvailableLanguages(),
    isRTL: checkRTL(language),
  };
}
