#!/usr/bin/env npx tsx
/**
 * Comparison test: Original chat route vs Intelligent chat route
 * Testing the specific query: "Need a pump for my Cifa mixer"
 */

import 'dotenv/config';

const TEST_QUERY = "Need a pump for my Cifa mixer";
const DOMAIN = "thompsonseparts.co.uk";
const SESSION_ID = `test-${Date.now()}`;

interface ChatResponse {
  message: string;
  searchMetadata?: any;
  processingTime?: number;
  error?: string;
}

async function testOriginalRoute(): Promise<ChatResponse> {
  console.log('🔵 Testing ORIGINAL Chat Route');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: SESSION_ID + '-original',
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return {
      message: data.message,
      processingTime,
      searchMetadata: data.searchMetadata,
    };
  } catch (error: any) {
    console.error('Error:', error.message);
    return {
      message: '',
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

async function testIntelligentRoute(): Promise<ChatResponse> {
  console.log('\n🧠 Testing INTELLIGENT Chat Route');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: SESSION_ID + '-intelligent',
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return {
      message: data.message,
      processingTime,
      searchMetadata: data.searchMetadata,
    };
  } catch (error: any) {
    console.error('Error:', error.message);
    return {
      message: '',
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

function analyzeResponse(response: ChatResponse, routeName: string) {
  console.log(`\n📊 ${routeName} Results:`);
  console.log('-'.repeat(50));
  
  if (response.error) {
    console.log(`❌ Error: ${response.error}`);
    return { cifaCount: 0, hasProducts: false, hasPrices: false };
  }
  
  // Count Cifa product mentions
  const messageText = response.message.toLowerCase();
  const cifaMentions = (messageText.match(/cifa/gi) || []).length;
  
  // Check for product listings
  const hasProducts = messageText.includes('http') || messageText.includes('product');
  const hasPrices = messageText.includes('£') || messageText.includes('price');
  
  // Extract product count if mentioned
  const productCountMatch = messageText.match(/(\d+)\s*(cifa\s+)?products?/i);
  const productCount = productCountMatch ? parseInt(productCountMatch[1]) : cifaMentions;
  
  console.log(`✅ Processing Time: ${response.processingTime}ms`);
  console.log(`📦 Cifa mentions: ${cifaMentions}`);
  console.log(`🔗 Has product links: ${hasProducts}`);
  console.log(`💰 Has prices: ${hasPrices}`);
  
  if (response.searchMetadata) {
    console.log(`\n🔍 Search Metadata:`);
    console.log(`  - Iterations: ${response.searchMetadata.iterations || 1}`);
    console.log(`  - Total searches: ${response.searchMetadata.totalSearches || 'N/A'}`);
    if (response.searchMetadata.searchLog) {
      console.log(`  - Search tools used:`);
      response.searchMetadata.searchLog.forEach((log: any) => {
        console.log(`    • ${log.tool}: "${log.query}" (${log.resultCount} results)`);
      });
    }
  }
  
  // Show first 500 chars of response
  console.log(`\n📝 Response Preview (first 500 chars):`);
  console.log(response.message.substring(0, 500) + '...\n');
  
  return { 
    cifaCount: cifaMentions, 
    hasProducts, 
    hasPrices,
    productCount,
    processingTime: response.processingTime
  };
}

async function runComparison() {
  console.log('🚀 CIFA PUMP QUERY COMPARISON TEST');
  console.log('=' .repeat(60));
  console.log(`Query: "${TEST_QUERY}"`);
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  // Test both routes
  const [originalResult, intelligentResult] = await Promise.all([
    testOriginalRoute(),
    testIntelligentRoute(),
  ]);
  
  // Analyze results
  const originalAnalysis = analyzeResponse(originalResult, 'ORIGINAL');
  const intelligentAnalysis = analyzeResponse(intelligentResult, 'INTELLIGENT');
  
  // Comparison summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 COMPARISON SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n| Metric | Original | Intelligent | Winner |');
  console.log('|--------|----------|-------------|---------|');
  console.log(`| Processing Time | ${originalAnalysis.processingTime}ms | ${intelligentAnalysis.processingTime}ms | ${
    originalAnalysis.processingTime! < intelligentAnalysis.processingTime! ? 'Original ⚡' : 'Intelligent ⚡'
  } |`);
  console.log(`| Cifa Mentions | ${originalAnalysis.cifaCount} | ${intelligentAnalysis.cifaCount} | ${
    originalAnalysis.cifaCount > intelligentAnalysis.cifaCount ? 'Original 📦' : 
    originalAnalysis.cifaCount === intelligentAnalysis.cifaCount ? 'Tie 🤝' : 'Intelligent 📦'
  } |`);
  console.log(`| Has Products | ${originalAnalysis.hasProducts ? '✅' : '❌'} | ${intelligentAnalysis.hasProducts ? '✅' : '❌'} | ${
    originalAnalysis.hasProducts && !intelligentAnalysis.hasProducts ? 'Original 🔗' :
    !originalAnalysis.hasProducts && intelligentAnalysis.hasProducts ? 'Intelligent 🔗' : 'Tie 🤝'
  } |`);
  console.log(`| Has Prices | ${originalAnalysis.hasPrices ? '✅' : '❌'} | ${intelligentAnalysis.hasPrices ? '✅' : '❌'} | ${
    originalAnalysis.hasPrices && !intelligentAnalysis.hasPrices ? 'Original 💰' :
    !originalAnalysis.hasPrices && intelligentAnalysis.hasPrices ? 'Intelligent 💰' : 'Tie 🤝'
  } |`);
  
  // Overall winner
  let originalScore = 0;
  let intelligentScore = 0;
  
  if (originalAnalysis.cifaCount > intelligentAnalysis.cifaCount) originalScore++;
  else if (intelligentAnalysis.cifaCount > originalAnalysis.cifaCount) intelligentScore++;
  
  if (originalAnalysis.hasProducts && !intelligentAnalysis.hasProducts) originalScore++;
  else if (intelligentAnalysis.hasProducts && !originalAnalysis.hasProducts) intelligentScore++;
  
  if (originalAnalysis.hasPrices && !intelligentAnalysis.hasPrices) originalScore++;
  else if (intelligentAnalysis.hasPrices && !originalAnalysis.hasPrices) intelligentScore++;
  
  console.log('\n🏆 OVERALL WINNER:');
  if (intelligentScore > originalScore) {
    console.log('   🧠 INTELLIGENT ROUTE - Better product discovery and information!');
  } else if (originalScore > intelligentScore) {
    console.log('   🔵 ORIGINAL ROUTE - More comprehensive results!');
  } else {
    console.log('   🤝 TIE - Both routes performed similarly');
  }
  
  // Key insights
  console.log('\n💡 KEY INSIGHTS:');
  if (intelligentResult.searchMetadata?.iterations > 1) {
    console.log('   • Intelligent route used iterative searching for better results');
  }
  if (intelligentAnalysis.processingTime! > originalAnalysis.processingTime! * 1.5) {
    console.log('   • Intelligent route took longer but may have found more relevant results');
  }
  if (intelligentAnalysis.cifaCount > originalAnalysis.cifaCount * 2) {
    console.log('   • Intelligent route found significantly more Cifa products');
  }
  
  console.log('\n✅ Test completed successfully!');
}

// Run the comparison
runComparison().catch(console.error);