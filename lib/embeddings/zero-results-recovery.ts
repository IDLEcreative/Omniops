/**
 * Zero-Results Recovery System
 * Multi-stage recovery strategy when search returns zero results
 * Based on industry best practices (Amazon, Shopify, Algolia)
 */

import { searchSimilarContentOptimized } from './search-orchestrator';
import type { SearchResult } from './types';

export interface RecoveryResult {
  results: SearchResult[];
  strategy: 'keyword_removal' | 'relaxed_threshold' | 'single_keyword' | 'exhausted';
  suggestion?: string;
}

/**
 * Handle zero-results scenario with multi-stage recovery
 */
export async function handleZeroResults(
  originalQuery: string,
  domain: string,
  originalLimit: number = 20
): Promise<RecoveryResult> {


  const keywords = originalQuery.trim().split(/\s+/);

  // STAGE 1: Over-Constrained Query - Remove keywords one at a time
  if (keywords.length > 1) {
    console.log('[RECOVERY STAGE 1] Trying keyword removal (over-constrained query)');

    for (let i = 0; i < keywords.length; i++) {
      const reducedQuery = keywords.filter((_, idx) => idx !== i).join(' ');

      try {
        const results = await searchSimilarContentOptimized(reducedQuery, domain, originalLimit, 0.15);

        if (results.length > 0) {
          return {
            results,
            strategy: 'keyword_removal',
            suggestion: `No exact matches for "${originalQuery}", but found ${results.length} results for "${reducedQuery}"`
          };
        }
      } catch (error) {
        continue;
      }
    }
  }

  // STAGE 2: Relaxed Similarity Threshold

  try {
    const relaxedResults = await searchSimilarContentOptimized(originalQuery, domain, originalLimit, 0.10);

    if (relaxedResults.length > 0) {
      return {
        results: relaxedResults,
        strategy: 'relaxed_threshold',
        suggestion: `No close matches, but found ${relaxedResults.length} potentially related results`
      };
    }
  } catch (error) {
  }

  // STAGE 3: Single Keyword Search (if multi-word query)
  if (keywords.length > 1) {

    // Use longest keyword (often most specific)
    const longestKeyword = keywords.reduce((a, b) => a.length > b.length ? a : b);

    try {
      const singleKeywordResults = await searchSimilarContentOptimized(longestKeyword, domain, originalLimit, 0.15);

      if (singleKeywordResults.length > 0) {
        return {
          results: singleKeywordResults,
          strategy: 'single_keyword',
          suggestion: `No matches for full query, but found ${singleKeywordResults.length} results related to "${longestKeyword}"`
        };
      }
    } catch (error) {
    }
  }

  // STAGE 4: Fallback - Return empty with helpful suggestion

  return {
    results: [],
    strategy: 'exhausted',
    suggestion: `No results found for "${originalQuery}".\n\nTry:\n` +
      `- Using different search terms or synonyms\n` +
      `- Searching for broader product categories\n` +
      `- Browsing our catalog or contacting support for assistance`
  };
}

/**
 * Check if results should trigger recovery
 */
export function shouldTriggerRecovery(results: SearchResult[]): boolean {
  return results.length === 0;
}
