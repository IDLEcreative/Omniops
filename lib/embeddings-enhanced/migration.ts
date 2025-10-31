/**
 * Embedding Migration Utilities
 * Tools for migrating existing embeddings to enhanced format
 */

import { MetadataExtractor } from '../metadata-extractor';
import { createServiceRoleClient } from '@/lib/supabase/server';

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

    console.log(`Migration progress: ${processed} processed, ${failed} failed`);

    // Add delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Migration complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}
