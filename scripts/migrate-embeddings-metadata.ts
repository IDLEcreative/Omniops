#!/usr/bin/env npx tsx
/**
 * Migration script to add metadata to existing embeddings
 * Processes embeddings in batches with optimized performance
 */

import { createServiceRoleClient } from '../lib/supabase/server';
import { OptimizedMetadataExtractor } from '../lib/metadata-extractor-optimized';

interface EmbeddingRecord {
  id: string;
  page_id: string;
  chunk_text: string;
  metadata: any;
}

interface PageData {
  id: string;
  url: string;
  title: string;
  content: string;
}

class EmbeddingMetadataMigration {
  private supabase: any;
  private processedCount = 0;
  private errorCount = 0;
  private skipCount = 0;
  private startTime = Date.now();

  async initialize() {
    this.supabase = await createServiceRoleClient();
    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client');
    }
  }

  /**
   * Get count of embeddings without metadata
   */
  async getEmbeddingsToMigrate(): Promise<number> {
    const { count, error } = await this.supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .or('metadata.is.null,metadata->content_type.is.null');

    if (error) {
      console.error('Error counting embeddings:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Process embeddings in batches
   */
  async processBatch(batchSize: number = 100): Promise<boolean> {
    // Fetch batch of embeddings without metadata
    const { data: embeddings, error: fetchError } = await this.supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, metadata')
      .or('metadata.is.null,metadata->content_type.is.null')
      .limit(batchSize);

    if (fetchError) {
      console.error('Error fetching embeddings:', fetchError);
      return false;
    }

    if (!embeddings || embeddings.length === 0) {
      return false; // No more embeddings to process
    }

    // Get unique page IDs
    const pageIds = [...new Set(embeddings.map((e: EmbeddingRecord) => e.page_id))];
    
    // Fetch page data for all embeddings in batch
    const { data: pages, error: pageError } = await this.supabase
      .from('scraped_pages')
      .select('id, url, title, content')
      .in('id', pageIds);

    if (pageError) {
      console.error('Error fetching pages:', pageError);
      return false;
    }

    // Create page lookup map
    const pageMap = new Map<string, PageData>();
    pages?.forEach((page: PageData) => {
      pageMap.set(page.id, page);
    });

    // Process embeddings in parallel (with concurrency limit)
    const concurrencyLimit = 50;
    const updates = [];
    
    for (let i = 0; i < embeddings.length; i += concurrencyLimit) {
      const batch = embeddings.slice(i, i + concurrencyLimit);
      
      const batchUpdates = await Promise.all(
        batch.map(async (embedding: EmbeddingRecord) => {
          const page = pageMap.get(embedding.page_id);
          
          if (!page) {
            console.warn(`Page not found for embedding ${embedding.id}`);
            this.skipCount++;
            return null;
          }

          try {
            // Extract metadata using optimized extractor
            const metadata = await OptimizedMetadataExtractor.extractEnhancedMetadata(
              embedding.chunk_text,
              page.content,
              page.url,
              page.title || '',
              embedding.metadata?.chunk_index || 0,
              embedding.metadata?.total_chunks || 1,
              undefined
            );

            return {
              id: embedding.id,
              metadata
            };
          } catch (error) {
            console.error(`Error processing embedding ${embedding.id}:`, error);
            this.errorCount++;
            return null;
          }
        })
      );

      updates.push(...batchUpdates.filter(u => u !== null));
    }

    // Bulk update embeddings with new metadata
    if (updates.length > 0) {
      // Update in smaller batches to avoid query size limits
      const updateBatchSize = 50;
      
      for (let i = 0; i < updates.length; i += updateBatchSize) {
        const updateBatch = updates.slice(i, i + updateBatchSize);
        
        // Use upsert for batch update
        const { error: updateError } = await this.supabase
          .from('page_embeddings')
          .upsert(
            updateBatch.map(u => ({
              id: u!.id,
              metadata: u!.metadata
            })),
            { onConflict: 'id' }
          );

        if (updateError) {
          console.error('Error updating embeddings:', updateError);
          this.errorCount += updateBatch.length;
        } else {
          this.processedCount += updateBatch.length;
        }
      }
    }

    // Clear cache periodically
    if (this.processedCount % 500 === 0) {
      OptimizedMetadataExtractor.clearCache();
    }

    return true; // Continue processing
  }

  /**
   * Run the full migration
   */
  async run() {
    console.log('🚀 Starting Embedding Metadata Migration');
    console.log('=' .repeat(60));

    await this.initialize();

    const totalCount = await this.getEmbeddingsToMigrate();
    console.log(`\nFound ${totalCount.toLocaleString()} embeddings to migrate`);

    if (totalCount === 0) {
      console.log('✅ No embeddings need migration!');
      return;
    }

    console.log('\nProcessing in batches of 100...\n');

    const progressInterval = setInterval(() => {
      this.printProgress(totalCount);
    }, 5000); // Update every 5 seconds

    // Process all batches
    while (await this.processBatch(100)) {
      // Print progress every 500 items
      if (this.processedCount % 500 === 0) {
        this.printProgress(totalCount);
      }
    }

    clearInterval(progressInterval);

    // Final report
    this.printFinalReport(totalCount);
  }

  /**
   * Print progress update
   */
  private printProgress(total: number) {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    const rate = this.processedCount / elapsed;
    const remaining = (total - this.processedCount) / rate;
    const percentage = (this.processedCount / total * 100).toFixed(1);

    console.log(
      `Progress: ${this.processedCount.toLocaleString()}/${total.toLocaleString()} ` +
      `(${percentage}%) | ` +
      `Rate: ${rate.toFixed(0)}/sec | ` +
      `Est. remaining: ${this.formatTime(remaining)}`
    );
  }

  /**
   * Print final migration report
   */
  private printFinalReport(total: number) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.processedCount / elapsed;

    console.log('\n' + '=' .repeat(60));
    console.log('📊 Migration Complete!');
    console.log('=' .repeat(60));
    console.log(`
Summary:
  Total embeddings:    ${total.toLocaleString()}
  Processed:          ${this.processedCount.toLocaleString()}
  Skipped:            ${this.skipCount.toLocaleString()}
  Errors:             ${this.errorCount.toLocaleString()}
  
Performance:
  Total time:         ${this.formatTime(elapsed)}
  Average rate:       ${rate.toFixed(0)} embeddings/sec
  
Memory Usage:
  Heap Used:          ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
  RSS:                ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB
    `);

    if (this.errorCount > 0) {
      console.log('⚠️  Some embeddings failed to process. Check logs for details.');
    } else {
      console.log('✅ All embeddings successfully migrated!');
    }
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(0)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs.toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
}

// Main execution
async function main() {
  const migration = new EmbeddingMetadataMigration();
  
  try {
    await migration.run();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  process.exit(1);
});

main();