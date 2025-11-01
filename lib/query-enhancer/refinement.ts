/**
 * Query Refinement
 * Spelling correction, related query generation, and confidence scoring
 */

import { SPELLING_CORRECTIONS } from './constants';
import type { QueryIntent, EnhancedQuery } from './types';

/**
 * Correct common spelling mistakes
 * Checks against known misspellings and patterns
 */
export function correctSpelling(query: string): Map<string, string> {
  const corrections = new Map<string, string>();
  const words = query.split(' ');

  for (const word of words) {
    // Check exact match
    if (SPELLING_CORRECTIONS[word]) {
      corrections.set(word, SPELLING_CORRECTIONS[word]);
    }

    // Check for common patterns
    // Double letters that should be single
    const doubleLetterFixed = word.replace(/([^aeiou])\1{2,}/g, '$1$1');
    if (doubleLetterFixed !== word && SPELLING_CORRECTIONS[doubleLetterFixed]) {
      corrections.set(word, SPELLING_CORRECTIONS[doubleLetterFixed]);
    }
  }

  return corrections;
}

/**
 * Generate related queries based on intent
 * Creates intent-specific query suggestions
 */
export function generateRelatedQueries(query: string, intent: QueryIntent): string[] {
  const related: string[] = [];

  switch (intent) {
    case 'troubleshooting':
      related.push(`how to fix ${query}`);
      related.push(`${query} troubleshooting guide`);
      related.push(`common ${query} problems`);
      break;

    case 'transactional':
      related.push(`buy ${query}`);
      related.push(`${query} price`);
      related.push(`${query} in stock`);
      break;

    case 'informational':
      related.push(`${query} guide`);
      related.push(`${query} specifications`);
      related.push(`${query} manual`);
      break;

    case 'comparison':
      related.push(`${query} alternatives`);
      related.push(`best ${query}`);
      related.push(`${query} reviews`);
      break;
  }

  return related;
}

/**
 * Calculate confidence score for the query understanding
 * Scores based on recognized entities and query clarity
 */
export function calculateConfidence(query: string, entities: EnhancedQuery['entities']): number {
  let score = 0.5; // Base score

  // Boost for recognized entities
  if (entities.skus.length > 0) score += 0.2;
  if (entities.brands.length > 0) score += 0.1;
  if (entities.products.length > 0) score += 0.1;

  // Boost for clear intent
  const words = query.split(' ');
  if (words.length >= 3) score += 0.1; // More context

  return Math.min(score, 1.0);
}
