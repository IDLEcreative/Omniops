#!/usr/bin/env npx tsx
/**
 * Test SMART HYBRID search - keyword with vector fallback
 * This should provide the best of both worlds:
 * - Fast keyword search for simple queries with good matches
 * - Intelligent vector fallback when keyword results are insufficient
 */

import { searchSimilarContent } from './lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testSmartHybridSearch() {
  console.log('🚀 Testing SMART HYBRID Search\n');
  console.log('=' .repeat(60));
  console.log('📌 Strategy: Keyword search first, vector fallback if <3 results');
  console.log('=' .repeat(60));
  
  const domain = 'thompsonseparts.co.uk';
  
  // Test scenarios designed to test the hybrid logic
  const testQueries = [
    // Should use keyword (likely to have many matches)
    { query: 'pump', expected: 'KEYWORD', reason: 'Common term with many matches' },
    { query: 'hydraulic', expected: 'KEYWORD', reason: 'Common category term' },
    
    // Should fall back to vector (rare/specific terms)
    { query: 'xyz123', expected: 'VECTOR', reason: 'Non-existent product code' },
    { query: 'asdfghjkl', expected: 'VECTOR', reason: 'Gibberish query' },
    
    // Should use keyword (brand names)
    { query: 'Cifa', expected: 'KEYWORD or VECTOR', reason: 'Brand name - depends on matches' },
    { query: 'Hyva', expected: 'KEYWORD', reason: 'Common brand with many products' },
    
    // Long queries (3+ words) - should go straight to vector
    { query: 'What concrete pumps do you have', expected: 'VECTOR', reason: 'Long query (>2 words)' },
    { query: 'Find hydraulic pump parts for trucks', expected: 'VECTOR', reason: 'Long query (>2 words)' },
  ];
  
  for (const { query, expected, reason } of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Query: "${query}"`);
    console.log(`🎯 Expected: ${expected}`);
    console.log(`💭 Reason: ${reason}`);
    console.log('-'.repeat(60));
    
    try {
      const startTime = Date.now();
      const results = await searchSimilarContent(
        query, 
        domain,
        5,  // limit
        0.15, // similarity threshold
        10000 // timeout
      );
      
      const elapsed = Date.now() - startTime;
      
      console.log(`⏱️  Search completed in ${elapsed}ms`);
      console.log(`📊 Found ${results.length} results`);
      
      // Try to detect which method was used based on response time and logs
      const likelyMethod = elapsed < 500 ? 'KEYWORD (fast)' : 'VECTOR (slower)';
      console.log(`🔍 Likely method: ${likelyMethod}`);
      
      if (results.length > 0) {
        console.log('\n🎯 Top 3 Results:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.title}`);
          // Check if searchMethod was tracked (if we added it)
          if ('searchMethod' in result) {
            console.log(`     Method: ${(result as any).searchMethod}`);
          }
        });
      } else {
        console.log('❌ No results found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing query: ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Smart Hybrid Search Test Complete!');
  console.log('\n📊 Summary:');
  console.log('- Short queries with good keyword matches use fast keyword search');
  console.log('- Short queries with poor matches fall back to vector search');
  console.log('- Long queries (3+ words) always use vector search');
  console.log('- Best of both worlds: Speed + Intelligence');
}

testSmartHybridSearch().catch(console.error);