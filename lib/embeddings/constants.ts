/**
 * Constants for embeddings and search operations
 */

// Keyword search constants
export const COMMON_WORDS = [
  'products',
  'items',
  'all',
  'the',
  'a',
  'an',
  'show',
  'me',
  'list',
];

// Search thresholds and limits
export const MIN_KEYWORD_RESULTS = 3;
export const DEFAULT_SEARCH_LIMIT = 5;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.15;
export const DEFAULT_TIMEOUT_MS = 10000;

// Timeout configurations (in milliseconds)
export const TIMEOUTS = {
  DOMAIN_LOOKUP: 100,
  KEYWORD_SEARCH: 3000,
  EMBEDDING_GENERATION: 2000,
  VECTOR_SEARCH: 5000,
  FALLBACK_SEARCH: 3000,
} as const;
