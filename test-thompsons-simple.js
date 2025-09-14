#!/usr/bin/env node

/**
 * Simple test for Thompson's eParts metadata enrichment
 * Uses the API to trigger scraping and then verifies results
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const DOMAIN = 'thompsons-eparts.com';
const TEST_URLS = [
  'https://thompsons-eparts.com/products/DC66-10P'
];

async function triggerScraping() {
  console.log('\\n🚀 Triggering scraping via API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_URLS[0],
        crawl: true,
        max_pages: 3,
        turbo: true  // This enables force rescrape
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Scraping job started:', result.jobId);
      return result.jobId;
    } else {
      console.log('❌ Failed to start scraping:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error triggering scrape:', error.message);
    return null;
  }
}

async function waitForScraping(jobId, maxWaitTime = 60000) {
  console.log('\\n⏳ Waiting for scraping to complete...');
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    // Check job status
    const { data: job } = await supabase
      .from('scrape_jobs')
      .select('status, pages_scraped, error')
      .eq('id', jobId)
      .single();
    
    if (job) {
      if (job.status === 'completed') {
        console.log(`✅ Scraping completed! Pages scraped: ${job.pages_scraped}`);
        return true;
      } else if (job.status === 'failed') {
        console.log(`❌ Scraping failed: ${job.error}`);
        return false;
      } else {
        console.log(`  Status: ${job.status}, Pages: ${job.pages_scraped || 0}`);
      }
    }
    
    // Wait 3 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('⚠️  Timeout waiting for scraping to complete');
  return false;
}

async function verifyResults() {
  console.log('\\n' + '='.repeat(80));
  console.log('   VERIFICATION RESULTS');
  console.log('='.repeat(80));
  
  // Check scraped pages
  const { data: pages, error } = await supabase
    .from('scraped_pages')
    .select('url, title, content, metadata, scraped_at')
    .eq('domain', DOMAIN)
    .order('scraped_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error fetching pages:', error);
    return;
  }
  
  console.log(`\\n📄 Found ${pages?.length || 0} scraped pages from ${DOMAIN}`);
  
  let metadataCount = 0;
  let enrichedCount = 0;
  
  for (const page of pages || []) {
    console.log(`\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 URL: ${page.url}`);
    console.log(`📝 Title: ${page.title}`);
    
    // Check metadata
    if (page.metadata && Object.keys(page.metadata).length > 0) {
      metadataCount++;
      
      // Check for product metadata
      const hasProductData = !!(
        page.metadata.productSku || 
        page.metadata.productPrice || 
        page.metadata.productInStock !== undefined ||
        page.metadata.sku ||
        page.metadata.price
      );
      
      if (hasProductData) {
        console.log('\\n✅ Product Metadata Found:');
        console.log('  SKU:', page.metadata.productSku || page.metadata.sku || 'N/A');
        console.log('  Price:', page.metadata.productPrice || page.metadata.price || 'N/A');
        console.log('  In Stock:', page.metadata.productInStock ?? page.metadata.inStock ?? 'N/A');
        console.log('  Brand:', page.metadata.productBrand || page.metadata.brand || 'N/A');
        console.log('  Category:', page.metadata.productCategory || page.metadata.category || 'N/A');
      } else {
        console.log('\\n⚠️  Has metadata but no product data');
        console.log('  Keys found:', Object.keys(page.metadata).slice(0, 5).join(', '));
      }
    } else {
      console.log('\\n❌ No metadata found');
    }
    
    // Check if content appears enriched
    if (page.content) {
      const contentSample = page.content.substring(0, 200);
      const isEnriched = 
        contentSample.includes('Title:') ||
        contentSample.includes('SKU:') ||
        contentSample.includes('Price:') ||
        contentSample.includes('Product:');
      
      if (isEnriched) {
        enrichedCount++;
        console.log('\\n✨ Content appears enriched:');
        console.log(`  "${contentSample}..."`);
      } else {
        console.log('\\n📄 Standard content (not visibly enriched in DB)');
      }
    }
  }
  
  // Check embeddings
  console.log('\\n' + '─'.repeat(80));
  console.log('🔢 Checking Embeddings...');
  
  if (pages && pages.length > 0) {
    const pageIds = pages.map(p => p.id);
    
    const { data: embeddings, count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .in('page_id', pageIds);
    
    console.log(`  Total embeddings for these pages: ${count || 0}`);
    
    // Sample one embedding to check content
    const { data: sampleEmbedding } = await supabase
      .from('page_embeddings')
      .select('content')
      .in('page_id', pageIds)
      .limit(1)
      .single();
    
    if (sampleEmbedding?.content) {
      const isEnriched = 
        sampleEmbedding.content.includes('Title:') ||
        sampleEmbedding.content.includes('SKU:') ||
        sampleEmbedding.content.includes('Product:');
      
      if (isEnriched) {
        console.log('  ✅ Embeddings contain enriched content');
        console.log(`  Sample: "${sampleEmbedding.content.substring(0, 100)}..."`);
      } else {
        console.log('  ⚠️  Embeddings may not be enriched');
      }
    }
  }
  
  // Summary
  console.log('\\n' + '='.repeat(80));
  console.log('   SUMMARY');
  console.log('='.repeat(80));
  
  const totalPages = pages?.length || 0;
  const metadataRate = totalPages > 0 ? Math.round((metadataCount / totalPages) * 100) : 0;
  const enrichmentRate = totalPages > 0 ? Math.round((enrichedCount / totalPages) * 100) : 0;
  
  console.log(`\\n📊 Results:`);
  console.log(`  Pages scraped: ${totalPages}`);
  console.log(`  Pages with metadata: ${metadataCount} (${metadataRate}%)`);
  console.log(`  Pages with enriched content: ${enrichedCount} (${enrichmentRate}%)`);
  
  if (metadataRate >= 80 && enrichmentRate >= 80) {
    console.log('\\n✅ SUCCESS! Metadata extraction and enrichment working well!');
  } else if (metadataRate >= 50 || enrichmentRate >= 50) {
    console.log('\\n⚠️  PARTIAL SUCCESS - Some features working but needs improvement');
  } else {
    console.log('\\n❌ NEEDS ATTENTION - Metadata extraction or enrichment not working properly');
  }
  
  console.log('\\n💡 Tips:');
  if (metadataRate < 80) {
    console.log('  • Check if Thompson\'s site structure has changed');
    console.log('  • Verify extractMetadata function is capturing product data');
    console.log('  • Check browser console for JavaScript errors during scraping');
  }
  if (enrichmentRate < 80) {
    console.log('  • Verify ContentEnricher is being called in scraper-worker.js');
    console.log('  • Check that FORCE_RESCRAPE was enabled');
    console.log('  • Ensure metadata is being passed to ContentEnricher.enrichContent()');
  }
}

async function runTest() {
  console.log('\\n' + '='.repeat(80));
  console.log('   THOMPSON\'S EPARTS METADATA TEST');
  console.log('='.repeat(80));
  
  console.log('\\n📋 Test Configuration:');
  console.log(`  Domain: ${DOMAIN}`);
  console.log(`  Test URL: ${TEST_URLS[0]}`);
  console.log(`  Max pages: 3`);
  console.log(`  Force rescrape: Yes`);
  
  // Check if dev server is running
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      console.log('\\n⚠️  Dev server not responding properly');
      console.log('Please ensure the dev server is running: npm run dev');
      return;
    }
  } catch (error) {
    console.log('\\n❌ Dev server is not running!');
    console.log('Please start it with: npm run dev');
    return;
  }
  
  // Trigger scraping
  const jobId = await triggerScraping();
  
  if (!jobId) {
    console.log('\\n❌ Failed to start scraping. Please check:');
    console.log('  1. Dev server is running (npm run dev)');
    console.log('  2. Redis is running (docker-compose up -d redis)');
    console.log('  3. Environment variables are set correctly');
    return;
  }
  
  // Wait for completion
  const completed = await waitForScraping(jobId);
  
  if (!completed) {
    console.log('\\n⚠️  Scraping did not complete successfully');
    console.log('Check the logs for errors');
  }
  
  // Wait a bit for embeddings to be generated
  console.log('\\n⏳ Waiting 5 seconds for embeddings to be generated...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Verify results
  await verifyResults();
}

// Run the test
console.log('Starting Thompson\'s eParts test...');
console.log('\\n⚠️  Prerequisites:');
console.log('  1. Dev server running (npm run dev)');
console.log('  2. Redis running (docker-compose up -d redis)');
console.log('  3. Supabase configured correctly');

runTest().catch(console.error);