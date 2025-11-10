/**
 * Enhanced Search with Metadata Filtering and Boosting
 * Provides advanced search capabilities with metadata-based filtering and ranking
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateQueryEmbedding } from './query-embedding';
import type { EnhancedEmbeddingMetadata } from '../metadata-extractor';

/**
 * Enhanced search with metadata filtering and boosting
 */
export async function searchEnhancedContent(
  query: string,
  domain: string,
  options: {
    limit?: number;
    similarityThreshold?: number;
    contentTypes?: string[];  // Filter by content type
    mustHaveKeywords?: string[];  // Require certain keywords in metadata
    boostRecent?: boolean;  // Boost recent content
    priceRange?: { min: number; max: number };  // E-commerce filtering
  } = {}
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
  metadata?: Partial<EnhancedEmbeddingMetadata>;
}>> {
  const {
    limit = 5,
    similarityThreshold = 0.7,
    contentTypes,
    mustHaveKeywords,
    boostRecent = false,
    priceRange
  } = options;

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('Failed to create Supabase client');
    return [];
  }

  try {
    // Get domain ID
    let domainId: string | null = null;
    if (domain) {
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();

      if (!domainError && domainData) {
        domainId = domainData.id;
      }
    }

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Extract keywords from query for boosting
    const queryKeywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 5);

    // Call enhanced search function with metadata filters
    const { data, error } = await supabase.rpc('search_embeddings_enhanced', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: similarityThreshold,
      match_count: limit * 2,  // Get more results for post-filtering
      content_types: contentTypes,
      query_keywords: queryKeywords,
      boost_recent: boostRecent
    });

    if (error) {
      console.error('Enhanced search error:', error);
      // Fall back to regular search
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        p_domain_id: domainId,
        match_threshold: similarityThreshold,
        match_count: limit
      });

      if (fallbackError) throw fallbackError;

      return (fallbackData || []).map((result: any) => ({
        content: result.content || result.chunk_text || '',
        url: result.url || result.metadata?.url || '',
        title: result.title || result.metadata?.title || 'Untitled',
        similarity: result.similarity || 0
      }));
    }

    // Post-process results with additional filtering
    let results = (data || []).map((result: any) => ({
      content: result.content || result.chunk_text || '',
      url: result.url || result.metadata?.url || '',
      title: result.title || result.metadata?.title || 'Untitled',
      similarity: result.final_score || result.similarity || 0,
      metadata: result.metadata
    }));

    // Apply additional filters if specified
    if (mustHaveKeywords && mustHaveKeywords.length > 0) {
      results = results.filter((r: any) => {
        const keywords = r.metadata?.keywords || [];
        return mustHaveKeywords.some(k => keywords.includes(k.toLowerCase()));
      });
    }

    if (priceRange) {
      results = results.filter((r: any) => {
        const price = r.metadata?.price_range;
        if (!price) return false;
        return price.min >= priceRange.min && price.max <= priceRange.max;
      });
    }

    // Sort by similarity and return top results
    return results
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in enhanced search:', error);
    // Return empty array on error
    return [];
  }
}
