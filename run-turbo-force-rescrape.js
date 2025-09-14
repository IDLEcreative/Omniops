#!/usr/bin/env node

/**
 * Run the turbo scraper with force rescrape
 * This properly fetches the sitemap and processes all pages
 */

require('dotenv').config({ path: '.env.local' });

const { crawlWebsite } = require('./lib/scraper-api');

async function runForceRescrape() {
  console.log('🚀 Starting Turbo Force Rescrape with Sitemap Support');
  console.log('=====================================================\n');
  
  // Set environment variable for force rescrape
  process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';
  
  try {
    console.log('📋 Configuration:');
    console.log('  URL: https://www.thompsonseparts.co.uk');
    console.log('  Max pages: 10000 (unlimited)');
    console.log('  Turbo mode: ENABLED');
    console.log('  Force rescrape: ENABLED');
    console.log('  Sitemap: Will be auto-fetched\n');
    
    // Call crawlWebsite which will fetch the sitemap
    const jobId = await crawlWebsite('https://www.thompsonseparts.co.uk', {
      maxPages: 10000,  // Set high to get all pages
      turboMode: true,
      forceRescrape: true,  // This is the key parameter
      ownSite: true,
      configPreset: 'production'
    });
    
    console.log(`\n✅ Crawl started with job ID: ${jobId}`);
    console.log('\n📊 Monitor progress:');
    console.log(`   redis-cli hgetall "crawl:${jobId}"`);
    console.log('\n   Or use the monitoring script:');
    console.log(`   watch 'redis-cli hgetall "crawl:${jobId}"'`);
    console.log('\n🎯 The scraper will:');
    console.log('   1. Fetch the sitemap automatically');
    console.log('   2. Process ALL pages found');
    console.log('   3. Force rescrape even recently scraped pages');
    console.log('   4. Extract all metadata (brands, categories, products)');
    console.log('   5. Regenerate embeddings with enriched content\n');
    
  } catch (error) {
    console.error('❌ Failed to start crawl:', error);
    process.exit(1);
  }
}

// Run the scraper
runForceRescrape().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});