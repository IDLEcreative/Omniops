/**
 * Atomic Page and Embeddings Service
 *
 * Purpose: Provide type-safe wrapper for atomic_page_with_embeddings PostgreSQL function
 *
 * Benefits:
 * - Data Consistency: No orphaned pages or embeddings
 * - Simpler Error Handling: Single point of failure
 * - Better Performance: Single database round-trip
 * - Atomic Rollback: Failed saves don't leave partial data
 *
 * Last Updated: 2025-11-08
 */

// eslint-disable-next-line no-restricted-imports -- Type-only import, no runtime code imported
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PageData {
  url: string;
  domain_id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  last_scraped_at?: string;
  status?: 'completed' | 'failed' | 'deleted';
}

export interface EmbeddingData {
  domain_id: string;
  chunk_text: string;
  embedding: number[]; // Will be converted to vector by function
  metadata: Record<string, any>;
}

export interface AtomicResult {
  success: boolean;
  page_id?: string;
  deleted_embeddings?: number;
  inserted_embeddings?: number;
  error?: string;
}

/**
 * Atomically save page and embeddings in single transaction
 *
 * This ensures:
 * - Page is saved (or updated if exists)
 * - Old embeddings are deleted
 * - New embeddings are inserted
 * - All in one transaction (rolls back on any failure)
 *
 * Example usage:
 * ```typescript
 * const result = await atomicSavePageWithEmbeddings(supabase, {
 *   url: 'https://example.com/page',
 *   domain_id: 'xxx-yyy-zzz',
 *   title: 'Example Page',
 *   content: 'Page content...',
 *   metadata: { scraped_at: new Date().toISOString() },
 * }, [
 *   {
 *     domain_id: 'xxx-yyy-zzz',
 *     chunk_text: 'First chunk...',
 *     embedding: [0.1, 0.2, ...], // 1536 dimensions
 *     metadata: { chunk_index: 0 },
 *   },
 * ]);
 *
 * if (result.success) {
 *   console.log(`Saved ${result.inserted_embeddings} embeddings for page ${result.page_id}`);
 * } else {
 *   console.error(`Failed: ${result.error}`);
 * }
 * ```
 *
 * @param supabase Supabase client (must have service role for transactions)
 * @param pageData Page information to save
 * @param embeddingsData Array of embeddings to insert
 * @returns Result with page_id and counts, or error
 */
export async function atomicSavePageWithEmbeddings(
  supabase: SupabaseClient,
  pageData: PageData,
  embeddingsData: EmbeddingData[]
): Promise<AtomicResult> {
  try {
    const { data, error } = await supabase.rpc('atomic_page_with_embeddings', {
      page_data: pageData,
      embeddings_data: embeddingsData,
    });

    if (error) {
      console.error('[AtomicSave] RPC error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data || !data.success) {
      console.error('[AtomicSave] Function returned error:', data?.error);
      return {
        success: false,
        error: data?.error || 'Unknown error',
      };
    }

    console.log(`[AtomicSave]   - Deleted ${data.deleted_embeddings} old embedding(s)`);
    console.log(`[AtomicSave]   - Inserted ${data.inserted_embeddings} new embedding(s)`);

    return {
      success: true,
      page_id: data.page_id,
      deleted_embeddings: data.deleted_embeddings,
      inserted_embeddings: data.inserted_embeddings,
    };
  } catch (exception) {
    console.error('[AtomicSave] Exception:', exception);
    return {
      success: false,
      error: exception instanceof Error ? exception.message : 'Unknown exception',
    };
  }
}

/**
 * Validate embedding dimensions before saving
 *
 * @param embeddings Array of embeddings to validate
 * @param expectedDimensions Expected vector size (default: 1536 for OpenAI)
 * @returns true if valid, false otherwise
 */
export function validateEmbeddings(
  embeddings: EmbeddingData[],
  expectedDimensions: number = 1536
): boolean {
  for (let i = 0; i < embeddings.length; i++) {
    const emb = embeddings[i];

    if (!emb) {
      console.error(`[Validation] Embedding ${i} is undefined`);
      return false;
    }

    if (!emb.embedding || !Array.isArray(emb.embedding)) {
      console.error(`[Validation] Embedding ${i} is not an array`);
      return false;
    }

    if (emb.embedding.length !== expectedDimensions) {
      console.error(
        `[Validation] Embedding ${i} has ${emb.embedding.length} dimensions, expected ${expectedDimensions}`
      );
      return false;
    }

    if (!emb.chunk_text || emb.chunk_text.trim().length === 0) {
      console.error(`[Validation] Embedding ${i} has empty chunk_text`);
      return false;
    }
  }

  return true;
}
