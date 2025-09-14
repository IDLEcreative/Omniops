#!/usr/bin/env node

/**
 * Turbo Force Rescrape with Sitemap
 * This fetches the sitemap first (like turbo scraper) then passes all URLs to the worker
 */

const { spawn } = require('child_process');
const { SitemapParser } = require('./lib/sitemap-parser');

async function fetchAllSitemapUrls() {
  console.log('📋 Fetching sitemap URLs...');
  const parser = new SitemapParser();
  
  try {
    // Fetch from the main sitemap (which is actually a sitemap index)
    const sitemapUrls = await parser.parseSitemapFromUrl('https://www.thompsonseparts.co.uk/sitemap.xml');
    console.log(`✅ Found ${sitemapUrls.length} URLs from sitemap`);
    return sitemapUrls.map(entry => entry.loc);
  } catch (error) {
    console.error('❌ Failed to fetch sitemap:', error.message);
    return [];
  }
}

async function runForceRescrapeWithSitemap() {
  console.log('🚀 Turbo Force Rescrape with Full Sitemap Support');
  console.log('=================================================\n');
  
  // Set force rescrape environment
  process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';
  
  // Fetch all URLs from sitemap
  const sitemapUrls = await fetchAllSitemapUrls();
  
  if (sitemapUrls.length === 0) {
    console.error('❌ No URLs found in sitemap. Aborting.');
    process.exit(1);
  }
  
  console.log(`\n📊 Sitemap Statistics:`);
  console.log(`   Total URLs: ${sitemapUrls.length}`);
  
  // Filter for product and category pages
  const productUrls = sitemapUrls.filter(url => 
    url.includes('/product/') || url.includes('/product-category/')
  );
  console.log(`   Product/Category URLs: ${productUrls.length}`);
  
  // Generate job ID
  const jobId = `turbo_force_rescrape_${Date.now()}`;
  
  console.log(`\n📋 Starting Force Rescrape:`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   URLs to process: ${sitemapUrls.length}`);
  console.log(`   Force rescrape: ENABLED`);
  console.log(`   Turbo mode: ENABLED\n`);
  
  // Prepare worker arguments - exactly like scraper-api.ts does
  const workerArgs = [
    'lib/scraper-worker.js',
    jobId,
    'https://www.thompsonseparts.co.uk',
    '10000', // maxPages - set high to process all
    'true',  // turboMode
    'production', // configPreset
    'true',  // isOwnSite
    JSON.stringify(sitemapUrls), // Pass ALL sitemap URLs as JSON
    'true'   // forceRescrape - CRITICAL PARAMETER
  ];
  
  console.log('🔄 Spawning worker with sitemap URLs...\n');
  
  const child = spawn('node', workerArgs, {
    cwd: process.cwd(),
    env: { 
      ...process.env,
      SCRAPER_FORCE_RESCRAPE_ALL: 'true' // Ensure env var is set
    },
    stdio: 'inherit' // Show output directly
  });
  
  console.log(`✅ Worker spawned with PID: ${child.pid}`);
  console.log(`\n📊 The scraper will now:`);
  console.log(`   1. Process all ${sitemapUrls.length} URLs from sitemap`);
  console.log(`   2. Force rescrape every page (bypass cache)`);
  console.log(`   3. Extract all metadata (brands, categories, SKUs)`);
  console.log(`   4. Delete old embeddings and create new ones`);
  console.log(`   5. Use turbo mode for faster processing\n`);
  
  child.on('error', (error) => {
    console.error('❌ Worker error:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('\n✅ Force rescrape completed successfully!');
    } else {
      console.log(`\n⚠️ Worker exited with code ${code}`);
    }
  });
}

// Run it
runForceRescrapeWithSitemap().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});