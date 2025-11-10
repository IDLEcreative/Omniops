/**
 * Search Helper Utilities
 *
 * Common helper functions for search operations including:
 * - Query embedding generation
 * - Result merging and deduplication
 * - Text highlighting
 * - Analytics logging
 *
 * @module lib/search/search-helpers
 */

import { createClient } from '@/lib/supabase/server';
import type { SearchFilters, SearchResult, SearchAnalytics } from './conversation-search';

/**
 * Generate embedding for a query
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  // This would call OpenAI or another embedding service
  // For now, return a mock embedding
  return new Array(1536).fill(0).map(() => Math.random());
}

/**
 * Merge and deduplicate search results
 */
export function mergeSearchResults(
  ftsResults: SearchResult[],
  semanticResults: SearchResult[]
): SearchResult[] {
  const merged = new Map<string, SearchResult>();

  // Add FTS results with 60% weight
  ftsResults.forEach(result => {
    merged.set(result.messageId, {
      ...result,
      relevanceScore: result.relevanceScore * 0.6
    });
  });

  // Add or merge semantic results with 40% weight
  semanticResults.forEach(result => {
    const existing = merged.get(result.messageId);
    if (existing) {
      // Combine scores if message appears in both
      existing.relevanceScore += result.relevanceScore * 0.4;
    } else {
      merged.set(result.messageId, {
        ...result,
        relevanceScore: result.relevanceScore * 0.4
      });
    }
  });

  return Array.from(merged.values());
}

/**
 * Simple keyword highlighting
 */
export function highlightQuery(text: string, query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  let highlighted = text;

  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });

  // Return first 200 chars with highlights
  if (highlighted.length > 200) {
    const firstMark = highlighted.indexOf('<mark>');
    if (firstMark > 100) {
      highlighted = '...' + highlighted.substring(firstMark - 50, firstMark + 150) + '...';
    } else {
      highlighted = highlighted.substring(0, 200) + '...';
    }
  }

  return highlighted;
}

/**
 * Log search analytics
 */
export async function logSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.from('search_queries').insert({
      query: analytics.query,
      search_type: analytics.searchType,
      filters: analytics.filters,
      results_count: analytics.resultsCount,
      execution_time_ms: analytics.executionTime
    });
  } catch (error) {
    console.error('Failed to log search analytics:', error);
  }
}
