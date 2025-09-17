#!/usr/bin/env npx tsx
/**
 * Test if AI finds ALL products when asked
 * Specifically checking if it gets all 30 Cifa products
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

async function testProductDiscovery(query: string, expectedProducts: number) {
  console.log('🔍 TESTING COMPLETE PRODUCT DISCOVERY');
  console.log('=' .repeat(60));
  console.log(`Query: "${query}"`);
  console.log(`Expected to find: ~${expectedProducts} products`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: `discovery-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Count searches performed
    console.log('\n📊 SEARCH ACTIVITY:');
    let totalResultsFound = 0;
    
    if (data.searchMetadata?.searchLog) {
      console.log(`Total searches: ${data.searchMetadata.searchLog.length}`);
      
      data.searchMetadata.searchLog.forEach((log: any, index: number) => {
        console.log(`  ${index + 1}. ${log.tool}: "${log.query}"`);
        console.log(`     → ${log.resultCount} results from ${log.source}`);
        totalResultsFound += log.resultCount;
      });
      
      console.log(`\n📦 Total results retrieved across all searches: ${totalResultsFound}`);
    }
    
    // Count products in response
    console.log('\n📝 PRODUCTS IN RESPONSE:');
    
    const message = data.message;
    
    // Count product mentions (URLs or product names)
    const productUrls = (message.match(/https:\/\/[^\s\)]+/gi) || []);
    const cifaLines = message.split('\n').filter((line: string) => 
      line.toLowerCase().includes('cifa')
    );
    
    // Try to extract product names
    const productPatterns = [
      /•\s*([^•\n]+)/g,  // Bullet points
      /\d+\.\s*([^\n]+)/g,  // Numbered lists
      /\[([^\]]+)\]/g,  // Link text
    ];
    
    let productCount = 0;
    const foundProducts: string[] = [];
    
    productPatterns.forEach(pattern => {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].toLowerCase().includes('cifa')) {
          const productName = match[1].split('—')[0].split('-')[0].trim();
          if (productName.length > 10 && !foundProducts.includes(productName)) {
            foundProducts.push(productName);
            productCount++;
          }
        }
      }
    });
    
    console.log(`Unique product URLs found: ${productUrls.length}`);
    console.log(`Lines mentioning Cifa: ${cifaLines.length}`);
    console.log(`Unique Cifa products identified: ${productCount}`);
    
    // Sample of products found
    if (foundProducts.length > 0) {
      console.log('\nSample of products found:');
      foundProducts.slice(0, 5).forEach((product, i) => {
        console.log(`  ${i + 1}. ${product.substring(0, 60)}${product.length > 60 ? '...' : ''}`);
      });
      if (foundProducts.length > 5) {
        console.log(`  ... and ${foundProducts.length - 5} more`);
      }
    }
    
    // Check if AI mentions total count
    const mentionsTotal = message.includes('30') || 
                         message.includes('over') || 
                         message.includes('found') ||
                         message.includes('available') ||
                         message.includes('catalogue');
    
    console.log(`\nMentions total inventory: ${mentionsTotal ? '✅ Yes' : '❌ No'}`);
    
    // Extract any numbers mentioned
    const numbers = message.match(/\d+/g);
    if (numbers) {
      const largeNumbers = numbers.filter(n => parseInt(n) > 10);
      if (largeNumbers.length > 0) {
        console.log(`Numbers mentioned: ${largeNumbers.join(', ')}`);
      }
    }
    
    // Analysis
    console.log('\n📈 COMPLETENESS ANALYSIS:');
    console.log('-'.repeat(50));
    
    const coverage = (productCount / expectedProducts * 100).toFixed(1);
    console.log(`Product Coverage: ${productCount}/${expectedProducts} = ${coverage}%`);
    
    if (productCount >= expectedProducts * 0.9) {
      console.log('✅ EXCELLENT: Found 90%+ of expected products');
    } else if (productCount >= expectedProducts * 0.6) {
      console.log('✅ GOOD: Found 60%+ of expected products');
    } else if (productCount >= expectedProducts * 0.3) {
      console.log('⚠️ PARTIAL: Found 30%+ of expected products');
    } else {
      console.log('❌ INSUFFICIENT: Found less than 30% of products');
    }
    
    // Check if AI gathered complete context
    console.log('\n🧠 CONTEXT GATHERING:');
    if (totalResultsFound >= expectedProducts) {
      console.log(`✅ AI retrieved enough results (${totalResultsFound}) to have complete context`);
    } else {
      console.log(`⚠️ AI retrieved ${totalResultsFound} results, may not have complete context`);
    }
    
    if (productCount < totalResultsFound / 2) {
      console.log('📌 Note: AI found many products but chose to show only the most relevant ones');
    }
    
    // Response time
    console.log(`\n⏱️ Processing time: ${processingTime}ms`);
    
    return {
      productsShown: productCount,
      totalResultsRetrieved: totalResultsFound,
      coverage: parseFloat(coverage),
      hasCompleteContext: totalResultsFound >= expectedProducts,
      processingTime
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      productsShown: 0,
      totalResultsRetrieved: 0,
      coverage: 0,
      hasCompleteContext: false,
      processingTime: 0,
      error: error.message
    };
  }
}

async function main() {
  // Test 1: Cifa products (we know there are 30)
  const result1 = await testProductDiscovery(
    "Show me all Cifa mixer pumps and products you have",
    30
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL VERDICT');
  console.log('='.repeat(60));
  
  if (result1.hasCompleteContext && result1.productsShown >= 15) {
    console.log('✅ SUCCESS: AI gathers complete context and shows sufficient products');
    console.log(`   • Retrieved ${result1.totalResultsRetrieved} results in searches`);
    console.log(`   • Showed ${result1.productsShown} products to user`);
    console.log(`   • Coverage: ${result1.coverage}%`);
  } else if (result1.hasCompleteContext) {
    console.log('⚠️ PARTIAL SUCCESS: AI has complete context but shows limited products');
    console.log(`   • Retrieved ${result1.totalResultsRetrieved} results in searches`);
    console.log(`   • Only showed ${result1.productsShown} products to user`);
    console.log('   • May be filtering for relevance or response length limits');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: AI not gathering complete context');
    console.log(`   • Only retrieved ${result1.totalResultsRetrieved} results`);
    console.log(`   • Showed ${result1.productsShown} products`);
    console.log('   • Should search more comprehensively');
  }
}

main().catch(console.error);