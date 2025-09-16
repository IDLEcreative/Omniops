#!/usr/bin/env tsx
/**
 * Simplified Recovery Script: Generate Missing Embeddings
 * Focuses on DC66-10P products first
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
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
  console.log('🔧 DC66-10P Embedding Recovery');
  console.log('==============================\n');

  try {
    // Step 1: Find DC66-10P pages specifically
    console.log('🔍 Finding DC66-10P pages...');
    
    const { data: dc66Pages, error } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content')
      .or('content.ilike.%DC66-10P%,url.ilike.%DC66-10P%,title.ilike.%DC66-10P%')
      .limit(20);
    
    if (error) {
      console.error('Error finding DC66 pages:', error);
      return;
    }
    
    console.log(`Found ${dc66Pages?.length || 0} DC66-10P pages`);
    
    if (!dc66Pages || dc66Pages.length === 0) {
      console.log('No DC66-10P pages found');
      return;
    }
    
    // Step 2: Check which ones already have embeddings
    const pageIds = dc66Pages.map(p => p.id);
    
    const { data: existingEmbeddings } = await supabase
      .from('page_embeddings')
      .select('page_id')
      .in('page_id', pageIds);
    
    const pagesWithEmbeddings = new Set(existingEmbeddings?.map(e => e.page_id) || []);
    const pagesToProcess = dc66Pages.filter(p => !pagesWithEmbeddings.has(p.id));
    
    console.log(`${pagesToProcess.length} pages need embeddings\n`);
    
    if (pagesToProcess.length === 0) {
      console.log('✅ All DC66-10P pages already have embeddings!');
      
      // Verify embeddings exist
      const { data: embeddings } = await supabase
        .from('page_embeddings')
        .select('chunk_text, metadata')
        .ilike('chunk_text', '%DC66-10P%')
        .limit(5);
      
      if (embeddings && embeddings.length > 0) {
        console.log(`\n✅ Verified: ${embeddings.length} DC66-10P embeddings exist`);
        console.log('Sample embedding content:', embeddings[0].chunk_text.substring(0, 100));
      }
      return;
    }
    
    // Step 3: Process pages
    console.log('🚀 Generating embeddings...\n');
    
    for (const page of pagesToProcess) {
      console.log(`Processing: ${page.url}`);
      
      if (!page.content) {
        console.log('  ⚠️ No content, skipping');
        continue;
      }
      
      // Generate chunks
      const chunks = splitIntoChunks(page.content);
      console.log(`  📄 Created ${chunks.length} chunks`);
      
      // Generate embeddings
      const embeddings = await generateEmbeddings(chunks);
      
      // Prepare records with enhanced metadata
      const embeddingRecords = chunks.map((chunk, index) => {
        // Extract SKUs from chunk
        const skuMatches = chunk.match(/\b[A-Z0-9]{2,}[\-\/]?[A-Z0-9]{2,}[\w\-\/]*(?:[\-\/][A-Z0-9]+)*\b/gi) || [];
        const skus = [...new Set(skuMatches.map(s => s.toUpperCase()))];
        
        return {
          page_id: page.id,
          chunk_text: chunk,
          embedding: embeddings[index],
          metadata: {
            url: page.url,
            title: page.title,
            chunk_index: index,
            total_chunks: chunks.length,
            entities: {
              skus: skus
            },
            recovered_at: new Date().toISOString()
          }
        };
      });
      
      // Insert embeddings
      const { error: insertError } = await supabase
        .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
      
      if (insertError) {
        // Fallback to direct insert
        console.log('  ⚠️ Bulk insert failed, using direct insert');
        const { error: fallbackError } = await supabase
          .from('page_embeddings')
          .insert(embeddingRecords);
        
        if (fallbackError) {
          console.error('  ❌ Failed:', fallbackError.message);
        } else {
          console.log('  ✅ Success!');
        }
      } else {
        console.log('  ✅ Success!');
        
        // Check if SKUs were extracted
        const hasSkus = embeddingRecords.some(r => 
          r.metadata.entities.skus.some(sku => sku.includes('DC66'))
        );
        
        if (hasSkus) {
          console.log('  📦 DC66 SKUs extracted successfully!');
        }
      }
    }
    
    // Step 4: Final verification
    console.log('\n📊 Final Verification:');
    
    const { data: finalCheck } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .ilike('chunk_text', '%DC66-10P%')
      .limit(10);
    
    if (finalCheck && finalCheck.length > 0) {
      console.log(`✅ DC66-10P now has ${finalCheck.length}+ searchable embeddings!`);
      
      // Check metadata
      const withSkus = finalCheck.filter(e => 
        e.metadata?.entities?.skus?.some((s: string) => s.includes('DC66'))
      );
      
      if (withSkus.length > 0) {
        console.log(`✅ ${withSkus.length} embeddings have DC66 SKUs in metadata`);
        console.log('Sample SKUs:', withSkus[0].metadata.entities.skus);
      } else {
        console.log('⚠️ SKUs not properly extracted - may need regex improvement');
      }
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main().catch(console.error);