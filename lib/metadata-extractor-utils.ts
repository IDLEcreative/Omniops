/**
 * Utility functions for metadata extraction
 */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for',
  'with', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'it', 'this', 'that', 'as', 'about', 'what', 'which', 'who', 'when',
  'where', 'how', 'why', 'you', 'your', 'we', 'our', 'they', 'their'
]);

/**
 * Extract category from URL path and content
 */
export function extractCategory(url: string, title: string, chunk: string): string | undefined {
  // Extract from URL path
  const urlParts = url.split('/').filter(p => p && !p.includes('.'));
  const categoryPatterns = [
    'automotive', 'electronics', 'clothing', 'tools', 'parts', 'accessories',
    'equipment', 'supplies', 'components', 'hardware', 'software'
  ];

  for (const part of urlParts) {
    for (const pattern of categoryPatterns) {
      if (part.toLowerCase().includes(pattern)) {
        return part.toLowerCase().replace(/-/g, ' ');
      }
    }
  }

  // Extract from title
  const titleLower = title.toLowerCase();
  for (const pattern of categoryPatterns) {
    if (titleLower.includes(pattern)) {
      return pattern;
    }
  }

  return undefined;
}

/**
 * Extract top keywords using TF-IDF-like scoring
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  // Tokenize and clean
  const words = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  // Count frequencies
  const frequencies = new Map<string, number>();
  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }

  // Sort by frequency and return top keywords
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Find section heading for a chunk
 */
export function findSectionHeading(fullContent: string, chunkIndex: number): string | undefined {
  // Simple approach: look for headings before this chunk
  const chunks = fullContent.split(/\n{2,}/);
  if (chunkIndex >= chunks.length) return undefined;

  // Look backwards for a heading-like line
  for (let i = chunkIndex - 1; i >= Math.max(0, chunkIndex - 5); i--) {
    const chunk = chunks[i];
    // Check if it looks like a heading (short, possibly capitalized)
    if (chunk && chunk.length < 100 && /^[A-Z]/.test(chunk) && !chunk.includes('.')) {
      return chunk.trim();
    }
  }

  return undefined;
}

/**
 * Check for structured data
 */
export function hasStructuredData(content: string): boolean {
  // Check for common structured data patterns
  const patterns = [
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i,
    /itemscope\s+itemtype=/i,
    /<meta[^>]*property=["']og:/i,
    /data-structured=/i
  ];

  return patterns.some(pattern => pattern.test(content));
}

/**
 * Simple language detection
 */
export function detectLanguage(text: string): string {
  // Very basic detection - in production, use a proper library
  const englishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'for'];
  const wordCount = text.toLowerCase().split(/\s+/).filter(w => englishWords.includes(w)).length;

  return wordCount > 5 ? 'en' : 'unknown';
}

/**
 * Calculate readability score (Flesch Reading Ease approximation)
 */
export function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    // Simple syllable counting (not perfect but good enough)
    return count + Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}
