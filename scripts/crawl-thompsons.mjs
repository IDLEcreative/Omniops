#!/usr/bin/env node

/**
 * Full Website Crawl for Thompson's Eparts
 * This will scrape ALL pages, not just products, and store the complete content
 * for the AI agent to understand the entire website context
 */

const API_URL = 'http://localhost:3001/api/scrape';
const WEBSITE_URL = 'https://www.thompsonseparts.co.uk/';

async function crawlWebsite() {
  console.log('🚀 Starting FULL website crawl of Thompson\'s Eparts');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Start the crawl job
    console.log('📡 Initiating crawl request...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBSITE_URL,
        crawl: true,  // Full website crawl, not just single page
        max_pages: 50, // Crawl up to 50 pages
        turbo: true   // Use turbo mode for faster crawling
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Crawl started successfully!');
    console.log(`📋 Job ID: ${result.job_id}`);
    console.log(`⚡ Mode: ${result.turbo_mode ? 'TURBO' : 'Standard'}`);
    console.log(`📄 Max pages: 50`);
    console.log('\n' + result.message);
    
    // Monitor the crawl status
    if (result.job_id) {
      console.log('\n📊 Monitoring crawl progress...');
      await monitorCrawlStatus(result.job_id);
    }
    
  } catch (error) {
    console.error('❌ Error starting crawl:', error.message);
    console.log('\n💡 Make sure the Next.js dev server is running:');
    console.log('   npm run dev');
  }
}

async function monitorCrawlStatus(jobId) {
  let completed = false;
  let lastPageCount = 0;
  
  while (!completed) {
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const response = await fetch(`${API_URL}?job_id=${jobId}`);
      const status = await response.json();
      
      if (status.status === 'completed') {
        console.log('\n✅ Crawl completed successfully!');
        console.log(`📄 Total pages processed: ${status.pages_scraped || 'Unknown'}`);
        console.log('\n🎯 What was captured:');
        console.log('   • Full text content from all pages');
        console.log('   • Page titles and metadata');
        console.log('   • Content embeddings for semantic search');
        console.log('   • Product information and prices');
        console.log('   • Navigation structure');
        console.log('\n✨ Your AI agent now has comprehensive knowledge of the website!');
        completed = true;
      } else if (status.status === 'failed') {
        console.error('\n❌ Crawl failed:', status.error);
        completed = true;
      } else {
        const pagesProcessed = status.pages_scraped || 0;
        if (pagesProcessed > lastPageCount) {
          console.log(`⏳ Processing... ${pagesProcessed} pages scraped`);
          lastPageCount = pagesProcessed;
        }
      }
    } catch (error) {
      console.log('⏳ Still processing...');
    }
  }
}

// Check if dev server is running first
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3001/api/scrape?health=true');
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...\n');
  
  const serverRunning = await checkDevServer();
  
  if (!serverRunning) {
    console.error('❌ Development server is not running!');
    console.log('\nPlease start the server first:');
    console.log('   npm run dev\n');
    console.log('Then run this script again in another terminal.');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  await crawlWebsite();
}

main();