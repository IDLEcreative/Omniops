#!/usr/bin/env node

/**
 * Force rescrape Thompson's eParts via the API
 * This ensures the sitemap is properly fetched like in the turbo scraper
 */

const http = require('http');

async function startForceRescrape() {
  console.log('🚀 Starting Force Rescrape via API (with sitemap support)');
  console.log('=========================================================\n');

  const requestData = JSON.stringify({
    url: 'https://www.thompsonseparts.co.uk',
    crawl: true,
    max_pages: 10000,  // Ensure we get all pages
    turbo: true,
    force_refresh: true,  // Force refresh flag
    incremental: false
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/scrape',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': requestData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response:', response);
          
          if (response.jobId) {
            console.log(`\n📋 Job started with ID: ${response.jobId}`);
            console.log('\n📊 Monitor progress:');
            console.log(`   redis-cli hgetall "crawl:${response.jobId}"`);
            console.log('\n🎯 The API will fetch the sitemap and process ALL pages');
          }
          
          resolve(response);
        } catch (e) {
          console.error('Failed to parse response:', e);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// Make sure the dev server is running first
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
  });
};

async function main() {
  // Set force rescrape environment variable
  process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';
  
  console.log('Checking if dev server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Dev server not running. Please start it with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Dev server is running\n');
  
  try {
    await startForceRescrape();
  } catch (error) {
    console.error('Failed to start rescrape:', error);
    process.exit(1);
  }
}

main();