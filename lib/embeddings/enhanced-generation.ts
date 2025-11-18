/**
 * Enhanced Embeddings Generation with Rich Metadata
 * Generates embeddings with comprehensive metadata for improved search relevance
 */

import { MetadataExtractor, type EnhancedEmbeddingMetadata } from '../metadata-extractor';
import { createClient } from '@/lib/supabase/server';
import { splitIntoChunks, generateEmbeddingVectors } from '../embeddings-functions';

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

  } catch (error) {
    console.error('Error generating enhanced embeddings:', error);
    throw error;
  }
}
