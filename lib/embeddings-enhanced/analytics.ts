/**
 * Embedding Analytics
 * Tools for analyzing metadata quality and coverage
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

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

  // Query embeddings with metadata using pagination
  // ✅ Optimized: Only fetches metadata column
  // ✅ Optimized: Uses pagination to handle large datasets
  const embeddings: Array<{ metadata: any }> = [];
  let offset = 0;
  const batchSize = 5000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('page_embeddings')
      .select('metadata')
      .range(offset, offset + batchSize - 1);

    if (domainId) {
      query = query.eq('page_id', domainId);
    }

    const { data: batch, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch embeddings: ${error.message}`);
    }

    if (batch && batch.length > 0) {
      embeddings.push(...batch);
      offset += batchSize;

      if (batch.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  if (!embeddings) {
    throw new Error('Failed to fetch embeddings');
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
