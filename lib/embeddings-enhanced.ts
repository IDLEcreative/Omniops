/**
 * Enhanced Embeddings Generation with Rich Metadata
 * Backward compatible enhancement of the embeddings system
 */

import { MetadataExtractor, type EnhancedEmbeddingMetadata } from './metadata-extractor';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { splitIntoChunks, generateEmbeddingVectors, generateQueryEmbedding } from './embeddings';

/**
 * Generate embeddings with enhanced metadata
 * This is a drop-in replacement for the existing generateEmbeddings function
 */
export async function generateEnhancedEmbeddings(params: {
  contentId: string;
  content: string;
  url: string;
  title: string;
  htmlContent?: string;  // Optional HTML for better extraction
  lastModified?: string;  // From HTTP headers if available
}): Promise<void> {
  const supabase = await createClient();
  const chunks = splitIntoChunks(params.content);
  
  if (chunks.length === 0) {
    console.warn('No chunks to embed for', params.url);
    return;
  }
  
  try {
    // Generate embeddings (reuse existing function)
    const embeddings = await generateEmbeddingVectors(chunks);
    
    // Prepare data with enhanced metadata
    const embeddingRecords = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Extract enhanced metadata for each chunk
        const enhancedMetadata = await MetadataExtractor.extractEnhancedMetadata(
          chunk,
          params.content,
          params.url,
          params.title,
          index,
          chunks.length,
          params.htmlContent
        );
        
        // Add last modified if provided
        if (params.lastModified) {
          enhancedMetadata.last_modified = params.lastModified;
        }
        
        return {
          page_id: params.contentId,
          chunk_text: chunk,
          embedding: embeddings[index],
          metadata: enhancedMetadata as any  // Cast to any for JSONB compatibility
        };
      })
    );
    
    // Log metadata stats for monitoring
    const contentTypes = new Set(embeddingRecords.map(r => r.metadata.content_type));
    const avgKeywords = embeddingRecords.reduce((sum, r) => sum + r.metadata.keywords.length, 0) / embeddingRecords.length;
    console.log(`[Enhanced Embeddings] Generated ${chunks.length} embeddings for ${params.url}`);
    console.log(`  Content types: ${Array.from(contentTypes).join(', ')}`);
    console.log(`  Avg keywords per chunk: ${avgKeywords.toFixed(1)}`);
    
    // Use bulk insert function (same as original)
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    const { data, error } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: embeddingRecords
    });
    
    if (error) {
      // Fallback to regular insert if bulk function fails
      console.warn('Bulk insert failed, falling back to regular insert:', error);
      const { error: fallbackError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);
      
      if (fallbackError) throw fallbackError;
    }
    
    console.log(`Successfully stored ${chunks.length} enhanced embeddings for ${params.url}`);
  } catch (error) {
    console.error('Error generating enhanced embeddings:', error);
    throw error;
  }
}

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
      results = results.filter(r => {
        const keywords = r.metadata?.keywords || [];
        return mustHaveKeywords.some(k => keywords.includes(k.toLowerCase()));
      });
    }
    
    if (priceRange) {
      results = results.filter(r => {
        const price = r.metadata?.price_range;
        if (!price) return false;
        return price.min >= priceRange.min && price.max <= priceRange.max;
      });
    }
    
    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error in enhanced search:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Migration utility to enhance existing embeddings with rich metadata
 * Run this in batches to avoid overwhelming the system
 */
export async function migrateExistingEmbeddings(
  batchSize: number = 100,
  domainFilter?: string
): Promise<{ processed: number; failed: number }> {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database connection unavailable');
  
  let processed = 0;
  let failed = 0;
  let lastId: string | null = null;
  
  while (true) {
    // Fetch batch of embeddings with minimal metadata
    let query = supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, metadata')
      .limit(batchSize)
      .order('id');
    
    if (lastId) {
      query = query.gt('id', lastId);
    }
    
    const { data: embeddings, error } = await query;
    
    if (error) {
      console.error('Error fetching embeddings for migration:', error);
      break;
    }
    
    if (!embeddings || embeddings.length === 0) {
      break;  // No more embeddings to process
    }
    
    // Process each embedding
    for (const embedding of embeddings) {
      try {
        // Skip if already has enhanced metadata
        if (embedding.metadata?.content_type) {
          processed++;
          continue;
        }
        
        // Get page details
        const { data: page } = await supabase
          .from('scraped_pages')
          .select('url, title, content, domain')
          .eq('id', embedding.page_id)
          .single();
        
        if (!page) continue;
        
        // Apply domain filter if specified
        if (domainFilter && page.domain !== domainFilter) {
          continue;
        }
        
        // Extract enhanced metadata
        const enhancedMetadata = await MetadataExtractor.extractEnhancedMetadata(
          embedding.chunk_text,
          page.content,
          page.url,
          page.title,
          embedding.metadata?.chunk_index || 0,
          embedding.metadata?.total_chunks || 1
        );
        
        // Update the embedding with enhanced metadata
        const { error: updateError } = await supabase
          .from('page_embeddings')
          .update({ metadata: enhancedMetadata as any })
          .eq('id', embedding.id);
        
        if (updateError) {
          console.error(`Failed to update embedding ${embedding.id}:`, updateError);
          failed++;
        } else {
          processed++;
        }
        
      } catch (err) {
        console.error(`Error processing embedding ${embedding.id}:`, err);
        failed++;
      }
      
      lastId = embedding.id;
    }
    
    console.log(`Migration progress: ${processed} processed, ${failed} failed`);
    
    // Add delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Migration complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

/**
 * Analyze metadata quality across embeddings
 */
export async function analyzeMetadataQuality(domain?: string): Promise<{
  totalEmbeddings: number;
  withEnhancedMetadata: number;
  contentTypeDistribution: Record<string, number>;
  avgKeywordsPerChunk: number;
  avgReadabilityScore: number;
  coverage: number;  // Percentage with enhanced metadata
}> {
  const supabase = await createServiceRoleClient();
  if (!supabase) throw new Error('Database connection unavailable');
  
  // Get domain filter if specified
  let domainId: string | undefined;
  if (domain) {
    const { data } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domain.replace('www.', ''))
      .single();
    domainId = data?.id;
  }
  
  // Query embeddings with metadata
  let query = supabase
    .from('page_embeddings')
    .select('metadata');
  
  if (domainId) {
    query = query.eq('page_id', domainId);
  }
  
  const { data: embeddings, error } = await query;
  
  if (error || !embeddings) {
    throw new Error(`Failed to fetch embeddings: ${error?.message}`);
  }
  
  const totalEmbeddings = embeddings.length;
  let withEnhancedMetadata = 0;
  const contentTypes: Record<string, number> = {};
  let totalKeywords = 0;
  let totalReadability = 0;
  let readabilityCount = 0;
  
  for (const embedding of embeddings) {
    if (embedding.metadata?.content_type) {
      withEnhancedMetadata++;
      
      // Count content types
      const type = embedding.metadata.content_type;
      contentTypes[type] = (contentTypes[type] || 0) + 1;
      
      // Count keywords
      if (embedding.metadata.keywords) {
        totalKeywords += embedding.metadata.keywords.length;
      }
      
      // Sum readability scores
      if (embedding.metadata.readability_score) {
        totalReadability += embedding.metadata.readability_score;
        readabilityCount++;
      }
    }
  }
  
  return {
    totalEmbeddings,
    withEnhancedMetadata,
    contentTypeDistribution: contentTypes,
    avgKeywordsPerChunk: withEnhancedMetadata > 0 ? totalKeywords / withEnhancedMetadata : 0,
    avgReadabilityScore: readabilityCount > 0 ? totalReadability / readabilityCount : 0,
    coverage: totalEmbeddings > 0 ? (withEnhancedMetadata / totalEmbeddings) * 100 : 0
  };
}