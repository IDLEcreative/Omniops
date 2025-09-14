#!/usr/bin/env node

/**
 * Fresh Turbo Scrape with Sitemap
 * This performs a clean, fast scrape after database cleanup
 * No force rescrape overhead - just pure speed!
 */

const { spawn } = require('child_process');
const { SitemapParser } = require('./lib/sitemap-parser');

async function fetchAllSitemapUrls() {
  console.log('📋 Fetching sitemap URLs...');
  const parser = new SitemapParser();
  
  try {
    const sitemapUrls = await parser.parseSitemapFromUrl('https://www.thompsonseparts.co.uk/sitemap.xml');
    console.log(`✅ Found ${sitemapUrls.length} URLs from sitemap`);
    return sitemapUrls.map(entry => entry.loc);
  } catch (error) {
    console.error('❌ Failed to fetch sitemap:', error.message);
    return [];
  }
}

async function runFreshTurboScrape() {
  console.log('🚀 Fresh Turbo Scrape - Clean Slate Edition');
  console.log('============================================\n');
  console.log('✨ Benefits of clean slate scraping:');
  console.log('   • No deletion overhead (saves ~500ms per page)');
  console.log('   • No comparison checks (saves ~200ms per page)');
  console.log('   • Pure insert operations (fastest DB performance)');
  console.log('   • Estimated time: 6-8 hours vs 15-18 hours for force rescrape\n');
  
  // Fetch all URLs from sitemap
  const sitemapUrls = await fetchAllSitemapUrls();
  
  if (sitemapUrls.length === 0) {
    console.error('❌ No URLs found in sitemap. Aborting.');
    process.exit(1);
  }
  
  console.log(`\n📊 Sitemap Statistics:`);
  console.log(`   Total URLs: ${sitemapUrls.length}`);
  
  const productUrls = sitemapUrls.filter(url => 
    url.includes('/product/') || url.includes('/product-category/')
  );
  console.log(`   Product/Category URLs: ${productUrls.length}`);
  
  // Generate job ID
  const jobId = `fresh_turbo_scrape_${Date.now()}`;
  
  console.log(`\n📋 Starting Fresh Scrape:`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   URLs to process: ${sitemapUrls.length}`);
  console.log(`   Force rescrape: DISABLED (clean slate)`);
  console.log(`   Turbo mode: ENABLED`);
  console.log(`   Expected time: ~6-8 hours\n`);
  
  // Prepare worker arguments - NO force rescrape parameter!
  const workerArgs = [
    'lib/scraper-worker.js',
    jobId,
    'https://www.thompsonseparts.co.uk',
    '10000', // maxPages
    'true',  // turboMode
    'production', // configPreset
    'true',  // isOwnSite
    JSON.stringify(sitemapUrls), // Pass ALL sitemap URLs
    // NO force rescrape parameter - this is the key difference!
  ];
  
  console.log('🔄 Spawning worker with sitemap URLs...\n');
  
  const child = spawn('node', workerArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
  });
  
  console.log(`✅ Worker spawned with PID: ${child.pid}`);
  console.log(`\n📊 The scraper will now:`);
  console.log(`   1. Process all ${sitemapUrls.length} URLs from sitemap`);
  console.log(`   2. Skip pages that are already cached (none in this case)`);
  console.log(`   3. Extract all metadata (brands, categories, SKUs)`);
  console.log(`   4. Generate embeddings efficiently`);
  console.log(`   5. Use turbo mode with optimized concurrency\n`);
  
  child.on('error', (error) => {
    console.error('❌ Worker error:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ Fresh scrape completed successfully!');
      console.log('🎉 All data has been scraped and indexed with maximum efficiency!');
    } else {
      console.log(`\n⚠️ Worker exited with code ${code}`);
    }
  });
}

// Run it
runFreshTurboScrape().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});