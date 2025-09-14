#!/usr/bin/env node

/**
 * Test metadata enrichment with Thompson's eParts site
 * Scrapes a small batch of product pages and verifies metadata extraction
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const OpenAI = require('openai');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Thompson's eParts test URLs - small batch of product pages
const TEST_URLS = [
  'https://thompsons-eparts.com/products/DC66-10P',
  'https://thompsons-eparts.com/products/W10219156',
  'https://thompsons-eparts.com/products/DC47-00019A'
];

async function clearPreviousData() {
  console.log('🧹 Clearing previous test data...');
  
  // Get page IDs for our test URLs
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('id, url')
    .in('url', TEST_URLS);
  
  if (pages && pages.length > 0) {
    const pageIds = pages.map(p => p.id);
    
    // Delete embeddings
    await supabase
      .from('page_embeddings')
      .delete()
      .in('page_id', pageIds);
    
    // Delete pages
    await supabase
      .from('scraped_pages')
      .delete()
      .in('url', TEST_URLS);
    
    console.log(`  Cleared ${pages.length} previous test pages`);
  }
}

async function runScraper() {
  console.log('\\n🚀 Starting scraper with force rescrape enabled...');
  console.log('  URLs to scrape:', TEST_URLS.length);
  
  return new Promise((resolve, reject) => {
    // Prepare the scraper command with force rescrape
    const env = { ...process.env, FORCE_RESCRAPE: 'true' };
    
    // Create a simple Node script to run the scraper
    const scraperScript = `
      const { startScraping } = require('./lib/scraper-service');
      
      async function scrapeTest() {
        const urls = ${JSON.stringify(TEST_URLS)};
        
        for (const url of urls) {
          console.log('Scraping:', url);
          try {
            // Simulate scraping by calling the worker directly
            const { spawn } = require('child_process');
            const worker = spawn('node', ['lib/scraper-worker.js'], {
              env: {
                ...process.env,
                FORCE_RESCRAPE: 'true',
                START_URL: url,
                MAX_PAGES: '1',
                JOB_ID: 'test-' + Date.now()
              }
            });
            
            worker.stdout.on('data', (data) => {
              console.log(data.toString());
            });
            
            worker.stderr.on('data', (data) => {
              console.error(data.toString());
            });
            
            await new Promise((resolve) => {
              worker.on('close', resolve);
            });
            
            // Wait a bit between pages
            await new Promise(r => setTimeout(r, 2000));
          } catch (error) {
            console.error('Error scraping', url, error);
          }
        }
      }
      
      scrapeTest().then(() => process.exit(0)).catch(console.error);
    `;
    
    // Write and run the scraper script
    const fs = require('fs');
    fs.writeFileSync('/tmp/test-scraper.js', scraperScript);
    
    const scraper = spawn('node', ['/tmp/test-scraper.js'], { env });
    
    let output = '';
    scraper.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      console.log(str.trim());
    });
    
    scraper.stderr.on('data', (data) => {
      console.error('Scraper error:', data.toString());
    });
    
    scraper.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Scraper exited with code ${code}`));
      }
    });
  });
}

async function verifyMetadata() {
  console.log('\\n🔍 Verifying metadata extraction...');
  console.log('─'.repeat(50));
  
  // Check scraped pages for metadata
  const { data: pages, error } = await supabase
    .from('scraped_pages')
    .select('url, title, metadata, scraped_at')
    .in('url', TEST_URLS)
    .order('scraped_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pages:', error);
    return false;
  }
  
  let successCount = 0;
  const results = [];
  
  for (const page of pages || []) {
    console.log(`\\n📄 ${page.url}`);
    console.log(`  Title: ${page.title}`);
    
    const metadata = page.metadata || {};
    const hasProductData = !!(
      metadata.productSku || 
      metadata.productPrice || 
      metadata.sku || 
      metadata.price
    );
    
    if (hasProductData) {
      console.log('  ✅ Has product metadata:');
      if (metadata.productSku || metadata.sku) {
        console.log(`    SKU: ${metadata.productSku || metadata.sku}`);
      }
      if (metadata.productPrice || metadata.price) {
        console.log(`    Price: ${metadata.productPrice || metadata.price}`);
      }
      if (metadata.productInStock !== undefined || metadata.inStock !== undefined) {
        console.log(`    In Stock: ${metadata.productInStock ?? metadata.inStock}`);
      }
      if (metadata.productBrand || metadata.brand) {
        console.log(`    Brand: ${metadata.productBrand || metadata.brand}`);
      }
      successCount++;
    } else {
      console.log('  ❌ No product metadata found');
      console.log('  Raw metadata:', JSON.stringify(metadata, null, 2).substring(0, 200));
    }
    
    results.push({ url: page.url, hasMetadata: hasProductData, metadata });
  }
  
  return { successCount, total: TEST_URLS.length, results };
}

async function verifyEmbeddings() {
  console.log('\\n🔢 Verifying embeddings with enriched content...');
  console.log('─'.repeat(50));
  
  // Get page IDs
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('id, url')
    .in('url', TEST_URLS);
  
  if (!pages || pages.length === 0) {
    console.log('  ❌ No pages found');
    return false;
  }
  
  const pageIds = pages.map(p => p.id);
  
  // Check embeddings
  const { data: embeddings, error } = await supabase
    .from('page_embeddings')
    .select('page_id, chunk_index, content')
    .in('page_id', pageIds)
    .order('page_id')
    .order('chunk_index');
  
  if (error) {
    console.error('Error fetching embeddings:', error);
    return false;
  }
  
  console.log(`  Found ${embeddings?.length || 0} embeddings for ${pages.length} pages`);
  
  // Group embeddings by page
  const embeddingsByPage = {};
  for (const emb of embeddings || []) {
    if (!embeddingsByPage[emb.page_id]) {
      embeddingsByPage[emb.page_id] = [];
    }
    embeddingsByPage[emb.page_id].push(emb);
  }
  
  let enrichedCount = 0;
  
  for (const page of pages) {
    const pageEmbeddings = embeddingsByPage[page.id] || [];
    console.log(`\\n  ${page.url}:`);
    console.log(`    Chunks: ${pageEmbeddings.length}`);
    
    if (pageEmbeddings.length > 0) {
      // Check if content appears enriched (contains metadata markers)
      const firstChunk = pageEmbeddings[0].content;
      const isEnriched = 
        firstChunk.includes('SKU:') || 
        firstChunk.includes('Price:') || 
        firstChunk.includes('Product:') ||
        firstChunk.includes('Title:');
      
      if (isEnriched) {
        console.log('    ✅ Content appears enriched');
        console.log(`    Sample: "${firstChunk.substring(0, 100)}..."`);
        enrichedCount++;
      } else {
        console.log('    ⚠️  Content may not be enriched');
        console.log(`    Sample: "${firstChunk.substring(0, 100)}..."`);
      }
    }
  }
  
  return { enrichedCount, total: pages.length };
}

async function testSearchQueries() {
  console.log('\\n🔎 Testing search queries on enriched data...');
  console.log('─'.repeat(50));
  
  const testQueries = [
    { query: 'DC66-10P', type: 'SKU search' },
    { query: 'heating element Samsung', type: 'Natural language' },
    { query: 'dryer parts under $50', type: 'Price-based' },
    { query: 'W10219156', type: 'SKU search' },
    { query: 'in stock appliance parts', type: 'Availability search' }
  ];
  
  for (const test of testQueries) {
    console.log(`\\n  Testing: "${test.query}" (${test.type})`);
    
    try {
      // Generate embedding for query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: test.query,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search using vector similarity
      const { data: results, error } = await supabase.rpc(
        'match_page_embeddings',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: 3
        }
      );
      
      if (error) {
        console.log(`    ❌ Search error: ${error.message}`);
      } else if (results && results.length > 0) {
        console.log(`    ✅ Found ${results.length} results`);
        console.log(`    Top result: ${results[0].url || results[0].page_url || 'Unknown'}`);
        console.log(`    Similarity: ${results[0].similarity?.toFixed(3) || 'N/A'}`);
      } else {
        console.log('    ⚠️  No results found');
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }
}

async function runTest() {
  console.log('\\n' + '='.repeat(80));
  console.log('   THOMPSON\'S EPARTS METADATA ENRICHMENT TEST');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Clear previous data
    await clearPreviousData();
    
    // Step 2: Run scraper with force rescrape
    console.log('\\n⚠️  Note: The scraper needs to be run separately.');
    console.log('Please run the following command in another terminal:');
    console.log('\\n  FORCE_RESCRAPE=true node lib/scraper-worker.js');
    console.log('\\nThen press Enter to continue...');
    
    // Wait for user to run scraper
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Step 3: Verify metadata extraction
    const metadataResults = await verifyMetadata();
    
    // Step 4: Verify embeddings
    const embeddingResults = await verifyEmbeddings();
    
    // Step 5: Test search queries
    await testSearchQueries();
    
    // Summary
    console.log('\\n' + '='.repeat(80));
    console.log('   TEST SUMMARY');
    console.log('='.repeat(80));
    
    if (metadataResults) {
      const metadataRate = Math.round((metadataResults.successCount / metadataResults.total) * 100);
      console.log(`\\n📊 Metadata Extraction: ${metadataResults.successCount}/${metadataResults.total} pages (${metadataRate}%)`);
    }
    
    if (embeddingResults) {
      const embeddingRate = Math.round((embeddingResults.enrichedCount / embeddingResults.total) * 100);
      console.log(`🔢 Enriched Embeddings: ${embeddingResults.enrichedCount}/${embeddingResults.total} pages (${embeddingRate}%)`);
    }
    
    console.log('\\n📝 Recommendations:');
    if (!metadataResults || metadataResults.successCount === 0) {
      console.log('  • Metadata extraction failed - check if Thompson\'s site structure has changed');
      console.log('  • Verify the scraper is using the updated scraper-worker.js');
    } else if (metadataResults.successCount < metadataResults.total) {
      console.log('  • Some pages missing metadata - may need to update selectors');
    } else {
      console.log('  ✅ Metadata extraction working perfectly!');
    }
    
    if (!embeddingResults || embeddingResults.enrichedCount === 0) {
      console.log('  • Embeddings not enriched - check ContentEnricher integration');
    } else if (embeddingResults.enrichedCount < embeddingResults.total) {
      console.log('  • Some embeddings not enriched - verify enrichment logic');
    } else {
      console.log('  ✅ Content enrichment working perfectly!');
    }
    
  } catch (error) {
    console.error('\\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
console.log('Starting Thompson\'s eParts metadata test...');
console.log('Make sure Redis is running: docker-compose up -d redis');
runTest().catch(console.error);