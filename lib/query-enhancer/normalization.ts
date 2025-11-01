/**
 * Query Normalization and Intent Detection
 * Normalizes queries and detects user intent
 */

import { INTENT_PATTERNS } from './constants';
import type { QueryIntent } from './types';

/**
 * Normalize query for processing
 * Lowercases, removes special chars, normalizes whitespace
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s\-\$£€]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect user intent from query
 * Analyzes query against intent patterns and returns highest-scoring intent
 */
export function detectIntent(query: string): QueryIntent {
  const scores: Record<QueryIntent, number> = {
    informational: 0,
    transactional: 0,
    navigational: 0,
    troubleshooting: 0,
    comparison: 0
  };

  // Check each pattern and score
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        scores[intent as QueryIntent] += 1;
      }
    }
  }

  // Return intent with highest score, default to informational
  let maxIntent: QueryIntent = 'informational';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as QueryIntent;
    }
  }

  return maxIntent;
}
