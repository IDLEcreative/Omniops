/**
 * Query parsing utilities for search term extraction
 */

/**
 * Parse query into individual search terms
 * Handles quoted phrases and filters out stop words
 */
export function parseQueryTerms(query: string): string[] {
  // Handle quoted phrases
  const quotedPhrases: string[] = [];
  const withoutQuotes = query.replace(/"([^"]+)"/g, (_, phrase) => {
    quotedPhrases.push(phrase);
    return '';
  });

  // Split remaining text into words
  const words = withoutQuotes
    .split(/\s+/)
    .filter(w => w.length > 0)
    .filter(w => !isStopWord(w));

  return [...quotedPhrases, ...words];
}

/**
 * Check if a word is a common stop word
 */
export function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by',
    'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was',
    'will', 'with', 'or', 'not'
  ]);
  return stopWords.has(word.toLowerCase());
}
