import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateQueryEmbedding, mergeSearchResults, highlightQuery, logSearchAnalytics } from './search-helpers';

// Search filters schema
export const SearchFiltersSchema = z.object({
  query: z.string().min(1),
  domainId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  productMentions: z.array(z.string()).optional(),
  customerEmail: z.string().email().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  searchType: z.enum(['full_text', 'semantic', 'hybrid']).default('hybrid')
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

export interface SearchResult {
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
}

export interface SearchAnalytics {
  query: string;
  filters: SearchFilters;
  resultsCount: number;
  executionTime: number;
  searchType: string;
}

/**
 * Main conversation search function
 */
export async function searchConversations(
  filters: SearchFilters
): Promise<{
  results: SearchResult[];
  totalCount: number;
  executionTime: number;
}> {
  const startTime = performance.now();
  const supabase = await createClient();

  try {
    let results: SearchResult[] = [];
    let totalCount = 0;

    if (filters.searchType === 'full_text' || filters.searchType === 'hybrid') {
      const ftsResults = await fullTextSearch(filters);
      results = [...results, ...ftsResults.results];
      totalCount = ftsResults.totalCount;
    }

    if (filters.searchType === 'semantic' || filters.searchType === 'hybrid') {
      const semanticResults = await semanticSearch(filters);

      if (filters.searchType === 'hybrid') {
        // Merge and deduplicate results
        results = mergeSearchResults(results, semanticResults.results);
      } else {
        results = semanticResults.results;
        totalCount = semanticResults.totalCount;
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply pagination
    const paginatedResults = results.slice(
      filters.offset,
      filters.offset + filters.limit
    );

    const executionTime = performance.now() - startTime;

    // Log search analytics
    await logSearchAnalytics({
      query: filters.query,
      filters,
      resultsCount: paginatedResults.length,
      executionTime: Math.round(executionTime),
      searchType: filters.searchType
    });

    return {
      results: paginatedResults,
      totalCount: results.length,
      executionTime
    };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search conversations');
  }
}

/**
 * PostgreSQL full-text search
 */
export async function fullTextSearch(
  filters: SearchFilters
): Promise<{ results: SearchResult[]; totalCount: number }> {
  const supabase = await createClient();

  // Build the query
  const query = supabase
    .rpc('search_conversations', {
      p_query: filters.query,
      p_domain_id: filters.domainId || null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_sentiment: filters.sentiment || null,
      p_limit: filters.limit,
      p_offset: filters.offset
    });

  const { data, error, count } = await query;

  if (error) {
    console.error('Full-text search error:', error);
    throw error;
  }

  // Map to SearchResult format
  const results: SearchResult[] = (data || []).map(row => ({
    conversationId: row.conversation_id,
    messageId: row.message_id,
    content: row.content,
    role: row.role,
    createdAt: row.created_at,
    sentiment: row.sentiment,
    relevanceScore: row.relevance_score || 0,
    highlight: row.highlight || row.content.substring(0, 200)
  }));

  // Get customer info for results
  if (results.length > 0) {
    const conversationIds = [...new Set(results.map(r => r.conversationId))];

    const { data: convData } = await supabase
      .from('conversations')
      .select('id, customer_email, domain_id, domains(name)')
      .in('id', conversationIds);

    if (convData) {
      const convMap = new Map(convData.map(c => [
        c.id,
        { email: c.customer_email, domain: c.domains?.name }
      ]));

      results.forEach(r => {
        const conv = convMap.get(r.conversationId);
        if (conv) {
          r.customerEmail = conv.email;
          r.domainName = conv.domain;
        }
      });
    }
  }

  return { results, totalCount: count || results.length };
}

/**
 * Vector similarity search for semantic matching
 */
export async function semanticSearch(
  filters: SearchFilters
): Promise<{ results: SearchResult[]; totalCount: number }> {
  const supabase = await createClient();

  try {
    // Generate embedding for the query
    const embedding = await generateQueryEmbedding(filters.query);

    // Search message embeddings
    let query = supabase
      .from('message_embeddings')
      .select(`
        message_id,
        messages!inner(
          id,
          content,
          role,
          created_at,
          sentiment,
          conversation_id,
          conversations!inner(
            id,
            customer_email,
            domain_id,
            domains(name)
          )
        )
      `);

    // Apply filters
    if (filters.domainId) {
      query = query.eq('messages.conversations.domain_id', filters.domainId);
    }

    if (filters.dateFrom) {
      query = query.gte('messages.created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('messages.created_at', filters.dateTo);
    }

    if (filters.sentiment) {
      query = query.eq('messages.sentiment', filters.sentiment);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Semantic search error:', error);
      throw error;
    }

    // Calculate similarity scores and map to SearchResult
    const results: SearchResult[] = (data || []).map((row: any) => {
      const message = row.messages;
      const conversation = message.conversations;

      return {
        conversationId: conversation.id,
        messageId: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.created_at,
        sentiment: message.sentiment,
        relevanceScore: 0.5, // Will be calculated with actual embeddings
        highlight: highlightQuery(message.content, filters.query),
        customerEmail: conversation.customer_email,
        domainName: conversation.domains?.name
      };
    });

    return { results, totalCount: results.length };
  } catch (error) {
    console.error('Semantic search error:', error);
    return { results: [], totalCount: 0 };
  }
}

// Helper functions extracted to search-helpers.ts