#!/usr/bin/env tsx
/**
 * SAFE Recovery Script: Generate Missing Embeddings
 * 
 * This script fixes the pipeline failure that left pages without embeddings.
 * Includes all critical bug fixes and safety improvements.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { MetadataExtractor } from '../lib/metadata-extractor';

dotenv.config({ path: '.env.local' });

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 
  'OPENAI_API_KEY'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Configuration with defaults
const CONFIG = {
  BATCH_SIZE: parseInt(process.env.EMBEDDING_BATCH_SIZE || '5'),
  CHUNK_SIZE: parseInt(process.env.EMBEDDING_CHUNK_SIZE || '1000'),
  DELAY_BETWEEN_BATCHES: parseInt(process.env.EMBEDDING_DELAY_MS || '2000'),
  OPENAI_BATCH_SIZE: parseInt(process.env.OPENAI_BATCH_SIZE || '10'), // Reduced for safety
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || '1000'),
};

// Split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = CONFIG.CHUNK_SIZE): string[] {
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

// Generate embeddings with retry logic
async function generateEmbeddingsWithRetry(
  chunks: string[],
  retries = CONFIG.MAX_RETRIES
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < chunks.length; i += CONFIG.OPENAI_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CONFIG.OPENAI_BATCH_SIZE);
    let attempt = 0;
    let lastError: any;
    
    while (attempt < retries) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });
        
        embeddings.push(...response.data.map(d => d.embedding));
        break; // Success, exit retry loop
        
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        if (error?.status === 429) {
          // Rate limit - use exponential backoff
          const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`  ⏳ Rate limited, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt < retries) {
          // Other error - simple retry
          console.log(`  ⚠️ Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
        }
      }
    }
    
    if (attempt >= retries) {
      throw new Error(`Failed to generate embeddings after ${retries} attempts: ${lastError}`);
    }
    
    // Small delay between batches to avoid rate limits
    if (i + CONFIG.OPENAI_BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return embeddings;
}

// Insert embeddings with proper error handling
async function insertEmbeddings(embeddingRecords: any[]): Promise<boolean> {
  try {
    // Try bulk insert first
    const { error: bulkError } = await supabase
      .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
    
    if (!bulkError) {
      return true;
    }
    
    console.log('  ⚠️ Bulk insert failed, trying individual inserts...');
    
    // Fallback to individual inserts
    let successCount = 0;
    for (const record of embeddingRecords) {
      const { error } = await supabase
        .from('page_embeddings')
        .insert(record);
      
      if (error) {
        console.error(`    ❌ Failed chunk: "${record.chunk_text.substring(0, 50)}..."`, error.message);
      } else {
        successCount++;
      }
    }
    
    console.log(`    ✓ Inserted ${successCount}/${embeddingRecords.length} embeddings`);
    return successCount > 0;
    
  } catch (error) {
    console.error('  ❌ Insert failed:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Safe Missing Embeddings Recovery Script');
  console.log('==========================================\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Find pages without embeddings
    console.log('📊 Analyzing current state...');
    
    // Get total page count
    const { count: totalPages, error: countError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Failed to count pages: ${countError.message}`);
    }
    
    console.log(`Total scraped pages: ${totalPages}`);
    
    // Get pages that have embeddings (fixed query)
    const { data: pagesWithEmbeddings, error: embeddingsError } = await supabase
      .from('page_embeddings')
      .select('page_id')
      .limit(10000);
    
    if (embeddingsError) {
      throw new Error(`Failed to get pages with embeddings: ${embeddingsError.message}`);
    }
    
    const pageIdsWithEmbeddings = new Set(pagesWithEmbeddings?.map(p => p.page_id) || []);
    
    // Get all pages and filter in memory (safer approach)
    const { data: allPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content, domain_id')
      .order('created_at', { ascending: true })
      .limit(1000);
    
    if (pagesError) {
      throw new Error(`Failed to get pages: ${pagesError.message}`);
    }
    
    // Filter pages that don't have embeddings
    const orphanedPages = (allPages || []).filter(
      page => !pageIdsWithEmbeddings.has(page.id)
    );
    
    const orphanCount = orphanedPages.length;
    console.log(`Pages without embeddings: ${orphanCount} (${((orphanCount/totalPages!)*100).toFixed(1)}%)\n`);
    
    if (orphanCount === 0) {
      console.log('✅ All pages have embeddings! Nothing to fix.');
      return;
    }
    
    // Check for DC66-10P pages specifically
    const dc66Pages = orphanedPages.filter(p => 
      p.content?.includes('DC66-10P') || 
      p.url?.includes('DC66-10P') ||
      p.content?.includes('DC66')
    );
    
    if (dc66Pages.length > 0) {
      console.log(`🔍 Found ${dc66Pages.length} DC66 pages without embeddings`);
      console.log('These will be prioritized for processing.\n');
    }
    
    // Step 2: Process pages in batches
    console.log(`🚀 Starting embedding generation for ${orphanCount} pages...\n`);
    
    // Prioritize DC66 pages first
    const sortedPages = [
      ...dc66Pages,
      ...orphanedPages.filter(p => !dc66Pages.includes(p))
    ];
    
    let processed = 0;
    let failed = 0;
    
    // Memory monitoring
    const logMemory = () => {
      if (global.gc) global.gc();
      const usage = process.memoryUsage();
      return `Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
    };
    
    for (let i = 0; i < sortedPages.length; i += CONFIG.BATCH_SIZE) {
      const batch = sortedPages.slice(i, Math.min(i + CONFIG.BATCH_SIZE, sortedPages.length));
      const batchNum = Math.floor(i/CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(sortedPages.length / CONFIG.BATCH_SIZE);
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${logMemory()})`);
      console.log(`Processing pages ${i+1}-${Math.min(i+CONFIG.BATCH_SIZE, sortedPages.length)} of ${sortedPages.length}`);
      
      // Process each page in the batch
      const batchPromises = batch.map(async (page) => {
        try {
          // Skip if no content
          if (!page.content || page.content.trim().length < 10) {
            console.log(`  ⚠️ Skipping ${page.url.substring(0, 50)}... - insufficient content`);
            return false;
          }
          
          // Generate chunks
          const chunks = splitIntoChunks(page.content);
          
          if (chunks.length === 0) {
            console.log(`  ⚠️ Skipping ${page.url.substring(0, 50)}... - no chunks generated`);
            return false;
          }
          
          console.log(`  📄 Processing: ${page.url.substring(0, 60)}... (${chunks.length} chunks)`);
          
          // Generate embeddings with retry logic
          const embeddings = await generateEmbeddingsWithRetry(chunks);
          
          // Extract enhanced metadata for each chunk
          const embeddingRecords = await Promise.all(
            chunks.map(async (chunk, index) => {
              // Extract metadata with improved SKU detection
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
          
          // Insert embeddings with error handling
          const success = await insertEmbeddings(embeddingRecords);
          
          if (success) {
            // Log special cases
            if (page.content?.includes('DC66')) {
              const extractedSkus = embeddingRecords.some(r => 
                r.metadata.entities?.skus?.some((sku: string) => sku.includes('DC66'))
              );
              
              console.log(`  ✅ DC66 page processed: ${extractedSkus ? 'SKUs extracted' : 'SKUs not detected'}`);
            } else {
              console.log(`  ✅ Success`);
            }
            return true;
          } else {
            console.log(`  ❌ Failed to insert embeddings`);
            return false;
          }
          
        } catch (error) {
          console.error(`  ❌ Failed: ${page.url.substring(0, 50)}...`, error);
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
      const remaining = Math.round((sortedPages.length - processed - failed) / (rate || 1));
      
      console.log(`\n📈 Progress: ${processed} succeeded, ${failed} failed, ${sortedPages.length - processed - failed} remaining`);
      console.log(`⏱️  Time: ${elapsed}s elapsed, ~${remaining}s remaining`);
      
      // Delay between batches to avoid rate limits
      if (i + CONFIG.BATCH_SIZE < sortedPages.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Step 3: Final verification
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${processed} pages`);
    console.log(`❌ Failed: ${failed} pages`);
    console.log(`⏱️  Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);
    
    // Verify DC66-10P is now searchable
    console.log('\n🔍 Verifying DC66 search capability...');
    
    const { data: dc66Embeddings, count: dc66Count } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata', { count: 'exact' })
      .or('chunk_text.ilike.%DC66%,metadata->entities->skus.cs.["DC66"]')
      .limit(5);
    
    if (dc66Embeddings && dc66Embeddings.length > 0) {
      console.log(`✅ DC66 products now have ${dc66Count || dc66Embeddings.length}+ embeddings!`);
      
      // Check if SKUs were extracted
      const hasSkus = dc66Embeddings.some(e => 
        e.metadata?.entities?.skus?.some((sku: string) => sku.includes('DC66'))
      );
      
      if (hasSkus) {
        console.log('✅ DC66 SKUs properly extracted in metadata!');
        const sampleSkus = dc66Embeddings
          .filter(e => e.metadata?.entities?.skus?.length > 0)
          .flatMap(e => e.metadata.entities.skus)
          .filter((sku: string) => sku.includes('DC66'))
          .slice(0, 5);
        console.log('Sample SKUs:', [...new Set(sampleSkus)]);
      } else {
        console.log('⚠️ DC66 SKUs not in metadata - check metadata extractor');
      }
    } else {
      console.log('⚠️ DC66 embeddings not found - may need investigation');
    }
    
    // Final coverage check
    const { count: finalTotalPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalEmbeddingCount } = await supabase
      .from('page_embeddings')
      .select('page_id', { count: 'exact', head: true });
    
    if (finalTotalPages && finalEmbeddingCount) {
      // Note: Multiple embeddings per page means coverage can be > 100%
      const avgEmbeddingsPerPage = (finalEmbeddingCount / finalTotalPages).toFixed(2);
      console.log(`\n📊 Final metrics:`);
      console.log(`   Total pages: ${finalTotalPages}`);
      console.log(`   Total embeddings: ${finalEmbeddingCount}`);
      console.log(`   Avg embeddings per page: ${avgEmbeddingsPerPage}`);
      
      console.log('\n🎉 Embedding recovery complete!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the recovery
main().catch(console.error);