/**
 * Enhanced Embeddings Service with Increased Context Window
 * This module improves AI accuracy by retrieving more context chunks
 * and intelligently prioritizing them based on relevance and position.
 */

import { createClient } from '@supabase/supabase-js';

// Increase default chunk retrieval for better context
const DEFAULT_CHUNKS = 10; // Increased from 3-5
const MAX_CHUNKS = 15;     // Maximum chunks to retrieve
const MIN_CHUNKS = 8;       // Minimum chunks for good context

interface ChunkResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
  page_id?: string;
  chunk_index?: number;
  chunk_position?: number;
  metadata?: any;
}

interface EnhancedSearchOptions {
  minChunks?: number;
  maxChunks?: number;
  similarityThreshold?: number;
  prioritizeFirst?: boolean;
  includeMetadata?: boolean;
  groupByPage?: boolean;
}

/**
 * Enhanced search that retrieves more context and prioritizes chunks intelligently
 */
export async function searchWithEnhancedContext(
  query: string,
  domain: string,
  options: EnhancedSearchOptions = {}
): Promise<{
  chunks: ChunkResult[];
  groupedContext: Map<string, any>;
  totalRetrieved: number;
  averageSimilarity: number;
}> {
  const {
    minChunks = MIN_CHUNKS,
    maxChunks = MAX_CHUNKS,
    similarityThreshold = 0.65, // Lowered to get more context
    prioritizeFirst = true,
    includeMetadata = true,
    groupByPage = true
  } = options;

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // First, generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);
    
    // Get domain_id for filtering
    const { data: domainData } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', domain.replace('www.', ''))
      .single();
    
    if (!domainData) {
      console.warn(`[Enhanced Embeddings] No domain found for ${domain}`);
      return {
        chunks: [],
        groupedContext: new Map(),
        totalRetrieved: 0,
        averageSimilarity: 0
      };
    }

    // Retrieve MORE chunks than traditional approach
    const { data: embeddings, error } = await supabase.rpc(
      'match_page_embeddings_extended',
      {
        query_embedding: queryEmbedding,
        p_domain_id: domainData.id,
        match_threshold: similarityThreshold,
        match_count: maxChunks // Get maximum chunks
      }
    );

    if (error) {
      console.error('[Enhanced Embeddings] Search error:', error);
      // Fall back to standard function if extended doesn't exist
      const { data: fallbackData } = await supabase.rpc(
        'match_page_embeddings',
        {
          query_embedding: queryEmbedding,
          p_domain_id: domainData.id,
          match_threshold: similarityThreshold,
          match_count: maxChunks
        }
      );
      
      if (fallbackData) {
        return processChunks(fallbackData, minChunks, prioritizeFirst, groupByPage);
      }
    }

    if (!embeddings || embeddings.length === 0) {
      console.log('[Enhanced Embeddings] No matching embeddings found');
      return {
        chunks: [],
        groupedContext: new Map(),
        totalRetrieved: 0,
        averageSimilarity: 0
      };
    }

    return processChunks(embeddings, minChunks, prioritizeFirst, groupByPage);
    
  } catch (error) {
    console.error('[Enhanced Embeddings] Error in search:', error);
    return {
      chunks: [],
      groupedContext: new Map(),
      totalRetrieved: 0,
      averageSimilarity: 0
    };
  }
}

/**
 * Process and prioritize chunks based on various factors
 */
function processChunks(
  embeddings: any[],
  minChunks: number,
  prioritizeFirst: boolean,
  groupByPage: boolean
): {
  chunks: ChunkResult[];
  groupedContext: Map<string, any>;
  totalRetrieved: number;
  averageSimilarity: number;
} {
  // Apply smart prioritization
  const prioritized = prioritizeChunks(embeddings, prioritizeFirst);
  
  // Ensure we have at least minChunks
  const selected = selectOptimalChunks(prioritized, minChunks);
  
  // Group by page if requested
  const grouped = groupByPage ? groupChunksByPage(selected) : new Map();
  
  // Calculate average similarity for quality assessment
  const avgSimilarity = selected.reduce((sum, c) => sum + c.similarity, 0) / selected.length;
  
  console.log(`[Enhanced Embeddings] Retrieved ${selected.length} chunks with avg similarity ${avgSimilarity.toFixed(3)}`);
  
  return {
    chunks: selected,
    groupedContext: grouped,
    totalRetrieved: selected.length,
    averageSimilarity: avgSimilarity
  };
}

/**
 * Prioritize chunks based on relevance and position
 */
function prioritizeChunks(chunks: any[], prioritizeFirst: boolean): ChunkResult[] {
  return chunks.map(chunk => {
    let priority = chunk.similarity || 0;
    
    // Boost first chunks (usually contain overview/summary)
    if (prioritizeFirst && chunk.chunk_index === 0) {
      priority *= 1.3;
    }
    
    // Boost chunks containing specifications or descriptions
    const contentLower = (chunk.content || '').toLowerCase();
    if (contentLower.includes('specification') || 
        contentLower.includes('description:') ||
        contentLower.includes('features:') ||
        contentLower.includes('includes:')) {
      priority *= 1.2;
    }
    
    // Boost chunks with structured data (likely product info)
    if (contentLower.includes('sku:') || 
        contentLower.includes('price:') ||
        contentLower.includes('brand:') ||
        contentLower.includes('category:')) {
      priority *= 1.15;
    }
    
    // Slightly penalize very long chunks (might be boilerplate)
    if (chunk.content && chunk.content.length > 5000) {
      priority *= 0.9;
    }
    
    return {
      ...chunk,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Select optimal chunks ensuring minimum coverage
 */
function selectOptimalChunks(chunks: ChunkResult[], minChunks: number): ChunkResult[] {
  // Always include high-relevance chunks (similarity > 0.85)
  const highRelevance = chunks.filter(c => c.similarity > 0.85);
  
  // Fill with medium relevance if needed
  const mediumRelevance = chunks.filter(c => 
    c.similarity > 0.7 && c.similarity <= 0.85
  );
  
  // Include some lower relevance for context if still needed
  const lowerRelevance = chunks.filter(c => 
    c.similarity > 0.65 && c.similarity <= 0.7
  );
  
  // Combine to meet minimum chunks requirement
  const selected = [
    ...highRelevance,
    ...mediumRelevance.slice(0, Math.max(0, minChunks - highRelevance.length)),
    ...lowerRelevance.slice(0, Math.max(0, minChunks - highRelevance.length - mediumRelevance.length))
  ];
  
  // Ensure we don't exceed maximum token limits
  return trimToTokenLimit(selected);
}

/**
 * Group chunks by their source page for better context understanding
 */
function groupChunksByPage(chunks: ChunkResult[]): Map<string, any> {
  const grouped = new Map();
  
  for (const chunk of chunks) {
    const pageId = chunk.page_id || chunk.url;
    if (!grouped.has(pageId)) {
      grouped.set(pageId, {
        url: chunk.url,
        title: chunk.title,
        chunks: [],
        maxSimilarity: chunk.similarity,
        metadata: chunk.metadata
      });
    }
    
    const page = grouped.get(pageId);
    page.chunks.push(chunk);
    page.maxSimilarity = Math.max(page.maxSimilarity, chunk.similarity);
  }
  
  // Sort chunks within each page by position
  for (const page of grouped.values()) {
    page.chunks.sort((a: any, b: any) => 
      (a.chunk_index || 0) - (b.chunk_index || 0)
    );
  }
  
  return grouped;
}

/**
 * Ensure we don't exceed token limits for the AI model
 */
function trimToTokenLimit(chunks: ChunkResult[]): ChunkResult[] {
  const MAX_TOKENS = 12000; // Leave room for response
  let totalTokens = 0;
  const selected = [];
  
  for (const chunk of chunks) {
    const estimatedTokens = Math.ceil((chunk.content?.length || 0) / 4);
    if (totalTokens + estimatedTokens < MAX_TOKENS) {
      selected.push(chunk);
      totalTokens += estimatedTokens;
    } else {
      console.log(`[Enhanced Embeddings] Trimmed at ${selected.length} chunks due to token limit`);
      break;
    }
  }
  
  return selected;
}

/**
 * Generate embedding for a query (placeholder - uses actual implementation)
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  // Import the actual embedding generation
  const { generateQueryEmbedding: actualGenerate } = await import('./embeddings');
  return actualGenerate(query);
}

/**
 * Enhanced search wrapper that can be dropped in to replace searchSimilarContent
 */
export async function searchSimilarContentEnhanced(
  query: string,
  domain: string,
  limit: number = DEFAULT_CHUNKS, // Now defaults to 10 instead of 3-5
  similarityThreshold: number = 0.65
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
}>> {
  const result = await searchWithEnhancedContext(query, domain, {
    minChunks: Math.max(MIN_CHUNKS, limit),
    maxChunks: MAX_CHUNKS,
    similarityThreshold,
    prioritizeFirst: true,
    includeMetadata: true,
    groupByPage: true
  });
  
  // Return in the expected format
  return result.chunks.map(chunk => ({
    content: chunk.content || '',
    url: chunk.url || '',
    title: chunk.title || '',
    similarity: chunk.similarity || 0
  }));
}

/**
 * Get statistics about the context window usage
 */
export function getContextStats(chunks: ChunkResult[]): {
  totalChunks: number;
  totalTokens: number;
  averageSimilarity: number;
  highQualityChunks: number;
  pagesRepresented: number;
} {
  const totalTokens = chunks.reduce((sum, c) => 
    sum + Math.ceil((c.content?.length || 0) / 4), 0
  );
  
  const avgSimilarity = chunks.reduce((sum, c) => 
    sum + (c.similarity || 0), 0
  ) / chunks.length;
  
  const highQuality = chunks.filter(c => c.similarity > 0.8).length;
  
  const uniquePages = new Set(chunks.map(c => c.page_id || c.url)).size;
  
  return {
    totalChunks: chunks.length,
    totalTokens,
    averageSimilarity: avgSimilarity,
    highQualityChunks: highQuality,
    pagesRepresented: uniquePages
  };
}