#!/usr/bin/env tsx
/**
 * Recovery Script: Generate Missing Embeddings
 * 
 * This script fixes the pipeline failure that left 76% of pages without embeddings.
 * It identifies orphaned pages and generates embeddings with enhanced metadata.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { MetadataExtractor } from '../lib/metadata-extractor';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Configuration
const BATCH_SIZE = 5; // Process 5 pages at a time
const CHUNK_SIZE = 1000; // Characters per chunk
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay to avoid rate limits

// Split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = CHUNK_SIZE): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Generate embeddings for chunks
async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    
    embeddings.push(...response.data.map(d => d.embedding));
  }
  
  return embeddings;
}

async function main() {
  console.log('🔧 Missing Embeddings Recovery Script');
  console.log('=====================================\n');

  try {
    // Step 1: Find pages without embeddings
    console.log('📊 Analyzing current state...');
    
    // Get total page count
    const { count: totalPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total scraped pages: ${totalPages}`);
    
    // Find orphaned pages (pages without embeddings)
    // First get all page IDs that have embeddings
    const { data: pagesWithEmbeddings } = await supabase
      .from('page_embeddings')
      .select('page_id')
      .limit(10000);
    
    const pageIdsWithEmbeddings = pagesWithEmbeddings?.map(p => p.page_id) || [];
    
    // Now get pages that don't have embeddings
    let orphanQuery = supabase
      .from('scraped_pages')
      .select('id, url, title, content, domain_id')
      .order('created_at', { ascending: true })
      .limit(1000);  // Process in batches
    
    // Filter out pages that already have embeddings
    if (pageIdsWithEmbeddings.length > 0) {
      orphanQuery = orphanQuery.not('id', 'in', `(${pageIdsWithEmbeddings.map(id => `'${id}'`).join(',')})`);
    }
    
    const { data: orphanedPages, error: orphanError } = await orphanQuery;
    
    if (orphanError) {
      console.error('Error finding orphaned pages:', orphanError);
      return;
    }
    
    const orphanCount = orphanedPages?.length || 0;
    console.log(`Pages without embeddings: ${orphanCount} (${((orphanCount/totalPages!)*100).toFixed(1)}%)\n`);
    
    if (orphanCount === 0) {
      console.log('✅ All pages have embeddings! Nothing to fix.');
      return;
    }
    
    // Check for DC66-10P pages specifically
    const dc66Pages = orphanedPages?.filter(p => 
      p.content?.includes('DC66-10P') || p.url?.includes('DC66-10P')
    ) || [];
    
    if (dc66Pages.length > 0) {
      console.log(`🔍 Found ${dc66Pages.length} DC66-10P pages without embeddings`);
      console.log('These will be prioritized for processing.\n');
    }
    
    // Step 2: Process pages in batches
    console.log(`🚀 Starting embedding generation for ${orphanCount} pages...\n`);
    
    // Prioritize DC66-10P pages first
    const sortedPages = [
      ...dc66Pages,
      ...(orphanedPages?.filter(p => !dc66Pages.includes(p)) || [])
    ];
    
    let processed = 0;
    let failed = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < sortedPages.length; i += BATCH_SIZE) {
      const batch = sortedPages.slice(i, Math.min(i + BATCH_SIZE, sortedPages.length));
      
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (pages ${i+1}-${Math.min(i+BATCH_SIZE, sortedPages.length)} of ${sortedPages.length})...`);
      
      // Process each page in the batch
      const batchPromises = batch.map(async (page) => {
        try {
          // Skip if no content
          if (!page.content) {
            console.log(`  ⚠️ Skipping ${page.url} - no content`);
            return false;
          }
          
          // Generate chunks
          const chunks = splitIntoChunks(page.content);
          
          if (chunks.length === 0) {
            console.log(`  ⚠️ Skipping ${page.url} - no chunks generated`);
            return false;
          }
          
          // Generate embeddings
          const embeddings = await generateEmbeddings(chunks);
          
          // Extract enhanced metadata for each chunk
          const embeddingRecords = await Promise.all(
            chunks.map(async (chunk, index) => {
              // Extract metadata with SKU detection
              const metadata = await MetadataExtractor.extractEnhancedMetadata(
                chunk,
                page.content,
                page.url,
                page.title || '',
                index,
                chunks.length
              );
              
              return {
                page_id: page.id,
                chunk_text: chunk,
                embedding: embeddings[index],
                metadata: {
                  ...metadata,
                  domain_id: page.domain_id,
                  recovered_at: new Date().toISOString(),
                },
              };
            })
          );
          
          // Use the bulk insert function
          const { error: insertError } = await supabase
            .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
          
          if (insertError) {
            // Fallback to direct insert
            const { error: fallbackError } = await supabase
              .from('page_embeddings')
              .insert(embeddingRecords);
            
            if (fallbackError) {
              throw fallbackError;
            }
          }
          
          // Log if this was a DC66-10P page
          if (page.content?.includes('DC66-10P')) {
            console.log(`  ✅ DC66-10P page processed: ${page.url}`);
            
            // Check if SKUs were extracted
            const extractedSkus = embeddingRecords.some(r => 
              r.metadata.entities?.skus?.some((sku: string) => sku.includes('DC66'))
            );
            
            if (extractedSkus) {
              console.log(`    📦 DC66 SKUs successfully extracted!`);
            } else {
              console.log(`    ⚠️ DC66 SKUs not detected in metadata - may need regex fix`);
            }
          } else {
            console.log(`  ✅ Processed: ${page.url.substring(0, 60)}...`);
          }
          
          return true;
        } catch (error) {
          console.error(`  ❌ Failed: ${page.url}`, error);
          return false;
        }
      });
      
      // Wait for batch to complete
      const results = await Promise.all(batchPromises);
      processed += results.filter(r => r === true).length;
      failed += results.filter(r => r === false).length;
      
      // Progress update
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = processed / (elapsed || 1);
      const remaining = Math.round((sortedPages.length - processed) / rate);
      
      console.log(`  Progress: ${processed}/${sortedPages.length} pages (${failed} failed)`);
      console.log(`  Time: ${elapsed}s elapsed, ~${remaining}s remaining\n`);
      
      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < sortedPages.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Step 3: Final verification
    console.log('\n📈 Final Results:');
    console.log('=================');
    console.log(`✅ Successfully processed: ${processed} pages`);
    console.log(`❌ Failed: ${failed} pages`);
    console.log(`⏱️ Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);
    
    // Verify DC66-10P is now searchable
    console.log('\n🔍 Verifying DC66-10P search...');
    
    const { data: dc66Embeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .ilike('chunk_text', '%DC66-10P%')
      .limit(5);
    
    if (dc66Embeddings && dc66Embeddings.length > 0) {
      console.log(`✅ DC66-10P now has ${dc66Embeddings.length}+ embeddings!`);
      
      // Check if SKUs were extracted
      const hasSkus = dc66Embeddings.some(e => 
        e.metadata?.entities?.skus?.some((sku: string) => sku.includes('DC66'))
      );
      
      if (hasSkus) {
        console.log('✅ DC66 SKUs properly extracted in metadata!');
      } else {
        console.log('⚠️ DC66 SKUs not in metadata - may need metadata extractor fix');
      }
    } else {
      console.log('⚠️ DC66-10P embeddings not found - may need investigation');
    }
    
    // Final coverage check
    const { count: newOrphanCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', supabase.from('page_embeddings').select('page_id'));
    
    const coverage = ((totalPages! - newOrphanCount!) / totalPages!) * 100;
    console.log(`\n📊 New embedding coverage: ${coverage.toFixed(1)}%`);
    
    if (coverage > 95) {
      console.log('🎉 Excellent! Search pipeline is now healthy.');
    } else if (coverage > 80) {
      console.log('👍 Good progress! Consider running again for remaining pages.');
    } else {
      console.log('⚠️ Still low coverage. Check for persistent errors.');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the recovery
main().catch(console.error);