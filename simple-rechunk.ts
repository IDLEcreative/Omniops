#!/usr/bin/env npx tsx
/**
 * Simple Rechunking Script
 * Processes oversized chunks one by one
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPTIMAL_SIZE = 1200;
const MAX_SIZE = 1500;

async function processChunks() {
  let processed = 0;
  let created = 0;
  let errors = 0;

  console.log('🚀 Starting simple rechunking process...\n');

  while (true) {
    // Get next oversized chunk
    const { data: chunks, error: fetchError } = await supabase
      .from('page_embeddings')
      .select('*')
      .gte('length(chunk_text)', MAX_SIZE)
      .limit(1);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      break;
    }

    if (!chunks || chunks.length === 0) {
      console.log('\n✅ No more oversized chunks!');
      break;
    }

    const chunk = chunks[0];
    const originalLength = chunk.chunk_text.length;

    try {
      // Simple split by words
      const words = chunk.chunk_text.split(/\s+/);
      const newChunks: string[] = [];
      let currentChunk = '';

      for (const word of words) {
        if ((currentChunk + ' ' + word).length > OPTIMAL_SIZE && currentChunk.length > 200) {
          newChunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      
      if (currentChunk) {
        newChunks.push(currentChunk.trim());
      }

      console.log(`Processing: ${chunk.id.substring(0, 8)}... (${originalLength} → ${newChunks.length} chunks)`);

      // Insert new chunks
      for (let i = 0; i < newChunks.length; i++) {
        const { error: insertError } = await supabase
          .from('page_embeddings')
          .insert({
            page_id: chunk.page_id,
            domain_id: chunk.domain_id,
            chunk_text: newChunks[i],
            metadata: {
              ...chunk.metadata,
              original_chunk_id: chunk.id,
              chunk_index: i,
              total_chunks: newChunks.length,
              optimized: true,
              chunk_size: newChunks[i].length
            }
          });

        if (insertError) {
          console.error('  Insert error:', insertError);
          errors++;
        } else {
          created++;
        }
      }

      // Delete original
      const { error: deleteError } = await supabase
        .from('page_embeddings')
        .delete()
        .eq('id', chunk.id);

      if (deleteError) {
        console.error('  Delete error:', deleteError);
        errors++;
      } else {
        processed++;
      }

      // Progress update every 10 chunks
      if (processed % 10 === 0) {
        console.log(`\n📊 Progress: ${processed} processed, ${created} created, ${errors} errors`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Processing error:', error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL RESULTS:');
  console.log(`  • Processed: ${processed} chunks`);
  console.log(`  • Created: ${created} new chunks`);
  console.log(`  • Errors: ${errors}`);
  console.log('='.repeat(50) + '\n');
}

processChunks().catch(console.error);