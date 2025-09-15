#!/usr/bin/env node

/**
 * Test script to verify the OpenAI token limit and Redis connection fixes
 */

import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScraping() {
  console.log('🧪 TESTING ERROR FIXES');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Start a small batch scrape
    console.log('\n📝 Test 1: Starting small batch scrape (5 pages)...');
    
    import { spawn  } from 'node:child_process';
    const scraperProcess = spawn('npm', ['run', 'scraper:crawl', '--', 
      '--limit', '5', 
      '--url', 'https://www.thompsonseparts.co.uk'
    ]);
    
    let hasTokenError = false;
    let hasRedisError = false;
    let successfulPages = 0;
    
    scraperProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Check for token limit handling
      if (output.includes('[Token Management]')) {
        console.log('\n✅ Token management active!');
      }
      
      // Check for Redis keepalive
      if (output.includes('Redis keepalive ping successful')) {
        console.log('\n✅ Redis keepalive working!');
      }
      
      // Check for errors
      if (output.includes('maximum context length')) {
        hasTokenError = true;
        console.error('\n❌ Token limit error still occurring!');
      }
      
      if (output.includes('Connection is closed')) {
        hasRedisError = true;
        console.error('\n❌ Redis connection error still occurring!');
      }
      
      // Count successful pages
      if (output.includes('Page scraped successfully')) {
        successfulPages++;
      }
    });
    
    scraperProcess.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });
    
    await new Promise((resolve) => {
      scraperProcess.on('close', (code) => {
        console.log(`\n📊 Scraper process exited with code ${code}`);
        resolve();
      });
    });
    
    // Test 2: Check if embeddings were created for large content
    console.log('\n📝 Test 2: Checking embeddings for large content...');
    
    const { data: recentEmbeddings, error } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching embeddings:', error);
    } else {
      console.log(`Found ${recentEmbeddings?.length || 0} recent embeddings`);
      
      // Check for proper chunking
      const largeChunks = [];
      for (const emb of recentEmbeddings || []) {
        if (emb.chunk_text && emb.chunk_text.length > 20000) {
          largeChunks.push(emb.chunk_text.length);
        }
      }
      
      if (largeChunks.length > 0) {
        console.log(`⚠️  Found ${largeChunks.length} large chunks (>20k chars)`);
        console.log('These should have been split by token management');
      } else {
        console.log('✅ All chunks are properly sized');
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY:');
    console.log('=' .repeat(60));
    
    console.log(`✅ Successful pages scraped: ${successfulPages}`);
    console.log(`${hasTokenError ? '❌' : '✅'} Token limit errors: ${hasTokenError ? 'Still occurring' : 'Fixed'}`);
    console.log(`${hasRedisError ? '❌' : '✅'} Redis connection errors: ${hasRedisError ? 'Still occurring' : 'Fixed'}`);
    
    if (!hasTokenError && !hasRedisError && successfulPages > 0) {
      console.log('\n🎉 ALL FIXES WORKING! Ready for full rescrape.');
    } else {
      console.log('\n⚠️  Some issues remain. Review the logs above.');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testScraping()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });