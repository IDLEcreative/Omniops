#!/usr/bin/env node

/**
 * Test script for scraping Thompson's Parts website
 * This tests the scraper functionality directly
 */

import { scrapePage  } from './lib/scraper-api';

async function testScraper() {
  const url = 'https://www.thompsonseparts.co.uk/';
  
  console.log('🔍 Starting scraper test for:', url);
  console.log('━'.repeat(60));
  
  try {
    console.log('\n📊 Test Configuration:');
    console.log('  - URL:', url);
    console.log('  - Mode: Turbo (blocks unnecessary resources)');
    console.log('  - Timeout: 30 seconds');
    console.log('\n⏳ Scraping in progress...\n');
    
    const startTime = Date.now();
    
    const result = await scrapePage(url, {
      turboMode: true,
      timeouts: {
        request: 30000,
        navigation: 30000,
        resourceLoad: 10000,
      }
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ Scraping completed in', elapsed, 'seconds\n');
    console.log('━'.repeat(60));
    console.log('\n📋 SCRAPING RESULTS:\n');
    
    // Display results
    console.log('🔗 URL:', result.url);
    console.log('📝 Title:', result.title || 'N/A');
    console.log('📊 Word Count:', result.wordCount || 'N/A');
    
    if (result.metadata) {
      console.log('\n📌 Metadata:');
      Object.entries(result.metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          console.log(`  - ${key}:`, value);
        }
      });
    }
    
    if (result.excerpt) {
      console.log('\n📄 Excerpt (first 200 chars):');
      console.log('  "' + result.excerpt.substring(0, 200) + '..."');
    }
    
    if (result.content) {
      console.log('\n📖 Content Preview (first 500 chars):');
      console.log('  ' + result.content.substring(0, 500).replace(/\n/g, '\n  ') + '...');
    }
    
    if (result.images && result.images.length > 0) {
      console.log('\n🖼️  Images Found:', result.images.length);
      console.log('  First 3 images:');
      result.images.slice(0, 3).forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.alt || 'No alt text'} - ${img.src}`);
      });
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n✨ ASSESSMENT:\n');
    
    // Assess the scraping quality
    const assessment = {
      contentExtracted: result.content && result.content.length > 100,
      titleExtracted: !!result.title,
      metadataExtracted: result.metadata && Object.keys(result.metadata).length > 0,
      wordCount: result.wordCount || 0,
      imagesFound: result.images ? result.images.length : 0,
    };
    
    console.log('✔️  Content Extracted:', assessment.contentExtracted ? 'Yes' : 'No');
    console.log('✔️  Title Extracted:', assessment.titleExtracted ? 'Yes' : 'No');
    console.log('✔️  Metadata Extracted:', assessment.metadataExtracted ? 'Yes' : 'No');
    console.log('✔️  Total Words:', assessment.wordCount);
    console.log('✔️  Images Found:', assessment.imagesFound);
    
    // Overall score
    let score = 0;
    if (assessment.contentExtracted) score += 30;
    if (assessment.titleExtracted) score += 20;
    if (assessment.metadataExtracted) score += 20;
    if (assessment.wordCount > 100) score += 20;
    if (assessment.imagesFound > 0) score += 10;
    
    console.log('\n🎯 Overall Score:', score + '/100');
    
    if (score >= 80) {
      console.log('💚 Excellent scraping results!');
    } else if (score >= 60) {
      console.log('🟡 Good scraping results with room for improvement');
    } else {
      console.log('🔴 Poor scraping results - may need configuration adjustments');
    }
    
    console.log('\n━'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error('\nFull error:', error);
    
    // Provide troubleshooting tips
    console.log('\n💡 Troubleshooting Tips:');
    console.log('  1. Check if the website is accessible');
    console.log('  2. Verify Playwright dependencies are installed');
    console.log('  3. Try increasing timeout values');
    console.log('  4. Check if the site has anti-bot protection');
    console.log('  5. Review server logs for more details');
  }
}

// Run the test
testScraper().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});