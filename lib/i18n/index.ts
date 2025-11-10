/**
 * i18n (Internationalization) Utilities
 *
 * Simple JSON-based translation system for UI elements
 * Chat responses are handled natively by GPT-4
 */

// Import translation files
import en from './translations/en.json';
import es from './translations/es.json';
import ar from './translations/ar.json';

export type LanguageCode = 'en' | 'es' | 'ar';

type TranslationKey = string;
type Translations = Record<string, any>;

const translations: Record<LanguageCode, Translations> = {
  en,
  es,
  ar,
};

export interface Language {
  code: LanguageCode;
  name: string;
  native: string;
  rtl: boolean;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', rtl: false },
  { code: 'es', name: 'Spanish', native: 'Español', rtl: false },
  { code: 'ar', name: 'Arabic', native: 'العربية', rtl: true },
];

/**
 * Get translation for a key
 */
export function t(key: TranslationKey, language: LanguageCode = 'en'): string {
  const lang = translations[language] || translations.en;

  // Support nested keys like "chat.placeholder"
  const keys = key.split('.');
  let value: any = lang;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  // Fallback to English if translation missing
  if (value === undefined) {
    let fallback: any = translations.en;
    for (const k of keys) {
      fallback = fallback?.[k];
      if (fallback === undefined) break;
    }
    return fallback || key;
  }

  return value;
}

/**
 * Get all available languages with metadata
 */
export function getAvailableLanguages(): Language[] {
  return AVAILABLE_LANGUAGES;
}

/**
 * Check if language has translations
 */
export function hasTranslations(language: string): boolean {
  return language in translations;
}

/**
 * Check if a language is RTL (right-to-left)
 */
export function checkRTL(language: LanguageCode): boolean {
  return AVAILABLE_LANGUAGES.find(l => l.code === language)?.rtl ?? false;
}
