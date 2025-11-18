/**
 * Search Execution Functions
 *
 * Performs the actual FTS and semantic search queries against Supabase.
 * Extracted from hybrid-search.ts to maintain LOC limits.
 */

import { createClient } from '@/lib/supabase/server';
import { SearchFilters } from './conversation-search';
import { calculateCosineSimilarity, highlightRelevantSection, generateEmbedding } from './search-algorithms';

export interface ScoredResult {
  conversationId: string;
  messageId: string;
  content: string;
  role: string;
  createdAt: string;
  sentiment?: string;
  relevanceScore: number;
  highlight: string;
  customerEmail?: string;
  domainName?: string;
  ftsScore?: number;
  semanticScore?: number;
  combinedScore: number;
}

/**
 * Perform full-text search using PostgreSQL
 */
export async function performFullTextSearch(
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
export async function performSemanticSearch(
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
