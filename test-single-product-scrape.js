#!/usr/bin/env node

/**
 * Test script for enhanced force rescrape with e-commerce extraction
 * Tests a single Thompson's eParts product page
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const { spawn } = require('child_process');

const TEST_URL = 'https://www.thompsonseparts.co.uk/product/binotto-omfb-21ltr-oil-tank/';

console.log('🧪 Testing enhanced force rescrape on single product page');
console.log(`📦 Product URL: ${TEST_URL}`);
console.log('');

// Set environment variable to force rescrape
process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';

// Spawn the scraper worker directly
const worker = spawn('node', [
  'lib/scraper-worker.js',
  'test-job-001',
  TEST_URL,
  '1', // max pages
  'true', // turbo mode
  'production', // config preset
  'false', // is own site
  '[]', // no sitemap URLs
  'true' // force rescrape
], {
  env: { ...process.env },
  stdio: 'pipe'
});

let output = '';

worker.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Look for key indicators
  if (text.includes('Force rescrape enabled - skipping deduplication')) {
    console.log('✅ Deduplication skipped for force rescrape');
  }
  if (text.includes('Extracted') && text.includes('products')) {
    console.log('✅ E-commerce extraction triggered');
  }
  if (text.includes('Product:')) {
    console.log('📊 Product data:', text.trim());
  }
  if (text.includes('Force rescrape metadata')) {
    console.log('📝 Metadata extracted');
  }
  if (text.includes('Saved page to database')) {
    console.log('💾 Page saved to database');
  }
  
  // Output everything for debugging
  console.log(text.trim());
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
      'Deduplication skipped': output.includes('skipping deduplication'),
      'E-commerce extraction': output.includes('EcommerceExtractor') || output.includes('products from'),
      'Product data logged': output.includes('Product:'),
      'Database save': output.includes('Saved page to database')
    };
    
    console.log('\nFeature Check:');
    for (const [feature, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${feature}`);
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