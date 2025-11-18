import { createClient } from '@/lib/supabase/server';
import { SearchFilters, SearchResult } from './conversation-search';
import {
  generateEmbedding,
  calculateCosineSimilarity,
  scoreAndMergeResults,
  deduplicateResults,
  highlightRelevantSection
} from './search-algorithms';

interface ScoredResult extends SearchResult {
  ftsScore?: number;
  semanticScore?: number;
  combinedScore: number;
}

export interface HybridSearchConfig {
  ftsWeight: number; // Default 0.6
  semanticWeight: number; // Default 0.4
  minScore: number; // Minimum relevance score threshold
  maxResults: number; // Maximum results to return
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  ftsWeight: 0.6,
  semanticWeight: 0.4,
  minScore: 0.1,
  maxResults: 50
};

/**
 * Hybrid search combining full-text and semantic search
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
  const supabase = await createClient();

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

  // Sort by combined score
  filtered.sort((a, b) => b.combinedScore - a.combinedScore);

  // Limit results
  const finalResults = filtered.slice(0, searchConfig.maxResults);

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
    totalCount: finalResults.length,
    searchMetrics: {
      ftsCount: ftsResults.length,
      semanticCount: semanticResults.length,
      mergedCount: scoredResults.length,
      deduplicatedCount: deduplicated.length
    }
  };
}

/**
 * Perform full-text search using PostgreSQL
 */
async function performFullTextSearch(
  query: string,
  filters?: Partial<SearchFilters>
): Promise<ScoredResult[]> {
  const supabase = await createClient();

  if (!supabase) {
    console.error('FTS error: Supabase client unavailable');
    return [];
  }

  const { data, error } = await supabase.rpc('search_conversations', {
    p_query: query,
    p_domain_id: filters?.domainId || null,
    p_date_from: filters?.dateFrom || null,
    p_date_to: filters?.dateTo || null,
    p_sentiment: filters?.sentiment || null,
    p_limit: 100,
    p_offset: 0
  });

  if (error) {
    console.error('FTS error:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    conversationId: row.conversation_id,
    messageId: row.message_id,
    content: row.content,
    role: row.role,
    createdAt: row.created_at,
    sentiment: row.sentiment,
    relevanceScore: row.relevance_score,
    highlight: row.highlight,
    ftsScore: row.relevance_score,
    combinedScore: 0
  }));
}

/**
 * Perform semantic search using vector embeddings
 */
async function performSemanticSearch(
  query: string,
  filters?: Partial<SearchFilters>
): Promise<ScoredResult[]> {
  try {
    // Generate query embedding
    const embedding = await generateEmbedding(query);

    const supabase = await createClient();

    if (!supabase) {
      console.error('Semantic search error: Supabase client unavailable');
      return [];
    }

    // Build semantic search query
    let searchQuery = supabase
      .from('message_embeddings')
      .select(`
        message_id,
        embedding,
        messages!inner(
          id,
          content,
          role,
          created_at,
          sentiment,
          conversation_id
        )
      `);

    // Apply filters via joins
    if (filters?.domainId || filters?.dateFrom || filters?.dateTo) {
      searchQuery = searchQuery.select(`
        message_id,
        embedding,
        messages!inner(
          id,
          content,
          role,
          created_at,
          sentiment,
          conversation_id,
          conversations!inner(
            domain_id
          )
        )
      `);
    }

    const { data, error } = await searchQuery.limit(100);

    if (error) {
      console.error('Semantic search error:', error);
      return [];
    }

    // Calculate cosine similarity and map results
    return (data || [])
      .map((row: any) => {
        const message = row.messages;
        const similarity = calculateCosineSimilarity(
          embedding,
          row.embedding || []
        );

        return {
          conversationId: message.conversation_id,
          messageId: message.id,
          content: message.content,
          role: message.role,
          createdAt: message.created_at,
          sentiment: message.sentiment,
          relevanceScore: similarity,
          highlight: highlightRelevantSection(message.content, query),
          semanticScore: similarity,
          combinedScore: 0
        };
      })
      .filter(r => r.semanticScore > 0.3) // Filter out low similarity
      .sort((a, b) => b.semanticScore - a.semanticScore);
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}

// Algorithm functions extracted to search-algorithms.ts