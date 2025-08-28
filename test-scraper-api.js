#!/usr/bin/env node

/**
 * Test the scraper API endpoint for Thompson's Parts website
 */

const fetch = require('node-fetch');

async function testScraperAPI() {
  const url = 'https://www.thompsonseparts.co.uk/';
  const apiUrl = 'http://localhost:3000/api/scrape';
  
  console.log('🔍 Testing Scraper API for:', url);
  console.log('━'.repeat(60));
  
  try {
    console.log('\n📊 Test Configuration:');
    console.log('  - Target URL:', url);
    console.log('  - API Endpoint:', apiUrl);
    console.log('  - Mode: Single page scrape');
    console.log('  - Turbo Mode: Enabled');
    console.log('\n⏳ Sending scrape request...\n');
    
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        crawl: false,
        turbo: true
      })
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('📡 Response Status:', response.status, response.statusText);
    console.log('⏱️  Response Time:', elapsed, 'seconds');
    
    const result = await response.json();
    
    console.log('\n━'.repeat(60));
    
    if (response.ok) {
      console.log('\n✅ SCRAPING SUCCESSFUL!\n');
      console.log('📋 Results:');
      console.log(JSON.stringify(result, null, 2));
      
      // Assessment
      console.log('\n✨ ASSESSMENT:\n');
      if (result.status === 'completed') {
        console.log('✔️  Status: Completed successfully');
        console.log('✔️  Pages Scraped:', result.pages_scraped || 1);
        console.log('✔️  Message:', result.message);
        console.log('\n💚 The scraper is working correctly!');
      } else if (result.status === 'started') {
        console.log('✔️  Status: Crawl job started');
        console.log('✔️  Job ID:', result.job_id);
        console.log('✔️  Turbo Mode:', result.turbo_mode ? 'Enabled' : 'Disabled');
        console.log('\n💚 The crawler has been initiated successfully!');
      }
    } else {
      console.log('\n❌ SCRAPING FAILED!\n');
      console.log('🔴 Error Details:');
      console.log(JSON.stringify(result, null, 2));
      
      // Troubleshooting
      console.log('\n💡 Troubleshooting Suggestions:\n');
      
      if (result.error === 'Internal server error') {
        console.log('1. Check server logs for detailed error information');
        console.log('2. Verify all dependencies are installed:');
        console.log('   - Run: npm install');
        console.log('   - Ensure Playwright is installed: npx playwright install');
        console.log('3. Check environment variables in .env.local');
        console.log('4. Verify Supabase connection is working');
        console.log('5. Check if Redis is running for job management');
      } else if (result.details) {
        console.log('Validation errors found:');
        result.details.forEach((err, i) => {
          console.log(`${i + 1}. ${err.path}: ${err.message}`);
        });
      }
    }
    
    console.log('\n━'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Request Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 Server is not running!');
      console.log('\n💡 Start the server with: npm run dev');
    } else {
      console.log('\n🔴 Unexpected error occurred');
      console.log('Full error:', error);
    }
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    console.log('node-fetch installed successfully\n');
  } catch (e) {
    console.error('Failed to install node-fetch. Please run: npm install node-fetch@2');
    process.exit(1);
  }
}

// Run the test
testScraperAPI().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});