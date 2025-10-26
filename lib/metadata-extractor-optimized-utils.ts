/**
 * Metadata Extraction Utilities
 * Helper functions for content analysis and classification
 */

import { ContentType } from './metadata-extractor-optimized';
import { PATTERNS } from './metadata-extractor-optimized-parsers';

/**
 * Stop words for keyword extraction (O(1) lookup)
 */
export const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for',
  'with', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'it', 'this', 'that', 'as', 'about', 'what', 'which', 'who', 'when',
  'where', 'how', 'why', 'you', 'your', 'we', 'our', 'they', 'their'
]);

/**
 * Common brand names (O(1) lookup)
 */
export const BRANDS = new Set([
  'Samsung', 'Apple', 'Sony', 'Microsoft', 'Google', 'Amazon',
  'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Ryobi',
  'Ford', 'Toyota', 'Honda', 'BMW', 'Mercedes'
]);

/**
 * Classify content based on URL, title, and content
 */
export function classifyContent(chunk: string, url: string, title: string): ContentType {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // URL-based classification (fastest)
  if (lowerUrl.includes('/product') || lowerUrl.includes('/shop')) return 'product';
  if (lowerUrl.includes('/faq') || lowerUrl.includes('/questions')) return 'faq';
  if (lowerUrl.includes('/docs') || lowerUrl.includes('/guide')) return 'documentation';
  if (lowerUrl.includes('/blog') || lowerUrl.includes('/article')) return 'blog';
  if (lowerUrl.includes('/support') || lowerUrl.includes('/help')) return 'support';

  // Title-based classification
  if (lowerTitle.includes('product') || lowerTitle.includes('shop')) return 'product';
  if (lowerTitle.includes('faq') || lowerTitle.includes('question')) return 'faq';
  if (lowerTitle.includes('guide') || lowerTitle.includes('documentation')) return 'documentation';
  if (lowerTitle.includes('blog') || lowerTitle.includes('article')) return 'blog';

  // Content-based only if needed (expensive)
  const lowerChunk = chunk.toLowerCase();
  if (PATTERNS.price.test(chunk) && PATTERNS.sku.test(chunk)) return 'product';
  if (lowerChunk.includes('frequently asked') || lowerChunk.includes('q:')) return 'faq';

  return 'general';
}

/**
 * Extract category from URL or title
 */
export function extractCategory(url: string, title: string): string | undefined {
  const urlParts = url.split('/').filter(p => p && !p.includes('.'));
  const categories = ['automotive', 'electronics', 'clothing', 'tools', 'parts'];

  // Check URL parts
  for (const part of urlParts) {
    const lower = part.toLowerCase();
    for (const cat of categories) {
      if (lower.includes(cat)) return cat;
    }
  }

  // Check title
  const titleLower = title.toLowerCase();
  for (const cat of categories) {
    if (titleLower.includes(cat)) return cat;
  }

  return undefined;
}

/**
 * Extract keywords from word array (optimized)
 */
export function extractKeywords(words: string[], limit: number = 10): string[] {
  const frequencies = new Map<string, number>();

  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^\w-]/g, '');
    if (lower.length >= 3 && !STOP_WORDS.has(lower)) {
      frequencies.set(lower, (frequencies.get(lower) || 0) + 1);
    }
  }

  // Use array sort (faster for small sets)
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Calculate readability score
 */
export function calculateReadability(text: string, words: string[]): number {
  // Quick approximation - avoid expensive operations
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const avgWordsPerSentence = words.length / sentences;

  // Simplified syllable count (vowel groups)
  let totalSyllables = 0;
  for (const word of words) {
    const vowelGroups = word.toLowerCase().match(/[aeiou]+/g);
    totalSyllables += vowelGroups ? vowelGroups.length : 1;
  }
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease (simplified)
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, score));
}

/**
 * Detect currency from text
 */
export function detectCurrency(chunk: string): string {
  if (chunk.includes('£')) return 'GBP';
  if (chunk.includes('€')) return 'EUR';
  return 'USD';
}
