#!/usr/bin/env npx tsx
/**
 * Test chat-intelligent route with different query phrasings
 * to see if we can trigger searches
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const INTELLIGENT_API = 'http://localhost:3000/api/chat-intelligent';

async function testQuery(query: string) {
  console.log(`\n🔍 Testing: "${query}"`);
  console.log('━'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(INTELLIGENT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: uuidv4(),
        domain: 'thompsonseparts.co.uk',
        config: {
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 30000
          },
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });

    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log(`✅ Response in ${elapsed}ms`);
    
    // Check if searches were performed
    if (data.searchMetadata && data.searchMetadata.searchLog.length > 0) {
      console.log(`🔎 Searches performed: ${data.searchMetadata.totalSearches}`);
      data.searchMetadata.searchLog.forEach((log: any, i: number) => {
        console.log(`   ${i + 1}. ${log.tool}: "${log.query}" → ${log.resultCount} results`);
      });
    } else {
      console.log('❌ No searches performed');
    }
    
    // Check response quality
    const responseLower = data.message.toLowerCase();
    console.log('\n📊 Response Analysis:');
    console.log(`• Response length: ${data.message.length} chars`);
    console.log(`• Sources found: ${data.sources?.length || 0}`);
    console.log(`• Contains products: ${responseLower.includes('http') || responseLower.includes('](') ? '✅' : '❌'}`);
    console.log(`• Asks for clarification: ${responseLower.includes('?') ? '✅' : '❌'}`);
    
    // Show first 200 chars of response
    console.log('\n📝 Response preview:');
    console.log(data.message.substring(0, 200) + '...');
    
    return {
      query,
      searched: (data.searchMetadata?.searchLog?.length || 0) > 0,
      sourcesFound: data.sources?.length || 0,
      responseLength: data.message.length,
      timeMs: elapsed
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      query,
      searched: false,
      sourcesFound: 0,
      responseLength: 0,
      timeMs: 0,
      error: true
    };
  }
}

async function main() {
  console.log('🧪 TESTING CHAT-INTELLIGENT SEARCH TRIGGERS');
  console.log('═'.repeat(60));
  console.log('Testing different query phrasings to trigger searches');
  console.log('═'.repeat(60));
  
  const testQueries = [
    // Original query
    "Need a pump for my Cifa mixer",
    
    // More direct commands
    "Search for Cifa mixer pumps",
    "Find me Cifa mixer pumps",
    "Show me all Cifa pumps",
    "List Cifa mixer pump products",
    
    // Specific requests
    "What Cifa pumps do you have in stock?",
    "I want to buy a Cifa mixer pump",
    "Give me prices for Cifa pumps",
    
    // Urgent/direct
    "Cifa pump urgent",
    "Cifa mixer pump replacement NOW",
    
    // Question format
    "Do you have Cifa mixer pumps?",
    "Can you find Cifa pumps for me?"
  ];
  
  const results = [];
  
  for (const query of testQueries) {
    const result = await testQuery(query);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('═'.repeat(60));
  
  const searchedCount = results.filter(r => r.searched).length;
  const avgSources = results.reduce((sum, r) => sum + r.sourcesFound, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + (r.timeMs || 0), 0) / results.length;
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`• Queries that triggered searches: ${searchedCount}/${results.length} (${(searchedCount/results.length*100).toFixed(1)}%)`);
  console.log(`• Average sources found: ${avgSources.toFixed(1)}`);
  console.log(`• Average response time: ${avgTime.toFixed(0)}ms`);
  
  console.log(`\n🎯 Most Effective Queries:`);
  const effective = results
    .filter(r => r.searched)
    .sort((a, b) => b.sourcesFound - a.sourcesFound)
    .slice(0, 3);
  
  if (effective.length > 0) {
    effective.forEach((r, i) => {
      console.log(`  ${i + 1}. "${r.query}"`);
      console.log(`     → ${r.sourcesFound} sources in ${r.timeMs}ms`);
    });
  } else {
    console.log('  ❌ No queries triggered searches');
  }
  
  console.log(`\n❌ Queries That Failed to Search:`);
  const failed = results.filter(r => !r.searched);
  if (failed.length > 0) {
    failed.forEach(r => {
      console.log(`  • "${r.query}"`);
    });
  } else {
    console.log('  ✅ All queries triggered searches');
  }
  
  console.log('\n💡 Insights:');
  if (searchedCount === 0) {
    console.log('  ⚠️ The AI is not triggering searches - may need prompt adjustment');
    console.log('  ⚠️ Consider making the system prompt more action-oriented');
  } else if (searchedCount < results.length / 2) {
    console.log('  ⚠️ The AI is inconsistent in triggering searches');
    console.log('  💡 Direct commands like "Search for" or "Find" may work better');
  } else {
    console.log('  ✅ The AI successfully triggers searches for most queries');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('═'.repeat(60));
}

// Run tests
console.log('🚀 Starting Chat-Intelligent Search Trigger Test...\n');
main()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });