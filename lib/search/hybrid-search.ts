import { createClient } from '@/lib/supabase/server';
import { SearchFilters, SearchResult } from './conversation-search';

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

  return (data || []).map(row => ({
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

/**
 * Generate embedding for query text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: Integrate with OpenAI embeddings API
  // For now, return mock embedding
  return new Array(1536).fill(0).map(() => Math.random());
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Score and merge results from both search methods
 */
function scoreAndMergeResults(
  ftsResults: ScoredResult[],
  semanticResults: ScoredResult[],
  config: HybridSearchConfig
): ScoredResult[] {
  const mergedMap = new Map<string, ScoredResult>();

  // Normalize FTS scores
  const maxFtsScore = Math.max(...ftsResults.map(r => r.ftsScore || 0), 0.01);

  ftsResults.forEach(result => {
    const normalizedScore = (result.ftsScore || 0) / maxFtsScore;
    mergedMap.set(result.messageId, {
      ...result,
      ftsScore: normalizedScore,
      combinedScore: normalizedScore * config.ftsWeight
    });
  });

  // Normalize and merge semantic scores
  const maxSemanticScore = Math.max(
    ...semanticResults.map(r => r.semanticScore || 0),
    0.01
  );

  semanticResults.forEach(result => {
    const normalizedScore = (result.semanticScore || 0) / maxSemanticScore;
    const existing = mergedMap.get(result.messageId);

    if (existing) {
      // Message found in both searches - combine scores
      existing.semanticScore = normalizedScore;
      existing.combinedScore =
        (existing.ftsScore || 0) * config.ftsWeight +
        normalizedScore * config.semanticWeight;

      // Use the better highlight
      if (result.highlight.includes('<mark>')) {
        existing.highlight = result.highlight;
      }
    } else {
      // Only in semantic results
      mergedMap.set(result.messageId, {
        ...result,
        semanticScore: normalizedScore,
        combinedScore: normalizedScore * config.semanticWeight
      });
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Deduplicate results by conversation and adjacent messages
 */
function deduplicateResults(results: ScoredResult[]): ScoredResult[] {
  const seen = new Set<string>();
  const deduplicated: ScoredResult[] = [];

  // Group by conversation
  const byConversation = new Map<string, ScoredResult[]>();

  results.forEach(result => {
    const convResults = byConversation.get(result.conversationId) || [];
    convResults.push(result);
    byConversation.set(result.conversationId, convResults);
  });

  // Keep best result per conversation
  byConversation.forEach(convResults => {
    // Sort by score within conversation
    convResults.sort((a, b) => b.combinedScore - a.combinedScore);

    // Take top result and maybe one more if significantly different
    deduplicated.push(convResults[0]);

    if (convResults.length > 1 && convResults[1].combinedScore > 0.5) {
      // Check if messages are not adjacent
      const time1 = new Date(convResults[0].createdAt).getTime();
      const time2 = new Date(convResults[1].createdAt).getTime();
      const timeDiff = Math.abs(time1 - time2) / 1000; // seconds

      if (timeDiff > 60) {
        // Messages are more than 1 minute apart
        deduplicated.push(convResults[1]);
      }
    }
  });

  return deduplicated;
}

/**
 * Highlight the most relevant section of content
 */
function highlightRelevantSection(content: string, query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();

  // Find the position of the first matching word
  let firstMatch = -1;
  for (const word of words) {
    const pos = contentLower.indexOf(word);
    if (pos !== -1 && (firstMatch === -1 || pos < firstMatch)) {
      firstMatch = pos;
    }
  }

  // Extract a window around the first match
  let start = Math.max(0, firstMatch - 50);
  let end = Math.min(content.length, firstMatch + 150);

  let excerpt = content.substring(start, end);
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  // Highlight matching words
  words.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    excerpt = excerpt.replace(regex, '<mark>$1</mark>');
  });

  return excerpt;
}