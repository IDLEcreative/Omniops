import { SearchFilters, SearchResult } from './conversation-search';
import {
  scoreAndMergeResults,
  deduplicateResults
} from './search-algorithms';
import {
  performFullTextSearch,
  performSemanticSearch,
  type ScoredResult
} from './search-executors';

export interface HybridSearchConfig {
  ftsWeight: number; // Default 0.6
  semanticWeight: number; // Default 0.4
  minScore: number; // Minimum relevance score threshold
  maxResults: number; // Maximum results to return
}

export interface SearchPagination {
  limit?: number; // Items per page (default 20)
  cursor?: string; // Opaque pagination cursor (base64 encoded)
}

export interface PaginatedSearchResult {
  results: SearchResult[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number; // Total matches before pagination
  };
  searchMetrics: {
    ftsCount: number;
    semanticCount: number;
    mergedCount: number;
    deduplicatedCount: number;
    returnedCount: number;
  };
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  ftsWeight: 0.6,
  semanticWeight: 0.4,
  minScore: 0.1,
  maxResults: 50
};

/**
 * Encode pagination cursor (score + ID for stable sorting)
 */
function encodeCursor(score: number, id: string): string {
  return Buffer.from(`${score}:${id}`).toString('base64');
}

/**
 * Decode pagination cursor
 */
function decodeCursor(cursor: string): { score: number; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const [scoreStr, id] = decoded.split(':');
  return {
    score: parseFloat(scoreStr || '0'),
    id: id || ''
  };
}

/**
 * Hybrid search with cursor-based pagination
 */
export async function hybridSearchPaginated(
  query: string,
  filters?: Partial<SearchFilters>,
  config: Partial<HybridSearchConfig> = {},
  pagination?: SearchPagination
): Promise<PaginatedSearchResult> {
  const searchConfig = { ...DEFAULT_CONFIG, ...config };
  const limit = pagination?.limit ?? 20;

  // Decode cursor if provided
  let cursorScore = Infinity;
  let cursorId = '';

  if (pagination?.cursor) {
    try {
      const decoded = decodeCursor(pagination.cursor);
      cursorScore = decoded.score;
      cursorId = decoded.id;
    } catch (error) {
      console.error('Failed to decode cursor:', error);
      // Continue with default values if cursor is invalid
    }
  }

  // Execute both searches in parallel
  const [ftsResults, semanticResults] = await Promise.all([
    performFullTextSearch(query, filters),
    performSemanticSearch(query, filters)
  ]);

  // Score and merge results
  const scoredResults = scoreAndMergeResults(
    ftsResults,
    semanticResults,
    searchConfig
  );

  // Deduplicate by conversation and message
  const deduplicated = deduplicateResults(scoredResults);

  // Apply minimum score threshold
  const filtered = deduplicated.filter(
    r => r.combinedScore >= searchConfig.minScore
  );

  // Sort by combined score (descending)
  filtered.sort((a, b) => b.combinedScore - a.combinedScore);

  // Apply keyset pagination filtering
  const afterCursor = filtered.filter(r => {
    // Results with lower scores come after cursor
    // If same score, use ID for stable ordering
    return r.combinedScore < cursorScore ||
           (r.combinedScore === cursorScore && r.messageId > cursorId);
  });

  // Get one extra to check if there are more results
  const paginatedResults = afterCursor.slice(0, limit + 1);
  const hasMore = paginatedResults.length > limit;
  const finalResults = paginatedResults.slice(0, limit);

  // Generate cursor for next page
  const nextCursor = hasMore && finalResults.length > 0
    ? encodeCursor(
        finalResults[finalResults.length - 1].combinedScore,
        finalResults[finalResults.length - 1].messageId
      )
    : undefined;

  return {
    results: finalResults.map(r => ({
      conversationId: r.conversationId,
      messageId: r.messageId,
      content: r.content,
      role: r.role,
      createdAt: r.createdAt,
      sentiment: r.sentiment,
      relevanceScore: r.combinedScore,
      highlight: r.highlight,
      customerEmail: r.customerEmail,
      domainName: r.domainName
    })),
    pagination: {
      hasMore,
      nextCursor,
      totalCount: filtered.length
    },
    searchMetrics: {
      ftsCount: ftsResults.length,
      semanticCount: semanticResults.length,
      mergedCount: scoredResults.length,
      deduplicatedCount: deduplicated.length,
      returnedCount: finalResults.length
    }
  };
}

/**
 * Hybrid search combining full-text and semantic search
 * @deprecated Use hybridSearchPaginated for better performance with pagination
 */
export async function hybridSearch(
  query: string,
  filters?: Partial<SearchFilters>,
  config: Partial<HybridSearchConfig> = {}
): Promise<{
  results: SearchResult[];
  totalCount: number;
  searchMetrics: {
    ftsCount: number;
    semanticCount: number;
    mergedCount: number;
    deduplicatedCount: number;
  };
}> {
  const searchConfig = { ...DEFAULT_CONFIG, ...config };

  // Use paginated version without cursor (returns first page)
  const result = await hybridSearchPaginated(
    query,
    filters,
    config,
    { limit: searchConfig.maxResults }
  );

  return {
    results: result.results,
    totalCount: result.pagination.totalCount ?? result.results.length,
    searchMetrics: {
      ftsCount: result.searchMetrics.ftsCount,
      semanticCount: result.searchMetrics.semanticCount,
      mergedCount: result.searchMetrics.mergedCount,
      deduplicatedCount: result.searchMetrics.deduplicatedCount
    }
  };
}