#!/usr/bin/env npx tsx
/**
 * Test search with fresh cache to see the actual improvements
 */

import 'dotenv/config';
import { searchSimilarContent } from './lib/embeddings';
import { createServiceRoleClient } from './lib/supabase-server';

const TEST_QUERIES = [
  { query: "Cifa Mixer Proportional Mag Solenoid", expectedResults: "1-2 exact matches" },
  { query: "hydraulic pumps", expectedResults: "30+ pumps" },
  { query: "Cifa water pumps", expectedResults: "5-10 Cifa-specific water pumps" }
];

const DOMAIN = "thompsonseparts.co.uk";

async function clearQueryCache() {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.log('Could not connect to Supabase to clear cache');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('query_cache')
      .delete()
      .gte('created_at', '2024-01-01');
    
    if (error) {
      console.log('Error clearing cache:', error);
    } else {
      console.log('✅ Query cache cleared');
    }
  } catch (e) {
    console.log('Cache clear failed:', e);
  }
}

async function testQuery(query: string, expectedResults: string) {
  console.log(`\n🔍 Testing Query: "${query}"`);
  console.log(`Expected: ${expectedResults}`);
  console.log('-'.repeat(60));
  
  try {
    const startTime = Date.now();
    const results = await searchSimilarContent(query, DOMAIN, 100, 0.15);
    const endTime = Date.now();
    
    console.log(`✅ Found ${results.length} results in ${endTime - startTime}ms`);
    
    // Show top 5 results with details
    console.log('\n📊 Top 5 Results:');
    results.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Similarity: ${result.similarity.toFixed(3)}`);
      // Check for exact keyword matches
      const titleLower = result.title.toLowerCase();
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/);
      const matches = queryWords.filter(word => titleLower.includes(word));
      console.log(`   Keyword matches: ${matches.length}/${queryWords.length} (${matches.join(', ')})`);
      console.log('');
    });
    
    // Analyze results quality
    const productPages = results.filter(r => r.url.includes('/product/')).length;
    const highSimilarity = results.filter(r => r.similarity > 0.8).length;
    const exactMatches = results.filter(r => {
      const titleLower = r.title.toLowerCase();
      const queryLower = query.toLowerCase();
      return queryLower.split(/\s+/).every(word => titleLower.includes(word));
    }).length;
    
    console.log(`📈 Quality Analysis:`);
    console.log(`   - Product pages: ${productPages}/${results.length}`);
    console.log(`   - High similarity (>0.8): ${highSimilarity}/${results.length}`);
    console.log(`   - Exact title matches: ${exactMatches}/${results.length}`);
    
    return {
      query,
      resultCount: results.length,
      productPages,
      highSimilarity,
      exactMatches,
      executionTime: endTime - startTime
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    return {
      query,
      resultCount: 0,
      productPages: 0,
      highSimilarity: 0,
      exactMatches: 0,
      executionTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runFreshTests() {
  console.log('🚀 FRESH SEARCH ACCURACY TEST');
  console.log('=' .repeat(60));
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Clear cache first
  console.log('\n🧹 Clearing cache to test fresh results...');
  await clearQueryCache();
  
  const results = [];
  
  for (const test of TEST_QUERIES) {
    const result = await testQuery(test.query, test.expectedResults);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FRESH RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n| Query | Results | Product Pages | Exact Matches | Time |');
  console.log('|-------|---------|---------------|---------------|------|');
  
  results.forEach(r => {
    console.log(`| ${r.query.substring(0, 25)}... | ${r.resultCount} | ${r.productPages} | ${r.exactMatches} | ${r.executionTime}ms |`);
  });
  
  // Improvements identified
  console.log('\n🎯 IMPROVEMENTS:');
  const specificResult = results.find(r => r.query.includes('Proportional'));
  const categoryResult = results.find(r => r.query === 'hydraulic pumps');
  const cifaWaterResult = results.find(r => r.query === 'Cifa water pumps');
  
  if (specificResult && specificResult.resultCount <= 10) {
    console.log('   ✅ Specific product search now returns fewer, more relevant results');
  }
  if (categoryResult && categoryResult.resultCount >= 10) {
    console.log('   ✅ Category search now finds more products');
  }
  if (cifaWaterResult && cifaWaterResult.exactMatches > 0) {
    console.log('   ✅ Multi-word search now finds exact matches');
  }
  
  console.log('\n✅ Fresh test completed!');
}

// Run the fresh tests
runFreshTests().catch(console.error);