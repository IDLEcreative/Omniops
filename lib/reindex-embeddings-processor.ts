/**
 * Core processing logic for the Embeddings Reindex System
 */

import type { SupabaseClient } from '@/types/supabase';
import OpenAI from 'openai';
import {
  PageData,
  EmbeddingRecord,
  EMBEDDING_BATCH_SIZE
} from './reindex-embeddings-types';

/**
 * Clear existing embeddings for a domain
 */
export async function clearEmbeddings(
  supabase: SupabaseClient,
  domainId?: string,
  onProgressUpdate?: (current: number, total: number, message: string) => void
): Promise<void> {
  if (domainId) {
    // Get all page IDs for the domain using pagination
    const pageIds: string[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pages, error: pagesError } = await supabase
        .from('scraped_pages')
        .select('id')
        .eq('domain_id', domainId)
        .range(offset, offset + limit - 1);

      if (pagesError) throw new Error(`Failed to fetch pages: ${pagesError.message}`);

      if (pages && pages.length > 0) {
        pageIds.push(...pages.map((p: any) => p.id));
        offset += pages.length;
        hasMore = pages.length === limit;
      } else {
        hasMore = false;
      }
    }

    if (pageIds.length === 0) {
      onProgressUpdate?.(100, 100, 'No pages to clear');
      return;
    }

    // Delete embeddings for those pages in batches
    for (let i = 0; i < pageIds.length; i += 100) {
      const batch = pageIds.slice(i, i + 100);
      const { error } = await supabase
        .from('page_embeddings')
        .delete()
        .in('page_id', batch);

      if (error) throw new Error(`Failed to clear embeddings: ${error.message}`);

      onProgressUpdate?.(
        i + batch.length,
        pageIds.length,
        `Cleared embeddings for ${i + batch.length}/${pageIds.length} pages`
      );
    }
  } else {
    // Clear all embeddings (use with caution!)
    let deleted = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch } = await supabase
        .from('page_embeddings')
        .select('id')
        .limit(100);

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      const ids = batch.map((e: any) => e.id);
      await supabase
        .from('page_embeddings')
        .delete()
        .in('id', ids);

      deleted += batch.length;
      onProgressUpdate?.(deleted, deleted + 100, `Cleared ${deleted} embeddings...`);
    }
  }
}

/**
 * Get pages to reindex
 */
export async function getPages(
  supabase: SupabaseClient,
  domainId?: string
): Promise<PageData[]> {
  const allPages: PageData[] = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const query = supabase
      .from('scraped_pages')
      .select('id, url, title, text_content, content, domain_id, scraped_at')
      .order('scraped_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (domainId) {
      query.eq('domain_id', domainId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch pages: ${error.message}`);

    if (data && data.length > 0) {
      allPages.push(...data as PageData[]);
      offset += data.length;
      hasMore = data.length === limit;
    } else {
      hasMore = false;
    }

  }

  return allPages;
}

/**
 * Generate embeddings and save to database
 */
export async function generateAndSaveEmbeddings(
  supabase: SupabaseClient,
  openai: OpenAI,
  pageId: string,
  domainId: string,
  pageUrl: string,
  pageTitle: string,
  chunks: string[],
  onError: (error: string) => void
): Promise<number> {
  let saved = 0;

  // Process in batches for efficiency
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);

    try {
      // Batch API call - much more efficient
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      // Prepare batch insert
      const embeddings: EmbeddingRecord[] = response.data.map((item: any, idx: number) => {
        const chunkText = batch[idx];
        if (!chunkText) {
          throw new Error(`Missing chunk text at index ${idx}`);
        }
        return {
          page_id: pageId,
          domain_id: domainId,
          chunk_text: chunkText,
          embedding: item.embedding,
          metadata: {
            chunk_index: i + idx,
            total_chunks: chunks.length,
            chunk_size: chunkText.length,
            url: pageUrl,
            title: pageTitle,
            reindexed: true,
            reindex_date: new Date().toISOString(),
            version: 2
          }
        };
      });

      // Batch insert - much more efficient
      const { error } = await supabase
        .from('page_embeddings')
        .insert(embeddings);

      if (error) {
        onError(`Failed to save batch starting at chunk ${i}: ${error.message}`);
      } else {
        saved += embeddings.length;
      }

      // Rate limiting - less aggressive since we're batching
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      onError(`Failed to generate embeddings for batch starting at chunk ${i}: ${error}`);
    }
  }

  return saved;
}

/**
 * Validate reindex results
 */
export async function validateReindex(
  supabase: SupabaseClient,
  targetChunkSize: number,
  onError: (error: string) => void
): Promise<{
  validationPassed: boolean;
  oversized: number;
  contaminated: number;
}> {
  // Sample embeddings for validation
  const { data: samples, error } = await supabase
    .from('page_embeddings')
    .select('chunk_text, metadata')
    .limit(100);

  if (error || !samples) {
    onError('Failed to validate: could not fetch samples');
    return { validationPassed: false, oversized: 0, contaminated: 0 };
  }

  // Check chunk sizes
  const oversized = samples.filter((s: any) =>
    s.chunk_text && s.chunk_text.length > targetChunkSize
  );

  // Check for navigation contamination
  const contaminated = samples.filter((s: any) => {
    const text = (s.chunk_text || '').toLowerCase();
    return text.includes('cookie policy') ||
           text.includes('newsletter subscribe') ||
           (text.includes('home') && text.includes('about') && text.includes('contact'));
  });

  const validationPassed =
    oversized.length === 0 &&
    contaminated.length < samples.length * 0.05; // Less than 5% contamination

  if (!validationPassed) {
    onError(
      `Validation failed: ${oversized.length} oversized chunks, ${contaminated.length} contaminated chunks`
    );
  }

  return {
    validationPassed,
    oversized: oversized.length,
    contaminated: contaminated.length
  };
}
