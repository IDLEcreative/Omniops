/**
 * Query Enhancer - Proxy Export
 *
 * This file maintains backward compatibility while the implementation
 * has been refactored into a modular structure in lib/query-enhancer/
 *
 * Original file: 405 LOC (backed up to .old)
 * New structure: 7 focused modules totaling ~447 LOC
 */

export {
  type QueryIntent,
  type EnhancedQuery,
  SYNONYM_MAP,
  INTENT_PATTERNS,
  SPELLING_CORRECTIONS,
  QueryEnhancer,
} from './query-enhancer/';
