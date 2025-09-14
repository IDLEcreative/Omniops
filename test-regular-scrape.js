#!/usr/bin/env node

/**
 * Test script for regular scraper with e-commerce extraction
 * Tests a single new Thompson's eParts product page WITHOUT force flag
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const { spawn } = require('child_process');

// Use a different product URL to ensure it's not cached
const TEST_URL = 'https://www.thompsonseparts.co.uk/product/binotto-omfb-pumps-and-valves/';

console.log('🧪 Testing regular scraper on new product page');
console.log(`📦 Product URL: ${TEST_URL}`);
console.log('⚡ Running WITHOUT --force flag');
console.log('');

// Spawn the scraper worker WITHOUT force flag
const worker = spawn('node', [
  'lib/scraper-worker.js',
  'test-job-002',
  TEST_URL,
  '1', // max pages
  'true', // turbo mode
  'production', // config preset
  'false', // is own site
  '[]', // no sitemap URLs
  'false' // NO force rescrape - this is the key difference
], {
  env: { ...process.env },
  stdio: 'pipe'
});

let output = '';
let hasEcommerceExtraction = false;
let hasMetadata = false;
let productData = null;

worker.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Look for key indicators
  if (text.includes('Extracted') && text.includes('products')) {
    console.log('✅ E-commerce extraction triggered');
    hasEcommerceExtraction = true;
  }
  if (text.includes('Product:')) {
    console.log('📊 Product data found');
    // Try to extract the product data
    const match = text.match(/Product: ({.*})/);
    if (match) {
      try {
        productData = JSON.parse(match[1]);
        console.log('📦 Extracted product:', productData);
      } catch (e) {
        console.log('📦 Product data:', text.trim());
      }
    }
  }
  if (text.includes('productName') || text.includes('productSku') || text.includes('productPrice')) {
    console.log('📝 Metadata fields detected');
    hasMetadata = true;
  }
  if (text.includes('Saved page to database')) {
    console.log('💾 Page saved to database');
  }
  if (text.includes('Skipping recently scraped page')) {
    console.log('⚠️ Page was cached - may need to test with a different URL');
  }
  
  // Output everything for debugging
  if (text.includes('Worker')) {
    console.log(text.trim());
  }
});

worker.stderr.on('data', (data) => {
  const text = data.toString();
  if (!text.includes('DeprecationWarning')) {
    console.error('❌ Error:', text);
  }
});

worker.on('close', (code) => {
  console.log('');
  console.log('='.repeat(50));
  
  if (code === 0) {
    console.log('✅ Test completed successfully!');
    
    // Check if key features worked
    const checks = {
      'E-commerce extraction ran': hasEcommerceExtraction,
      'Product metadata captured': hasMetadata || productData,
      'Database save successful': output.includes('Saved page to database')
    };
    
    console.log('\nFeature Check for Regular Scraper:');
    for (const [feature, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${feature}`);
    }
    
    if (!hasEcommerceExtraction) {
      console.log('\n⚠️ E-commerce extraction did not run in regular scraper!');
      console.log('This needs to be fixed for new sites.');
    } else {
      console.log('\n✅ Regular scraper correctly extracts e-commerce metadata!');
    }
  } else {
    console.log(`❌ Test failed with exit code ${code}`);
  }
  
  process.exit(code);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏱️ Test timeout - killing process');
  worker.kill();
  process.exit(1);
}, 30000);