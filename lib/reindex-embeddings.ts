/**
 * Enterprise-grade Reindex System for Embeddings
 *
 * This system provides a controlled way to rebuild search embeddings
 * when algorithms change, content structure updates, or quality issues arise.
 *
 * Features:
 * - Batch processing to avoid timeouts
 * - Progress tracking and resumability
 * - Validation of results
 * - Clean text extraction and chunking
 * - Proper error handling
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import OpenAI from 'openai';
import {
  ReindexOptions,
  ReindexProgress,
  ReindexResult,
  PageData,
  CHUNK_SIZE,
  BATCH_SIZE
} from './reindex-embeddings-types';
import {
  chunkText,
  updateProgress,
  calculateStatistics
} from './reindex-embeddings-utils';
import {
  clearEmbeddings,
  getPages,
  generateAndSaveEmbeddings,
  validateReindex
} from './reindex-embeddings-processor';

export class EmbeddingReindexer {
  private supabase: any;
  private openai: any;
  private progress: ReindexProgress;
  private errors: string[] = [];

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string
  ) {
    this.supabase = createServiceRoleClientSync();
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.progress = {
      phase: 'clearing',
      current: 0,
      total: 0,
      percentage: 0,
      message: 'Initializing...'
    };
  }

  /**
   * Main reindex method
   */
  async reindex(options: ReindexOptions = {}): Promise<ReindexResult> {
    const startTime = Date.now();
    const {
      domainId,
      chunkSize = CHUNK_SIZE,
      clearExisting = true,
      validateResults = true,
      dryRun = false,
      onProgress
    } = options;

    try {
      // Step 1: Clear existing embeddings if requested
      if (clearExisting && !dryRun) {
        await this.clearExistingEmbeddings(domainId, onProgress);
      }

      // Step 2: Get pages to process
      const pages = await getPages(this.supabase, domainId);
      if (!pages || pages.length === 0) {
        throw new Error('No pages found to reindex');
      }

      this.progress = updateProgress(
        'chunking',
        0,
        pages.length,
        'Processing pages...',
        this.errors,
        onProgress
      );

      // Step 3: Process pages in batches
      const statistics = await this.processPages(pages, chunkSize, dryRun, onProgress);

      // Step 4: Validate results if requested
      let validationPassed = true;
      if (validateResults && !dryRun) {
        validationPassed = await this.validateResults(chunkSize, onProgress);
      }

      // Calculate final statistics
      const { avgChunkSize, maxChunkSize } = calculateStatistics(statistics.chunkSizes);
      const duration = Date.now() - startTime;

      this.progress = updateProgress(
        'complete',
        pages.length,
        pages.length,
        'Reindex complete!',
        this.errors,
        onProgress
      );

      return {
        success: validationPassed && this.errors.length === 0,
        pagesProcessed: pages.length,
        chunksCreated: statistics.totalChunks,
        embeddingsGenerated: statistics.totalEmbeddings,
        averageChunkSize: avgChunkSize,
        maxChunkSize: maxChunkSize,
        errors: this.errors,
        duration: duration
      };

    } catch (error) {
      this.errors.push(`Fatal error: ${error}`);
      return {
        success: false,
        pagesProcessed: 0,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        averageChunkSize: 0,
        maxChunkSize: 0,
        errors: this.errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Clear existing embeddings wrapper
   */
  private async clearExistingEmbeddings(
    domainId?: string,
    onProgress?: (progress: ReindexProgress) => void
  ): Promise<void> {
    this.progress = updateProgress(
      'clearing',
      0,
      100,
      'Clearing old embeddings...',
      this.errors,
      onProgress
    );

    await clearEmbeddings(
      this.supabase,
      domainId,
      (current: number, total: number, message: string) => {
        this.progress = updateProgress(
          'clearing',
          current,
          total,
          message,
          this.errors,
          onProgress
        );
      }
    );
  }

  /**
   * Process pages and generate embeddings
   */
  private async processPages(
    pages: PageData[],
    chunkSize: number,
    dryRun: boolean,
    onProgress?: (progress: ReindexProgress) => void
  ): Promise<{
    totalChunks: number;
    totalEmbeddings: number;
    chunkSizes: number[];
  }> {
    let totalChunks = 0;
    let totalEmbeddings = 0;
    const chunkSizes: number[] = [];

    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);

      for (const page of batch) {
        try {
          // Chunk the text
          const chunks = chunkText(page.text_content || page.content || '', chunkSize);

          if (chunks.length === 0) continue;

          totalChunks += chunks.length;
          chunks.forEach(chunk => chunkSizes.push(chunk.length));

          // Generate and save embeddings
          if (!dryRun) {
            const embeddingCount = await generateAndSaveEmbeddings(
              this.supabase,
              this.openai,
              page.id,
              page.domain_id,
              page.url,
              page.title || '',
              chunks,
              (error: string) => this.errors.push(error)
            );
            totalEmbeddings += embeddingCount;
          }

        } catch (error) {
          this.errors.push(`Error processing page ${page.url}: ${error}`);
        }
      }

      this.progress = updateProgress(
        'embedding',
        i + batch.length,
        pages.length,
        `Processed ${i + batch.length}/${pages.length} pages`,
        this.errors,
        onProgress
      );
    }

    return { totalChunks, totalEmbeddings, chunkSizes };
  }

  /**
   * Validate reindex results wrapper
   */
  private async validateResults(
    targetChunkSize: number,
    onProgress?: (progress: ReindexProgress) => void
  ): Promise<boolean> {
    this.progress = updateProgress(
      'validating',
      0,
      100,
      'Validating results...',
      this.errors,
      onProgress
    );

    const result = await validateReindex(
      this.supabase,
      targetChunkSize,
      (error: string) => this.errors.push(error)
    );

    this.progress = updateProgress(
      'validating',
      100,
      100,
      'Validation complete',
      this.errors,
      onProgress
    );

    return result.validationPassed;
  }
}

// Export convenience function for CLI usage
export async function reindexEmbeddings(
  domainId?: string,
  options: Partial<ReindexOptions> = {}
): Promise<ReindexResult> {
  const openaiKey = process.env.OPENAI_API_KEY!;

  const reindexer = new EmbeddingReindexer(supabaseUrl, supabaseKey, openaiKey);

  return await reindexer.reindex({
    domainId,
    ...options,
    onProgress: (progress) => {
      console.log(`[${progress.phase}] ${progress.percentage}% - ${progress.message}`);
    }
  });
}

// Re-export types for convenience
export * from './reindex-embeddings-types';
