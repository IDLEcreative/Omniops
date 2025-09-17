#!/usr/bin/env npx tsx
/**
 * Test specific search queries to understand current behavior
 */

import 'dotenv/config';
import { searchSimilarContent } from './lib/embeddings';

const TEST_QUERIES = [
  { query: "Cifa Mixer Proportional Mag Solenoid", expectedResults: "1-2 exact matches" },
  { query: "hydraulic pumps", expectedResults: "30+ pumps" },
  { query: "Cifa water pumps", expectedResults: "5-10 Cifa-specific water pumps" }
];

const DOMAIN = "thompsonseparts.co.uk";

async function testQuery(query: string, expectedResults: string) {
  console.log(`\n🔍 Testing Query: "${query}"`);
  console.log(`Expected: ${expectedResults}`);
  console.log('-'.repeat(60));
  
  try {
    const startTime = Date.now();
    const results = await searchSimilarContent(query, DOMAIN, 500, 0.15);
    const endTime = Date.now();
    
    console.log(`✅ Found ${results.length} results in ${endTime - startTime}ms`);
    
    // Show top 10 results with details
    console.log('\n📊 Top 10 Results:');
    results.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Similarity: ${result.similarity.toFixed(3)}`);
      // Show if it's a product page
      if (result.url.includes('/product/')) {
        console.log(`   Type: Product Page`);
      }
      // Check for exact keyword matches
      const titleLower = result.title.toLowerCase();
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/);
      const matches = queryWords.filter(word => titleLower.includes(word));
      console.log(`   Keyword matches: ${matches.length}/${queryWords.length} (${matches.join(', ')})`);
      console.log(`   Content preview: ${result.content.substring(0, 100)}...`);
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

async function runTests() {
  console.log('🚀 SEARCH ACCURACY TEST');
  console.log('=' .repeat(60));
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const test of TEST_QUERIES) {
    const result = await testQuery(test.query, test.expectedResults);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n| Query | Results | Product Pages | Exact Matches | Time |');
  console.log('|-------|---------|---------------|---------------|------|');
  
  results.forEach(r => {
    console.log(`| ${r.query.substring(0, 25)}... | ${r.resultCount} | ${r.productPages} | ${r.exactMatches} | ${r.executionTime}ms |`);
  });
  
  // Issues identified
  console.log('\n🔍 ISSUES IDENTIFIED:');
  results.forEach(r => {
    if (r.query === "Cifa Mixer Proportional Mag Solenoid" && r.resultCount > 5) {
      console.log('   ❌ Specific product search returning too many results');
    }
    if (r.query === "hydraulic pumps" && r.resultCount < 20) {
      console.log('   ❌ Category search not finding enough products');
    }
    if (r.exactMatches === 0) {
      console.log(`   ⚠️  No exact matches found for "${r.query}"`);
    }
  });
  
  console.log('\n✅ Test completed!');
}

// Run the tests
runTests().catch(console.error);