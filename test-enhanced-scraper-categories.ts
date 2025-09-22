#!/usr/bin/env npx tsx
/**
 * Test script for enhanced scraper with category extraction
 * Verifies breadcrumbs and categories are properly captured
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedScraper() {
  console.log('🔍 Testing Enhanced Scraper with Category Extraction\n');
  console.log('=' .repeat(60));
  
  // Test URLs from Thompsons eParts
  const testUrls = [
    'https://www.thompsonseparts.co.uk/product/cifa-k38xrz-k38-xrz-concrete-pump/',
    'https://www.thompsonseparts.co.uk/product/binotto-b3-21002507000-hydraulic-tipping-ram-cylinder/',
    'https://www.thompsonseparts.co.uk/product/hyva-14588580-fc-149-3-3675-hydraulic-tipping-ram-cylinder/'
  ];
  
  console.log('📋 Test Plan:');
  console.log('1. Check if breadcrumbs are preserved in scraped content');
  console.log('2. Verify product categories are extracted');
  console.log('3. Confirm metadata includes product data');
  console.log('4. Test category inference from breadcrumbs\n');
  
  console.log('=' .repeat(60));
  console.log('\n🧪 Running Tests...\n');
  
  // Check recent scraped pages
  const { data: recentPages, error } = await supabase
    .from('scraped_pages')
    .select('url, title, content, metadata')
    .in('url', testUrls)
    .order('scraped_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching scraped pages:', error);
    return;
  }
  
  if (!recentPages || recentPages.length === 0) {
    console.log('⚠️  No test URLs found in scraped_pages');
    console.log('    You may need to run a force rescrape first');
    console.log('\n📝 To test with force rescrape, run:');
    console.log('    SCRAPER_FORCE_RESCRAPE_ALL=true npm run scraper:crawl -- --url=https://www.thompsonseparts.co.uk/product/cifa-k38xrz-k38-xrz-concrete-pump/\n');
    return;
  }
  
  // Analyze each page
  let passedTests = 0;
  let totalTests = 0;
  
  for (const page of recentPages) {
    console.log(`\n📄 Testing: ${page.title || page.url}`);
    console.log('-'.repeat(50));
    
    // Test 1: Check for breadcrumb presence
    totalTests++;
    const hasBreadcrumbs = page.content?.includes('breadcrumb') || 
                          page.content?.includes('Home') ||
                          page.metadata?.breadcrumbs;
    
    if (hasBreadcrumbs) {
      console.log('✅ Test 1: Breadcrumbs found in content/metadata');
      passedTests++;
    } else {
      console.log('❌ Test 1: No breadcrumbs found');
    }
    
    // Test 2: Check for product data in metadata
    totalTests++;
    const hasProductData = page.metadata?.productData || 
                          page.metadata?.categories ||
                          page.metadata?.primaryCategory;
    
    if (hasProductData) {
      console.log('✅ Test 2: Product data found in metadata');
      if (page.metadata?.productData) {
        console.log(`   Categories: ${page.metadata.productData.categories?.join(', ') || 'none'}`);
        console.log(`   Primary: ${page.metadata.productData.primaryCategory || 'none'}`);
        console.log(`   Breadcrumbs: ${page.metadata.productData.breadcrumbs?.map((b: any) => b.name).join(' > ') || 'none'}`);
      }
      passedTests++;
    } else {
      console.log('❌ Test 2: No product data in metadata');
    }
    
    // Test 3: Check for category keywords in content
    totalTests++;
    const categoryKeywords = ['pump', 'cylinder', 'hydraulic', 'tipping', 'concrete'];
    const foundCategories = categoryKeywords.filter(keyword => 
      page.content?.toLowerCase().includes(keyword)
    );
    
    if (foundCategories.length > 0) {
      console.log(`✅ Test 3: Category keywords found: ${foundCategories.join(', ')}`);
      passedTests++;
    } else {
      console.log('❌ Test 3: No category keywords found');
    }
    
    // Test 4: Check for preserved HTML structure indicators
    totalTests++;
    const hasStructure = page.metadata?.businessInfo || 
                        page.metadata?.images?.length > 0 ||
                        page.metadata?.links?.length > 0;
    
    if (hasStructure) {
      console.log('✅ Test 4: Rich structure preserved');
      passedTests++;
    } else {
      console.log('❌ Test 4: Limited structure in metadata');
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests * 100)}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Category extraction is working properly.');
  } else if (passedTests / totalTests >= 0.5) {
    console.log('\n⚠️  Partial success. Some category features may need adjustment.');
    console.log('    Consider running a force rescrape to get fresh data.');
  } else {
    console.log('\n❌ Category extraction needs improvement.');
    console.log('    The scraper may not have the latest enhancements.');
  }
  
  // Check if we need to rescrape
  if (passedTests < totalTests) {
    console.log('\n💡 Recommendation:');
    console.log('   Run a force rescrape to apply the latest extraction logic:');
    console.log('   SCRAPER_FORCE_RESCRAPE_ALL=true npm run scraper:crawl -- --url=https://www.thompsonseparts.co.uk\n');
  }
}

// Run the test
testEnhancedScraper()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });