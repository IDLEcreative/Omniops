/**
 * Query Enhancer - Main Export
 * Composed from modular components
 *
 * Original file: lib/query-enhancer.ts (405 LOC)
 * Refactored into 7 focused modules:
 * - types.ts (24 LOC) - Type definitions
 * - constants.ts (92 LOC) - Synonym maps, intent patterns, spelling corrections
 * - normalization.ts (55 LOC) - Query normalization and intent detection
 * - expansion.ts (70 LOC) - Query expansion and synonym finding
 * - entities.ts (63 LOC) - Entity extraction (SKUs, brands, products)
 * - refinement.ts (96 LOC) - Spelling correction, related queries, confidence
 * - search-application.ts (47 LOC) - Search term application
 */

import { normalizeQuery, detectIntent } from './normalization';
import { expandQuery, findSynonyms } from './expansion';
import { extractEntities } from './entities';
import { correctSpelling, generateRelatedQueries, calculateConfidence } from './refinement';
import { applyToSearch } from './search-application';
import type { EnhancedQuery, QueryIntent } from './types';

// Re-export types for backward compatibility
export type { QueryIntent, EnhancedQuery } from './types';
export { SYNONYM_MAP, INTENT_PATTERNS, SPELLING_CORRECTIONS } from './constants';

/**
 * Query Enhancer
 * Main class that composes query enhancement functionality from specialized modules
 */
export class QueryEnhancer {
  /**
   * Enhance a search query with expansion, synonyms, and understanding
   */
  static async enhance(query: string): Promise<EnhancedQuery> {
    const normalized = normalizeQuery(query);
    const intent = detectIntent(query);
    const expandedTerms = expandQuery(normalized);
    const synonyms = findSynonyms(normalized);
    const entities = extractEntities(normalized);
    const spellingCorrections = correctSpelling(normalized);
    const relatedQueries = generateRelatedQueries(normalized, intent);
    const confidence = calculateConfidence(normalized, entities);

    return {
      original: query,
      normalized,
      intent,
      expanded_terms: expandedTerms,
      synonyms,
      entities,
      spelling_corrections: spellingCorrections,
      related_queries: relatedQueries,
      confidence_score: confidence
    };
  }

  /**
   * Apply query enhancement to search
   */
  static applyToSearch(enhanced: EnhancedQuery) {
    return applyToSearch(enhanced);
  }
}
