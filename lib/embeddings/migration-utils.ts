/**
 * Migration and Analysis Utilities for Enhanced Embeddings
 * Provides tools for migrating existing embeddings and analyzing metadata quality
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { MetadataExtractor, type EnhancedEmbeddingMetadata } from '../metadata-extractor';

/**
 * Migration utility to enhance existing embeddings with rich metadata
 * Run this in batches to avoid overwhelming the system
 * ✅ Optimized: Uses cursor-based pagination instead of offset
 * ✅ Optimized: Explicitly selects only needed columns
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
    // ✅ Only fetches needed columns: id, page_id, chunk_text, metadata
    // ✅ Uses cursor pagination (gt) which is more efficient than offset
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


    // Add delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

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
