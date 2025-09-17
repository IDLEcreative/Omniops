#!/usr/bin/env npx tsx
/**
 * Chunk Size Optimizer
 * 
 * Re-chunks oversized text segments into optimal sizes (1000-1500 chars)
 * for better embedding quality and search relevance.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPTIMAL_CHUNK_SIZE = 1200; // Target chunk size
const MIN_CHUNK_SIZE = 200;
const MAX_CHUNK_SIZE = 1500;
const OVERLAP_SIZE = 100; // Overlap between chunks for context

interface Embedding {
  id: string;
  page_id: string;
  domain_id: string;
  chunk_text: string;
  metadata: any;
}

class ChunkOptimizer {
  private processedCount = 0;
  private totalCount = 0;
  private newChunksCreated = 0;

  async analyze() {
    console.log('📊 Analyzing current chunk sizes...\n');
    
    const { data: stats } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          COUNT(*) as total_chunks,
          COUNT(CASE WHEN length(chunk_text) > ${MAX_CHUNK_SIZE} THEN 1 END) as oversized_chunks,
          COUNT(CASE WHEN length(chunk_text) < ${MIN_CHUNK_SIZE} THEN 1 END) as undersized_chunks,
          AVG(length(chunk_text)) as avg_size,
          MIN(length(chunk_text)) as min_size,
          MAX(length(chunk_text)) as max_size
        FROM page_embeddings
        WHERE chunk_text IS NOT NULL
      `
    });

    const result = stats?.[0] || {};
    
    console.log('Current Statistics:');
    console.log(`  • Total Chunks: ${result.total_chunks}`);
    console.log(`  • Oversized (>${MAX_CHUNK_SIZE} chars): ${result.oversized_chunks}`);
    console.log(`  • Undersized (<${MIN_CHUNK_SIZE} chars): ${result.undersized_chunks}`);
    console.log(`  • Average Size: ${Math.round(result.avg_size)} chars`);
    console.log(`  • Min Size: ${result.min_size} chars`);
    console.log(`  • Max Size: ${result.max_size} chars\n`);
    
    return result;
  }

  private splitIntoChunks(text: string): string[] {
    if (!text || text.length <= MAX_CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = this.splitIntoSentences(text);
    let currentChunk = '';

    for (const sentence of sentences) {
      // If adding this sentence would exceed max size
      if (currentChunk.length + sentence.length > OPTIMAL_CHUNK_SIZE) {
        if (currentChunk.length >= MIN_CHUNK_SIZE) {
          chunks.push(currentChunk.trim());
          // Start new chunk with overlap
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-10).join(' '); // Last 10 words for context
          currentChunk = overlapWords + ' ' + sentence;
        } else {
          // Current chunk too small, add sentence anyway
          currentChunk += ' ' + sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length >= MIN_CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
    } else if (chunks.length > 0) {
      // Append to last chunk if too small
      chunks[chunks.length - 1] += ' ' + currentChunk.trim();
    } else {
      // Keep as is if it's the only chunk
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries, keeping the punctuation
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Further split very long sentences at commas or semicolons if needed
    const result: string[] = [];
    for (const sentence of sentences) {
      if (sentence.length > OPTIMAL_CHUNK_SIZE) {
        // Split on major punctuation
        const parts = sentence.split(/(?<=[,;:])\s+/);
        result.push(...parts);
      } else {
        result.push(sentence);
      }
    }
    
    return result;
  }

  async optimizeChunks(dryRun = true) {
    console.log(`🔧 Starting chunk optimization (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

    // Get oversized chunks
    const { data: oversizedChunks, error } = await supabase
      .from('page_embeddings')
      .select('id, page_id, domain_id, chunk_text, metadata')
      .gt('length(chunk_text)', MAX_CHUNK_SIZE)
      .order('created_at', { ascending: true })
      .limit(100); // Process in batches

    if (error) {
      console.error('Error fetching oversized chunks:', error);
      return;
    }

    if (!oversizedChunks || oversizedChunks.length === 0) {
      console.log('✅ No oversized chunks found. Database is optimized!\n');
      return;
    }

    this.totalCount = oversizedChunks.length;
    console.log(`Found ${this.totalCount} oversized chunks to process\n`);

    for (const chunk of oversizedChunks) {
      console.log(`Processing chunk ${chunk.id} (${chunk.chunk_text.length} chars)...`);
      
      const newChunks = this.splitIntoChunks(chunk.chunk_text);
      console.log(`  → Split into ${newChunks.length} chunks`);

      if (!dryRun) {
        // Delete original oversized chunk
        const { error: deleteError } = await supabase
          .from('page_embeddings')
          .delete()
          .eq('id', chunk.id);

        if (deleteError) {
          console.error(`  ❌ Error deleting chunk ${chunk.id}:`, deleteError);
          continue;
        }

        // Insert new optimized chunks
        const newEmbeddings = newChunks.map((text, index) => ({
          page_id: chunk.page_id,
          domain_id: chunk.domain_id,
          chunk_text: text,
          metadata: {
            ...chunk.metadata,
            chunk_index: index,
            original_chunk_id: chunk.id,
            optimized: true,
            chunk_size: text.length
          }
        }));

        const { error: insertError, data } = await supabase
          .from('page_embeddings')
          .insert(newEmbeddings);

        if (insertError) {
          console.error(`  ❌ Error inserting new chunks:`, insertError);
          continue;
        }

        console.log(`  ✅ Created ${newChunks.length} optimized chunks`);
        this.newChunksCreated += newChunks.length;
      } else {
        console.log(`  📝 Would create ${newChunks.length} chunks (sizes: ${newChunks.map(c => c.length).join(', ')})`);
      }

      this.processedCount++;
    }

    console.log('\n📊 Optimization Summary:');
    console.log(`  • Processed: ${this.processedCount}/${this.totalCount} chunks`);
    if (!dryRun) {
      console.log(`  • New chunks created: ${this.newChunksCreated}`);
      console.log(`  • Net change: ${this.newChunksCreated - this.processedCount} chunks`);
    }
  }

  async validateChunks() {
    console.log('🔍 Validating chunk sizes...\n');
    
    const { data: validation } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          CASE 
            WHEN length(chunk_text) < ${MIN_CHUNK_SIZE} THEN 'undersized'
            WHEN length(chunk_text) > ${MAX_CHUNK_SIZE} THEN 'oversized'
            ELSE 'optimal'
          END as size_category,
          COUNT(*) as count,
          AVG(length(chunk_text)) as avg_size
        FROM page_embeddings
        WHERE chunk_text IS NOT NULL
        GROUP BY size_category
        ORDER BY size_category
      `
    });

    console.log('Chunk Size Distribution:');
    validation?.forEach(cat => {
      const emoji = cat.size_category === 'optimal' ? '✅' : '⚠️';
      console.log(`  ${emoji} ${cat.size_category}: ${cat.count} chunks (avg: ${Math.round(cat.avg_size)} chars)`);
    });
  }

  async addSizeConstraints() {
    console.log('🔒 Adding chunk size validation constraints...\n');
    
    const migration = `
      -- Add check constraint for chunk size
      ALTER TABLE page_embeddings 
      ADD CONSTRAINT check_chunk_size 
      CHECK (
        chunk_text IS NULL OR 
        (length(chunk_text) >= ${MIN_CHUNK_SIZE} AND length(chunk_text) <= ${MAX_CHUNK_SIZE * 2})
      );
      
      -- Add index for chunk size queries
      CREATE INDEX IF NOT EXISTS idx_page_embeddings_chunk_size 
      ON page_embeddings((length(chunk_text)))
      WHERE chunk_text IS NOT NULL;
    `;

    console.log('Would apply migration:');
    console.log(migration);
    console.log('\nNote: Run this in Supabase SQL editor to enforce size limits\n');
  }
}

// CLI Interface
async function main() {
  const optimizer = new ChunkOptimizer();
  const command = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');

  try {
    switch (command) {
      case 'analyze':
        await optimizer.analyze();
        break;
      
      case 'optimize':
        await optimizer.analyze();
        await optimizer.optimizeChunks(!isDryRun);
        await optimizer.validateChunks();
        break;
      
      case 'validate':
        await optimizer.validateChunks();
        break;
      
      case 'constraints':
        await optimizer.addSizeConstraints();
        break;
      
      default:
        console.log('📚 Chunk Size Optimizer\n');
        console.log('Usage:');
        console.log('  npx tsx optimize-chunk-sizes.ts analyze      - Analyze current chunk sizes');
        console.log('  npx tsx optimize-chunk-sizes.ts optimize     - Re-chunk oversized text (LIVE)');
        console.log('  npx tsx optimize-chunk-sizes.ts optimize --dry-run - Preview changes');
        console.log('  npx tsx optimize-chunk-sizes.ts validate     - Validate chunk sizes');
        console.log('  npx tsx optimize-chunk-sizes.ts constraints  - Show size constraint SQL');
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ChunkOptimizer };