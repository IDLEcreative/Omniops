#!/usr/bin/env npx tsx
/**
 * Test the intelligent route with generic prompting (no hardcoded brands)
 * Testing various queries to ensure the AI reasons intelligently
 */

import 'dotenv/config';

const DOMAIN = "thompsonseparts.co.uk";

interface TestCase {
  query: string;
  description: string;
  expectedBehavior: string;
}

const TEST_CASES: TestCase[] = [
  {
    query: "Need a pump for my Cifa mixer",
    description: "Brand-specific pump request",
    expectedBehavior: "Should search for Cifa products and pumps"
  },
  {
    query: "Looking for hydraulic hoses",
    description: "Generic product category",
    expectedBehavior: "Should search for hydraulic hoses broadly"
  },
  {
    query: "What Teng tools do you have?",
    description: "Different brand query",
    expectedBehavior: "Should search for Teng products"
  }
];

async function testQuery(testCase: TestCase) {
  console.log('\n' + '='.repeat(60));
  console.log(`📝 TEST: ${testCase.description}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`Expected: ${testCase.expectedBehavior}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.query,
        session_id: `generic-test-${Date.now()}`,
        domain: DOMAIN,
      }),
    });

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    // Analyze search behavior
    console.log('\n🔍 AI SEARCH BEHAVIOR:');
    if (data.searchMetadata?.searchLog) {
      console.log(`Searches performed: ${data.searchMetadata.searchLog.length}`);
      
      data.searchMetadata.searchLog.forEach((log: any, index: number) => {
        console.log(`  ${index + 1}. ${log.tool}: "${log.query}" → ${log.resultCount} results`);
      });
      
      // Check if searches are intelligent
      const searchQueries = data.searchMetadata.searchLog.map((log: any) => log.query.toLowerCase());
      
      console.log('\n✨ Intelligence Analysis:');
      
      // For Cifa query
      if (testCase.query.toLowerCase().includes('cifa')) {
        const hasBrandSearch = searchQueries.some(q => q.includes('cifa'));
        const hasProductSearch = searchQueries.some(q => q.includes('pump') || q.includes('mixer'));
        console.log(`  • Searched for brand (Cifa): ${hasBrandSearch ? '✅' : '❌'}`);
        console.log(`  • Searched for product type: ${hasProductSearch ? '✅' : '❌'}`);
      }
      
      // For Teng query
      if (testCase.query.toLowerCase().includes('teng')) {
        const hasBrandSearch = searchQueries.some(q => q.includes('teng'));
        console.log(`  • Searched for brand (Teng): ${hasBrandSearch ? '✅' : '❌'}`);
      }
      
      // For hydraulic query
      if (testCase.query.toLowerCase().includes('hydraulic')) {
        const hasProductSearch = searchQueries.some(q => q.includes('hydraulic') || q.includes('hose'));
        console.log(`  • Searched for product type: ${hasProductSearch ? '✅' : '❌'}`);
      }
      
      // Check for parallel execution
      if (data.searchMetadata.searchLog.length > 1) {
        console.log(`  • Multiple searches executed: ✅ (${data.searchMetadata.searchLog.length} searches)`);
      }
    } else {
      console.log('❌ No search metadata available');
    }
    
    // Analyze response quality
    console.log('\n📊 RESPONSE QUALITY:');
    const message = data.message.toLowerCase();
    
    const metrics = {
      hasProducts: message.includes('http') || message.includes('product'),
      hasPrices: message.includes('£'),
      showsAwareness: message.includes('found') || message.includes('available') || message.includes('inventory'),
      isRelevant: false
    };
    
    // Check relevance based on query
    if (testCase.query.toLowerCase().includes('cifa')) {
      metrics.isRelevant = message.includes('cifa');
    } else if (testCase.query.toLowerCase().includes('teng')) {
      metrics.isRelevant = message.includes('teng');
    } else if (testCase.query.toLowerCase().includes('hydraulic')) {
      metrics.isRelevant = message.includes('hydraulic') || message.includes('hose');
    }
    
    console.log(`  • Shows products: ${metrics.hasProducts ? '✅' : '❌'}`);
    console.log(`  • Includes prices: ${metrics.hasPrices ? '✅' : '❌'}`);
    console.log(`  • Shows context awareness: ${metrics.showsAwareness ? '✅' : '❌'}`);
    console.log(`  • Response is relevant: ${metrics.isRelevant ? '✅' : '❌'}`);
    console.log(`  • Processing time: ${processingTime}ms`);
    
    // Show excerpt
    console.log('\n📝 Response excerpt:');
    const firstParagraph = data.message.split('\n')[0];
    console.log(`"${firstParagraph.substring(0, 150)}${firstParagraph.length > 150 ? '...' : ''}"`);
    
    // Score
    const searchCount = data.searchMetadata?.searchLog.length || 0;
    const score = 
      (searchCount > 0 ? 1 : 0) +
      (searchCount > 2 ? 1 : 0) +
      (metrics.hasProducts ? 1 : 0) +
      (metrics.showsAwareness ? 1 : 0) +
      (metrics.isRelevant ? 1 : 0);
    
    const maxScore = 5;
    const percentage = (score / maxScore * 100).toFixed(0);
    
    console.log(`\n🎯 Score: ${score}/${maxScore} (${percentage}%)`);
    
    return {
      query: testCase.query,
      searches: searchCount,
      score,
      percentage: parseInt(percentage),
      success: score >= 3
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      query: testCase.query,
      searches: 0,
      score: 0,
      percentage: 0,
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🧪 TESTING GENERIC AI INTELLIGENCE (No Hardcoded Brands)');
  console.log('=' .repeat(60));
  console.log('Testing if AI can intelligently handle various queries');
  console.log('without hardcoded instructions for specific brands\n');
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testQuery(testCase);
    results.push(result);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n| Query | Searches | Score | Result |');
  console.log('|-------|----------|-------|---------|');
  
  results.forEach(result => {
    const queryShort = result.query.substring(0, 30) + (result.query.length > 30 ? '...' : '');
    const status = result.success ? '✅ Pass' : '❌ Fail';
    console.log(`| ${queryShort.padEnd(30)} | ${result.searches.toString().padEnd(8)} | ${result.percentage}%   | ${status} |`);
  });
  
  const avgScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  const allPassed = results.every(r => r.success);
  
  console.log(`\nAverage Score: ${avgScore.toFixed(0)}%`);
  
  console.log('\n💡 CONCLUSIONS:');
  if (allPassed) {
    console.log('✅ AI successfully reasons about different queries intelligently!');
    console.log('✅ No hardcoded brand logic needed - AI adapts to each request');
    console.log('✅ Parallel searching works for all query types');
  } else {
    const failed = results.filter(r => !r.success);
    console.log(`⚠️ ${failed.length} test(s) need improvement`);
    failed.forEach(f => {
      console.log(`   • "${f.query}" - only ${f.searches} searches performed`);
    });
  }
  
  console.log('\n✅ Test completed!');
}

main().catch(console.error);