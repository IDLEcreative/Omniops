#!/usr/bin/env node

const JOB_ID = 'crawl_1756323762754_1prln9wtm';
const API_URL = 'http://localhost:3000/api/scrape';
const CHECK_INTERVAL = 5000; // 5 seconds

async function checkCrawlStatus() {
  try {
    const response = await fetch(`${API_URL}?job_id=${JOB_ID}&include_results=true`);
    const data = await response.json();
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Status: ${data.status}`);
    
    if (data.pages_processed !== undefined) {
      console.log(`  Pages Processed: ${data.pages_processed}`);
    }
    
    if (data.progress !== undefined) {
      const progressBar = '='.repeat(Math.floor(data.progress / 2)) + '-'.repeat(50 - Math.floor(data.progress / 2));
      console.log(`  Progress: [${progressBar}] ${data.progress}%`);
    }
    
    if (data.current_url) {
      console.log(`  Current URL: ${data.current_url}`);
    }
    
    if (data.status === 'completed') {
      console.log('\n✅ Crawling completed successfully!');
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`\n📊 Summary:`);
        console.log(`  Total pages scraped: ${data.data.length}`);
        
        // Show first 5 pages
        console.log(`\n  First 5 pages:`);
        data.data.slice(0, 5).forEach((page, index) => {
          console.log(`    ${index + 1}. ${page.title || 'No title'}`);
          console.log(`       URL: ${page.url}`);
          console.log(`       Content length: ${page.content ? page.content.length : 0} characters`);
        });
        
        if (data.data.length > 5) {
          console.log(`    ... and ${data.data.length - 5} more pages`);
        }
        
        // Check for unique domains/paths
        const urls = data.data.map(p => p.url);
        const uniquePaths = new Set(urls.map(url => {
          try {
            const u = new URL(url);
            return u.pathname;
          } catch {
            return url;
          }
        }));
        
        console.log(`\n  Unique paths: ${uniquePaths.size}`);
        
        // Check content quality
        const emptyPages = data.data.filter(p => !p.content || p.content.length === 0);
        const shortPages = data.data.filter(p => p.content && p.content.length < 100);
        const goodPages = data.data.filter(p => p.content && p.content.length >= 100);
        
        console.log(`\n  Content Quality:`);
        console.log(`    Good content (>100 chars): ${goodPages.length} pages`);
        console.log(`    Short content (<100 chars): ${shortPages.length} pages`);
        console.log(`    Empty content: ${emptyPages.length} pages`);
        
        // Sample some content
        const samplePage = goodPages[0];
        if (samplePage) {
          console.log(`\n  Sample content from "${samplePage.title || samplePage.url}":`);
          console.log(`    ${samplePage.content.substring(0, 200)}...`);
        }
      }
      
      return true; // Crawling completed
    } else if (data.status === 'failed') {
      console.log('\n❌ Crawling failed!');
      if (data.error) {
        console.log(`  Error: ${data.error}`);
      }
      return true; // Stop monitoring
    }
    
    return false; // Continue monitoring
  } catch (error) {
    console.error('Error checking status:', error.message);
    return false; // Continue monitoring despite error
  }
}

async function monitor() {
  console.log('🔍 Starting scraping monitor for Thompson\'s Parts website...');
  console.log(`Job ID: ${JOB_ID}\n`);
  
  let completed = false;
  let checks = 0;
  const maxChecks = 120; // Maximum 10 minutes
  
  while (!completed && checks < maxChecks) {
    completed = await checkCrawlStatus();
    checks++;
    
    if (!completed) {
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }
  
  if (checks >= maxChecks) {
    console.log('\n⏱️ Monitoring timeout reached (10 minutes). Crawling might still be in progress.');
  }
}

// Start monitoring
monitor().catch(console.error);