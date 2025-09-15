#!/usr/bin/env node

/**
 * Simple test to verify scraper can connect to Supabase and store data
 */

import { createClient  } from '@supabase/supabase-js';
import { config  } from 'dotenv';
import { join  } from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Scraper to Supabase Connection');
console.log('━'.repeat(60));
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Using key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScraperStorage() {
  try {
    // Test data
    const testPage = {
      url: 'https://www.example.com/test-' + Date.now(),
      title: 'Test Page Title',
      content: 'This is test content for the scraper. It contains some text that would normally be scraped from a website.',
      text_content: 'This is test content for the scraper.',
      excerpt: 'This is test content...',
      content_hash: 'test_hash_' + Date.now(),
      word_count: 10,
      images: JSON.stringify([{ src: 'https://example.com/image.jpg', alt: 'Test image' }]),
      metadata: { test: true, timestamp: new Date().toISOString() }
    };

    console.log('📝 Test 1: Inserting scraped page...');
    const { data: insertedPage, error: insertError } = await supabase
      .from('scraped_pages')
      .insert(testPage)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert:', insertError);
      return;
    }

    console.log('✅ Page inserted successfully!');
    console.log(`   ID: ${insertedPage.id}`);
    console.log(`   URL: ${insertedPage.url}`);
    console.log('');

    // Test embedding storage
    console.log('🔢 Test 2: Inserting page embeddings...');
    const testEmbedding = {
      page_id: insertedPage.id,
      chunk_text: 'This is a test chunk of text',
      // Create a mock embedding vector (1536 dimensions)
      embedding: Array(1536).fill(0).map(() => Math.random()),
      metadata: { chunk_index: 0 }
    };

    const { data: insertedEmbedding, error: embeddingError } = await supabase
      .from('page_embeddings')
      .insert(testEmbedding)
      .select()
      .single();

    if (embeddingError) {
      console.error('❌ Failed to insert embedding:', embeddingError);
      return;
    }

    console.log('✅ Embedding inserted successfully!');
    console.log(`   ID: ${insertedEmbedding.id}`);
    console.log('');

    // Test retrieval
    console.log('🔍 Test 3: Retrieving scraped page...');
    const { data: retrievedPage, error: retrieveError } = await supabase
      .from('scraped_pages')
      .select('*')
      .eq('id', insertedPage.id)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve:', retrieveError);
      return;
    }

    console.log('✅ Page retrieved successfully!');
    console.log(`   Title: ${retrievedPage.title}`);
    console.log(`   Word count: ${retrievedPage.word_count}`);
    console.log('');

    // Clean up test data
    console.log('🧹 Test 4: Cleaning up test data...');
    
    // Delete embedding first (foreign key constraint)
    const { error: deleteEmbError } = await supabase
      .from('page_embeddings')
      .delete()
      .eq('page_id', insertedPage.id);

    if (deleteEmbError) {
      console.error('⚠️  Failed to delete embedding:', deleteEmbError);
    }

    // Delete page
    const { error: deletePageError } = await supabase
      .from('scraped_pages')
      .delete()
      .eq('id', insertedPage.id);

    if (deletePageError) {
      console.error('⚠️  Failed to delete page:', deletePageError);
    } else {
      console.log('✅ Test data cleaned up successfully!');
    }

    console.log('');
    console.log('━'.repeat(60));
    console.log('🎉 All tests passed! The scraper can successfully:');
    console.log('   ✅ Connect to Supabase');
    console.log('   ✅ Store scraped pages');
    console.log('   ✅ Store embeddings');
    console.log('   ✅ Retrieve data');
    console.log('');
    console.log('The scraper is ready for end-to-end testing!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testScraperStorage().then(() => {
  console.log('\n✅ Test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});