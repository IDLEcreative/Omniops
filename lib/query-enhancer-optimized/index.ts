/**
 * Optimized Query Enhancement System
 * Performance improvements based on profiling results
 */

import { LRUCache } from 'lru-cache';
import { EnhancedQuery } from './types';
import {
  normalizeQuery,
  detectIntent,
  expandQuery,
  findSynonyms,
  extractEntities,
  correctSpelling,
  generateRelatedQueries,
  calculateConfidence
} from './processors';

export class QueryEnhancerOptimized {
  // Performance optimization: LRU cache for enhanced queries
  private static queryCache = new LRUCache<string, EnhancedQuery>({
    max: 1000, // Max 1000 queries
    ttl: 1000 * 60 * 60, // 1 hour TTL
    updateAgeOnGet: true
  });

  /**
   * Enhanced query with caching and optimizations
   */
  static async enhance(query: string): Promise<EnhancedQuery> {
    // Check cache first
    const cached = this.queryCache.get(query);
    if (cached) {
      return cached;
    }

    const normalized = normalizeQuery(query);

    // Parallel processing for independent operations
    const [intent, expandedTerms, synonyms, entities, spellingCorrections] = await Promise.all([
      Promise.resolve(detectIntent(query)),
      Promise.resolve(expandQuery(normalized)),
      Promise.resolve(findSynonyms(normalized)),
      Promise.resolve(extractEntities(normalized)),
      Promise.resolve(correctSpelling(normalized))
    ]);

    const relatedQueries = generateRelatedQueries(normalized, intent);
    const confidence = calculateConfidence(normalized, entities);

    const enhanced: EnhancedQuery = {
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

    // Cache the result
    this.queryCache.set(query, enhanced);

    return enhanced;
  }

  /**
   * Clear the query cache
   */
  static clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.queryCache.size,
      hits: 0, // Would need to track this
      misses: 0 // Would need to track this
    };
  }
}

// Re-export types
export type { QueryIntent, EnhancedQuery } from './types';
