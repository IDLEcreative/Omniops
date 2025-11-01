/**
 * Utility functions for analytics
 */

import { LANGUAGE_KEYWORDS } from './constants';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const normaliseContent = (content: string) =>
  content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const containsPhrase = (content: string, phrases: string[]) =>
  phrases.some((phrase) => content.includes(phrase));

export const detectLanguage = (content: string): keyof typeof LANGUAGE_KEYWORDS | 'english' | 'other' => {
  const lowered = normaliseContent(content);

  for (const [language, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (containsPhrase(lowered, keywords)) {
      return language as keyof typeof LANGUAGE_KEYWORDS;
    }
  }

  // Basic heuristic: assume English if ASCII and no other trigger words
  if (/^[\x00-\x7F]*$/.test(content)) {
    return 'english';
  }

  return 'other';
};
