/**
 * Language Detection Service
 *
 * Detects user language from text input using GPT-4
 * and browser/system preferences
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15 * 1000,    // 15 seconds (translation needs 3-8s normally)
  maxRetries: 2,          // Retry failed requests twice
});

// ISO 639-1 language codes for 40+ supported languages
export const SUPPORTED_LANGUAGES = {
  // European
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  uk: 'Ukrainian',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sr: 'Serbian',
  sl: 'Slovenian',
  el: 'Greek',
  tr: 'Turkish',

  // Asian
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese',
  ko: 'Korean',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',

  // Middle Eastern & RTL
  ar: 'Arabic',
  he: 'Hebrew',
  fa: 'Persian',
  ur: 'Urdu',

  // Other
  sw: 'Swahili',
  af: 'Afrikaans',
  zu: 'Zulu',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// RTL (right-to-left) languages
export const RTL_LANGUAGES: LanguageCode[] = ['ar', 'he', 'fa', 'ur'];

/**
 * Detect language from text using GPT-4
 */
export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    // Quick check: if text is very short or all ASCII, likely English
    if (text.length < 10 || /^[\x00-\x7F]*$/.test(text)) {
      return 'en';
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a language detection expert. Analyze the text and return ONLY the ISO 639-1 language code (e.g., "en", "es", "fr", "ar", "zh"). No explanation, just the code.

Supported codes: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });

    const detected = response.choices[0]?.message?.content?.trim().toLowerCase();

    // Validate detected language is supported
    if (detected && detected in SUPPORTED_LANGUAGES) {
      return detected as LanguageCode;
    }

    // Fallback to English
    return 'en';
  } catch (error) {
    console.error('[LanguageDetector] Detection error:', error);
    return 'en'; // Default fallback
  }
}

/**
 * Check if language uses right-to-left text direction
 */
export function isRTL(languageCode: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(languageCode);
}

/**
 * Get language name from code
 */
export function getLanguageName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code] || 'Unknown';
}

/**
 * Detect language from browser/system preferences
 */
export function detectBrowserLanguage(
  acceptLanguage?: string
): LanguageCode {
  if (!acceptLanguage) return 'en';

  // Parse Accept-Language header
  // Format: "en-US,en;q=0.9,es;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [codeRaw, qValue] = lang.trim().split(';');
      if (!codeRaw) return null;
      const qValuePart = qValue?.split('=')[1];
      const q = qValuePart ? parseFloat(qValuePart) : 1.0;
      const codePart = codeRaw.split('-')[0];
      if (!codePart) return null;
      const code = codePart.toLowerCase();
      return { code, q };
    })
    .filter((item): item is { code: string; q: number } => item !== null)
    .sort((a, b) => b.q - a.q);

  // Find first supported language
  for (const { code } of languages) {
    if (code in SUPPORTED_LANGUAGES) {
      return code as LanguageCode;
    }
  }

  return 'en';
}

/**
 * Validate language code
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}
