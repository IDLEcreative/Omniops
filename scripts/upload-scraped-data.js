#!/usr/bin/env node

/**
 * Upload Scraped Data to Supabase
 * Processes the locally stored scraped data and uploads it to Supabase with embeddings
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const STORAGE_DIR = '/Users/jamesguy/Omniops/storage/key_value_stores/default';
const BATCH_SIZE = 50; // Process 50 pages at a time
const EMBEDDING_BATCH_SIZE = 50; // Generate embeddings in batches

// Stats tracking
const stats = {
  totalFiles: 0,
  processedPages: 0,
  skippedPages: 0,
  errors: 0,
  embeddings: 0
};

// Chunk text for embeddings
function splitIntoChunks(text, maxLength = 1500) {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embeddings in batches
async function generateEmbeddings(chunks) {
  const embeddings = [];
  
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
      
      embeddings.push(...response.data.map(d => d.embedding));
      console.log(`Generated embeddings for ${batch.length} chunks`);
    } catch (error) {
      console.error('Error generating embeddings:', error.message);
      // Return null embeddings for failed batch
      embeddings.push(...batch.map(() => null));
    }
  }
  
  return embeddings;
}

// Process a single scraped page
async function processPage(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const page = JSON.parse(content);
    
    if (!page.url) {
      console.log(`Skipping file without URL: ${filePath}`);
      stats.skippedPages++;
      return;
    }
    
    // Check if page already exists
    const { data: existingPage } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('url', page.url)
      .single();
    
    if (existingPage) {
      console.log(`Page already exists: ${page.url}`);
      stats.skippedPages++;
      return;
    }
    
    // Prepare page data
    const pageData = {
      url: page.url,
      title: page.title || '',
      content: page.content || page.text || '',
      meta_description: page.description || '',
      last_scraped_at: new Date().toISOString(),
      metadata: {
        ...page.metadata,
        source: 'bulk_upload',
        uploaded_at: new Date().toISOString()
      }
    };
    
    // Insert page
    const { data: savedPage, error: pageError } = await supabase
      .from('scraped_pages')
      .insert(pageData)
      .select()
      .single();
    
    if (pageError) {
      console.error(`Error saving page ${page.url}:`, pageError);
      stats.errors++;
      return;
    }
    
    // Generate and save embeddings if content exists
    if (pageData.content && pageData.content.length > 100) {
      const chunks = splitIntoChunks(pageData.content);
      
      if (chunks.length > 0) {
        const embeddings = await generateEmbeddings(chunks);
        
        const embeddingRecords = chunks.map((chunk, index) => ({
          page_id: savedPage.id,
          chunk_text: chunk.substring(0, 5000),
          chunk_index: index,
          embedding: embeddings[index],
          metadata: {
            chunk_length: chunk.length,
            total_chunks: chunks.length
          }
        })).filter(record => record.embedding !== null);
        
        if (embeddingRecords.length > 0) {
          const { error: embError } = await supabase
            .from('page_embeddings')
            .insert(embeddingRecords);
          
          if (embError) {
            console.error(`Error saving embeddings for ${page.url}:`, embError);
          } else {
            stats.embeddings += embeddingRecords.length;
          }
        }
      }
    }
    
    stats.processedPages++;
    console.log(`✓ Processed: ${page.url} (${stats.processedPages}/${stats.totalFiles})`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    stats.errors++;
  }
}

// Process files in batches
async function processBatch(files) {
  const promises = files.map(file => processPage(path.join(STORAGE_DIR, file)));
  await Promise.all(promises);
}

// Main function
async function main() {
  console.log('=== Uploading Scraped Data to Supabase ===\n');
  
  try {
    // Read all JSON files from storage
    const files = await fs.readdir(STORAGE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    stats.totalFiles = jsonFiles.length;
    console.log(`Found ${stats.totalFiles} files to process\n`);
    
    // Process in batches
    for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
      const batch = jsonFiles.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(jsonFiles.length/BATCH_SIZE)}`);
      await processBatch(batch);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < jsonFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Print final stats
    console.log('\n=== Upload Complete ===');
    console.log(`Total Files: ${stats.totalFiles}`);
    console.log(`Processed: ${stats.processedPages}`);
    console.log(`Skipped: ${stats.skippedPages}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Embeddings Created: ${stats.embeddings}`);
    
    // Calculate costs
    const estimatedCost = (stats.embeddings * 0.00002).toFixed(4);
    console.log(`\nEstimated OpenAI Cost: $${estimatedCost}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processPage, generateEmbeddings };