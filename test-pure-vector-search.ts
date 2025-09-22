#!/usr/bin/env npx tsx
/**
 * Test PURE vector search with short query optimization DISABLED
 * This tests both short (1-2 word) and long queries through vector embeddings only
 */

import { searchSimilarContent } from './lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testPureVectorSearch() {
  console.log('🔬 Testing PURE Vector Search (No Keyword Fallback)\n');
  console.log('=' .repeat(60));
  
  const domain = 'thompsonseparts.co.uk';
  
  // Mix of short and long queries to test vector search performance
  const testQueries = [
    // Short queries (1-2 words) - previously would use keyword search
    { query: 'Cifa', type: 'SHORT (1 word)' },
    { query: 'concrete pumps', type: 'SHORT (2 words)' },
    { query: 'hydraulic parts', type: 'SHORT (2 words)' },
    { query: 'pumps', type: 'SHORT (1 word)' },
    
    // Long queries (3+ words) - already using vector search
    { query: 'What concrete pumps do you have available', type: 'LONG (7 words)' },
    { query: 'Show me hydraulic pump replacement parts', type: 'LONG (6 words)' },
    { query: 'I need information about Cifa concrete pumps', type: 'LONG (7 words)' },
  ];
  
  console.log('📌 Note: Short query optimization is DISABLED');
  console.log('📌 ALL queries will use vector embeddings\n');
  
  for (const { query, type } of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Query: "${query}"`);
    console.log(`📊 Type: ${type}`);
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
      
      if (results.length > 0) {
        console.log('\n🎯 Top 3 Results:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`\n  ${index + 1}. ${result.title}`);
          console.log(`     URL: ${result.url}`);
          console.log(`     Similarity: ${(result.similarity * 100).toFixed(1)}%`);
          
          // Show preview for short queries to see what content matched
          if (type.includes('SHORT')) {
            console.log(`     Preview: ${result.content.substring(0, 150)}...`);
          }
        });
        
        // Summary statistics
        const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
        console.log(`\n  📈 Avg Similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
      } else {
        console.log('❌ No results found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing query: ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Pure Vector Search Test Complete!');
  console.log('\n📊 Summary:');
  console.log('- All queries now use vector embeddings');
  console.log('- Short queries no longer bypass to keyword search');
  console.log('- Domain filtering is active via domain_id field');
}

testPureVectorSearch().catch(console.error);