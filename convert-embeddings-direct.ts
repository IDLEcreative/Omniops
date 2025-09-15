#!/usr/bin/env npx tsx
/**
 * Convert existing embeddings from JSON string to vector format in batches
 * Works directly with the existing embedding column
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function convertEmbeddingsDirect() {
  console.log('🔄 CONVERTING EMBEDDINGS TO VECTOR FORMAT\n');
  console.log('=' .repeat(70));
  
  const BATCH_SIZE = 50; // Smaller batch size for safety
  let processed = 0;
  let converted = 0;
  let errors = 0;
  let offset = 0;
  
  try {
    // First check how many embeddings we have
    const { count: totalCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total embeddings to process: ${totalCount}\n`);
    
    // Check what format the first embedding is in
    const { data: sample } = await supabase
      .from('page_embeddings')
      .select('id, embedding')
      .limit(1)
      .single();
    
    if (sample) {
      console.log(`📊 Current format check:`);
      console.log(`   Type: ${typeof sample.embedding}`);
      if (typeof sample.embedding === 'string') {
        console.log(`   String length: ${sample.embedding.length}`);
        console.log(`   First 100 chars: ${sample.embedding.substring(0, 100)}...`);
      } else if (Array.isArray(sample.embedding)) {
        console.log(`   Array length: ${sample.embedding.length}`);
      }
    }
    
    console.log('\n📊 Starting batch conversion...\n');
    
    while (offset < (totalCount || 0)) {
      // Get a batch of records
      const { data: batch, error: fetchError } = await supabase
        .from('page_embeddings')
        .select('id, embedding')
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (fetchError) {
        console.error('Error fetching batch:', fetchError);
        break;
      }
      
      if (!batch || batch.length === 0) {
        console.log('\n✅ No more records to process');
        break;
      }
      
      const startNum = offset + 1;
      const endNum = offset + batch.length;
      process.stdout.write(`   Processing records ${startNum}-${endNum} of ${totalCount}...`);
      
      let batchConverted = 0;
      let batchErrors = 0;
      
      // Process each record in the batch
      for (const record of batch) {
        try {
          let vectorArray: number[];
          
          // Parse the embedding based on its current format
          if (typeof record.embedding === 'string') {
            // Check if it's already in vector format [...]
            if (record.embedding.startsWith('[') && record.embedding.endsWith(']')) {
              // Check if it's a proper vector format or JSON
              try {
                // Try to parse as JSON first
                const parsed = JSON.parse(record.embedding);
                if (Array.isArray(parsed) && parsed.length === 1536) {
                  vectorArray = parsed;
                } else {
                  // Skip if not the right dimensions
                  batchErrors++;
                  continue;
                }
              } catch {
                // It might already be in vector format, skip it
                batchConverted++;
                continue;
              }
            } else {
              // It's a JSON string that needs parsing
              try {
                const parsed = JSON.parse(record.embedding);
                if (Array.isArray(parsed) && parsed.length === 1536) {
                  vectorArray = parsed;
                } else {
                  batchErrors++;
                  continue;
                }
              } catch {
                batchErrors++;
                continue;
              }
            }
          } else if (Array.isArray(record.embedding)) {
            // Already an array
            vectorArray = record.embedding;
          } else {
            batchErrors++;
            continue;
          }
          
          // Format as vector string for pgvector
          const vectorString = `[${vectorArray.join(',')}]`;
          
          // Update the record
          const { error: updateError } = await supabase
            .from('page_embeddings')
            .update({ embedding: vectorString })
            .eq('id', record.id);
          
          if (updateError) {
            batchErrors++;
          } else {
            batchConverted++;
          }
          
        } catch (error) {
          batchErrors++;
        }
      }
      
      converted += batchConverted;
      errors += batchErrors;
      processed += batch.length;
      
      console.log(` ✓ (${batchConverted} converted, ${batchErrors} errors)`);
      
      offset += BATCH_SIZE;
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('\n📊 CONVERSION COMPLETE:');
    console.log(`   Total processed: ${processed}`);
    console.log(`   Successfully converted: ${converted}`);
    console.log(`   Errors: ${errors}`);
    if (processed > 0) {
      console.log(`   Success rate: ${((converted / processed) * 100).toFixed(1)}%`);
    }
    
    // Test if conversion worked
    console.log('\n📊 Testing conversion...\n');
    
    const { data: testSample } = await supabase
      .from('page_embeddings')
      .select('id, embedding')
      .limit(1)
      .single();
    
    if (testSample) {
      console.log(`   Sample after conversion:`);
      console.log(`   Type: ${typeof testSample.embedding}`);
      if (typeof testSample.embedding === 'string') {
        console.log(`   String length: ${testSample.embedding.length}`);
        if (testSample.embedding.length > 30000) {
          console.log(`   ✅ Embeddings are now in vector format!`);
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Conversion failed:', error);
  }
}

// Add graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Conversion interrupted by user');
  process.exit(0);
});

convertEmbeddingsDirect().catch(console.error);