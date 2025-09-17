#!/usr/bin/env npx tsx
/**
 * Batch Re-chunking Script
 * 
 * Processes oversized chunks in small batches to avoid overwhelming the system.
 * Designed to handle 7,387+ oversized chunks safely.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 10; // Process 10 chunks at a time
const OPTIMAL_CHUNK_SIZE = 1200;
const MAX_CHUNK_SIZE = 1500;
const MIN_CHUNK_SIZE = 200;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

class BatchRechunker {
  private totalProcessed = 0;
  private totalCreated = 0;
  private errors: string[] = [];

  async getTotalOversizedCount(): Promise<number> {
    const { count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .gte('length(chunk_text)', MAX_CHUNK_SIZE);
    
    return count || 0;
  }

  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      const wordLength = word.length + 1; // +1 for space
      
      if (currentLength + wordLength > OPTIMAL_CHUNK_SIZE && currentLength >= MIN_CHUNK_SIZE) {
        // Save current chunk
        chunks.push(currentChunk.join(' '));
        
        // Start new chunk with overlap (last 20 words)
        const overlapWords = Math.min(20, Math.floor(currentChunk.length * 0.1));
        currentChunk = currentChunk.slice(-overlapWords);
        currentChunk.push(word);
        currentLength = currentChunk.join(' ').length;
      } else {
        currentChunk.push(word);
        currentLength += wordLength;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      const finalChunk = currentChunk.join(' ');
      if (finalChunk.length >= MIN_CHUNK_SIZE) {
        chunks.push(finalChunk);
      } else if (chunks.length > 0) {
        // Append to previous chunk if too small
        chunks[chunks.length - 1] += ' ' + finalChunk;
      } else {
        // Keep as is if it's the only chunk
        chunks.push(finalChunk);
      }
    }

    return chunks;
  }

  async processBatch(offset: number): Promise<boolean> {
    console.log(`\n📦 Processing batch at offset ${offset}...`);
    
    // Fetch batch of oversized chunks
    const { data: chunks, error: fetchError } = await supabase
      .from('page_embeddings')
      .select('*')
      .gte('length(chunk_text)', MAX_CHUNK_SIZE)
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      this.errors.push(`Fetch error at offset ${offset}: ${fetchError.message}`);
      console.error('❌ Fetch error:', fetchError);
      return false;
    }

    if (!chunks || chunks.length === 0) {
      console.log('✅ No more chunks to process');
      return false;
    }

    console.log(`  Found ${chunks.length} chunks to process`);

    for (const chunk of chunks) {
      try {
        const originalSize = chunk.chunk_text.length;
        const newChunks = this.splitTextIntoChunks(chunk.chunk_text);
        
        console.log(`  • Chunk ${chunk.id.substring(0, 8)}: ${originalSize} → ${newChunks.length} chunks`);
        
        // Prepare new embeddings
        const newEmbeddings = newChunks.map((text, index) => ({
          page_id: chunk.page_id,
          domain_id: chunk.domain_id,
          chunk_text: text,
          embedding: null, // Will need to regenerate
          metadata: {
            ...chunk.metadata,
            original_chunk_id: chunk.id,
            chunk_index: index,
            total_chunks: newChunks.length,
            optimized: true,
            chunk_size: text.length,
            rechunked_at: new Date().toISOString()
          }
        }));

        // Insert new chunks directly (batch insert)
        const { error: insertError } = await supabase
          .from('page_embeddings')
          .insert(newEmbeddings);
        
        if (insertError) {
          throw insertError;
        }

        // Delete original oversized chunk
        const { error: deleteError } = await supabase
          .from('page_embeddings')
          .delete()
          .eq('id', chunk.id);

        if (deleteError) {
          throw deleteError;
        }

        this.totalCreated += newChunks.length;
        this.totalProcessed++;
        
      } catch (error) {
        const errorMsg = `Failed to process chunk ${chunk.id}: ${error}`;
        this.errors.push(errorMsg);
        console.error(`    ❌ ${errorMsg}`);
      }
    }

    return chunks.length === BATCH_SIZE; // Continue if full batch
  }

  async run() {
    console.log('🚀 Starting batch re-chunking process\n');
    
    const totalCount = await this.getTotalOversizedCount();
    console.log(`📊 Total oversized chunks to process: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log('✨ No oversized chunks found. Database is already optimized!');
      return;
    }

    const estimatedTime = (totalCount / BATCH_SIZE) * (DELAY_BETWEEN_BATCHES / 1000);
    console.log(`⏱️  Estimated time: ${Math.ceil(estimatedTime / 60)} minutes\n`);
    
    let offset = 0;
    let hasMore = true;
    
    const startTime = Date.now();
    
    while (hasMore) {
      hasMore = await this.processBatch(offset);
      
      if (hasMore) {
        // Progress update
        const progress = Math.min(100, Math.round((this.totalProcessed / totalCount) * 100));
        console.log(`\n📈 Progress: ${progress}% (${this.totalProcessed}/${totalCount})`);
        
        // Wait between batches
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
      
      // Don't increment offset - always process from 0 since we're deleting as we go
      // This ensures we don't skip any chunks
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ RE-CHUNKING COMPLETE\n');
    console.log('📊 Final Statistics:');
    console.log(`  • Processed: ${this.totalProcessed} oversized chunks`);
    console.log(`  • Created: ${this.totalCreated} optimized chunks`);
    console.log(`  • Net increase: ${this.totalCreated - this.totalProcessed} chunks`);
    console.log(`  • Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    
    if (this.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${this.errors.length}`);
      console.log('First 5 errors:');
      this.errors.slice(0, 5).forEach(err => {
        console.log(`  • ${err}`);
      });
    }
    
    // Final validation
    const remaining = await this.getTotalOversizedCount();
    if (remaining > 0) {
      console.log(`\n⚠️  ${remaining} oversized chunks still remain (likely from errors)`);
    } else {
      console.log('\n✨ All chunks are now optimally sized!');
    }
  }
}

// Safety check function
async function safetyCheck(): Promise<boolean> {
  console.log('🔒 Running safety checks...\n');
  
  // Check if we can access page_embeddings table
  const { count, error } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .limit(1);
  
  if (error) {
    console.error('❌ Cannot access page_embeddings table:', error.message);
    return false;
  }
  
  console.log(`✅ Database accessible (${count} total embeddings)\n`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes('--force');
  
  if (!isForce) {
    console.log('⚠️  WARNING: This will re-chunk 7,387+ embeddings\n');
    console.log('This process will:');
    console.log('  • Delete oversized chunks');
    console.log('  • Create multiple smaller chunks for each');
    console.log('  • Require embeddings to be regenerated');
    console.log('\nEstimated time: 25-30 minutes\n');
    console.log('To proceed, run with --force flag:');
    console.log('  npx tsx batch-rechunk-embeddings.ts --force\n');
    return;
  }
  
  const safe = await safetyCheck();
  if (!safe) {
    console.log('❌ Safety checks failed. Aborting.');
    return;
  }
  
  const rechunker = new BatchRechunker();
  await rechunker.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { BatchRechunker };