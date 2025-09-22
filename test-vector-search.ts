#!/usr/bin/env npx tsx
/**
 * Test vector search functionality after domain_id fix
 */

import { searchSimilarContent } from './lib/embeddings';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testVectorSearch() {
  console.log('🔍 Testing Vector Search Functionality\n');
  console.log('=' .repeat(60));
  
  const domain = 'thompsonseparts.co.uk';
  
  // Test cases designed to trigger vector search (3+ words)
  const testQueries = [
    'What concrete pumps do you have available',
    'Show me hydraulic pump replacement parts',
    'I need information about Cifa concrete pumps',
    'What are the available boom pump models',
    'Find spare parts for concrete mixer trucks'
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
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
        console.log('\n🎯 Top Results:');
        results.forEach((result, index) => {
          console.log(`\n  ${index + 1}. ${result.title}`);
          console.log(`     URL: ${result.url}`);
          console.log(`     Similarity: ${(result.similarity * 100).toFixed(1)}%`);
          console.log(`     Preview: ${result.content.substring(0, 100)}...`);
        });
      } else {
        console.log('❌ No results found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing query: ${error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Vector Search Test Complete!');
}

testVectorSearch().catch(console.error);