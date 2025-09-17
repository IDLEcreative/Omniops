#!/usr/bin/env npx tsx
/**
 * Verification test: Check if intelligent route now returns more Cifa products
 * After fixing the 4 bottlenecks that limited results to 2
 */

import 'dotenv/config';

const TEST_QUERY = "Need a pump for my Cifa mixer";
const DOMAIN = "thompsonseparts.co.uk";

async function testIntelligentRoute() {
  console.log('🚀 TESTING INTELLIGENT ROUTE AFTER FIXES');
  console.log('=' .repeat(60));
  console.log(`Query: "${TEST_QUERY}"`);
  console.log(`Domain: ${DOMAIN}\n`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: `fix-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Analyze the response
    const message = data.message.toLowerCase();
    const cifaMentions = (message.match(/cifa/gi) || []).length;
    
    // Count product links
    const productLinks = (message.match(/https:\/\/[^\s\)]+/gi) || []);
    const cifaProductLinks = productLinks.filter(link => 
      link.toLowerCase().includes('cifa')
    );
    
    // Extract prices
    const prices = (message.match(/£[\d,]+\.?\d*/gi) || []);
    
    console.log('📊 RESULTS SUMMARY');
    console.log('-'.repeat(50));
    console.log(`✅ Processing Time: ${processingTime}ms`);
    console.log(`📦 Cifa mentions: ${cifaMentions}`);
    console.log(`🔗 Total product links: ${productLinks.length}`);
    console.log(`🎯 Cifa product links: ${cifaProductLinks.length}`);
    console.log(`💰 Prices mentioned: ${prices.length}`);
    
    if (data.searchMetadata) {
      console.log('\n🔍 SEARCH METADATA');
      console.log('-'.repeat(50));
      console.log(`Iterations: ${data.searchMetadata.iterations || 1}`);
      console.log(`Total searches: ${data.searchMetadata.totalSearches || 'N/A'}`);
      
      if (data.searchMetadata.searchLog) {
        console.log('\nSearch operations:');
        data.searchMetadata.searchLog.forEach((log: any) => {
          console.log(`  • ${log.tool}: "${log.query}" → ${log.resultCount} results`);
        });
      }
    }
    
    // Show product excerpts
    console.log('\n📝 PRODUCTS MENTIONED');
    console.log('-'.repeat(50));
    
    // Extract product mentions
    const lines = data.message.split('\n');
    let productCount = 0;
    
    for (const line of lines) {
      // Look for lines with product links or bullet points with products
      if (line.includes('http') || (line.includes('•') && line.toLowerCase().includes('pump'))) {
        productCount++;
        const productName = line
          .replace(/^[•\-\*\d\.]+\s*/, '') // Remove bullets/numbers
          .replace(/\[([^\]]+)\].*/g, '$1') // Extract link text
          .replace(/<[^>]+>/g, '') // Remove HTML
          .trim();
        
        if (productName && productName.length > 0) {
          console.log(`${productCount}. ${productName.substring(0, 80)}${productName.length > 80 ? '...' : ''}`);
        }
      }
    }
    
    // Compare with previous results
    console.log('\n📈 IMPROVEMENT CHECK');
    console.log('-'.repeat(50));
    
    const previousCifaProducts = 2; // What we had before fixes
    const improvement = cifaProductLinks.length - previousCifaProducts;
    
    if (cifaProductLinks.length > previousCifaProducts) {
      console.log(`✅ SUCCESS! Now showing ${cifaProductLinks.length} Cifa products (was ${previousCifaProducts})`);
      console.log(`📊 That's a ${Math.round((cifaProductLinks.length / previousCifaProducts - 1) * 100)}% improvement!`);
    } else if (cifaProductLinks.length === previousCifaProducts) {
      console.log(`⚠️ No improvement - still showing ${cifaProductLinks.length} Cifa products`);
      console.log('   Fixes may not be working as expected');
    } else {
      console.log(`❌ Regression - now showing ${cifaProductLinks.length} Cifa products (was ${previousCifaProducts})`);
    }
    
    // Check against database reality
    const databaseCifaProducts = 20;
    const coverage = (cifaProductLinks.length / databaseCifaProducts * 100).toFixed(1);
    console.log(`\n📊 Coverage: ${cifaProductLinks.length}/${databaseCifaProducts} = ${coverage}% of available Cifa products`);
    
    if (parseFloat(coverage) >= 50) {
      console.log('✅ Excellent coverage - showing majority of available products');
    } else if (parseFloat(coverage) >= 25) {
      console.log('✅ Good coverage - significant improvement');
    } else {
      console.log('⚠️ Still room for improvement in coverage');
    }
    
    return {
      success: true,
      cifaProducts: cifaProductLinks.length,
      totalProducts: productLinks.length,
      processingTime,
      coverage: parseFloat(coverage)
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  const result = await testIntelligentRoute();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST COMPLETED');
  console.log('='.repeat(60));
  
  if (result.success) {
    if (result.cifaProducts! > 2) {
      console.log('✅ FIXES SUCCESSFUL - Intelligent route now returns more Cifa products!');
    } else {
      console.log('⚠️ FIXES MAY NEED ADJUSTMENT - Still limited to 2 products');
    }
  } else {
    console.log('❌ TEST FAILED -', result.error);
  }
}

main().catch(console.error);