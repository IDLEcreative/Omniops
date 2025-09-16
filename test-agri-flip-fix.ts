#!/usr/bin/env npx tsx
/**
 * Test script to verify the fix for Agri Flip product search
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import the enhanced search function
import { searchSimilarContentEnhanced } from './lib/enhanced-embeddings';

async function main() {
  console.log('🔬 TESTING AGRI FLIP SEARCH FIX\n');
  console.log('='.repeat(80));
  
  const domain = 'thompsonseparts.co.uk';
  const queries = [
    'agricultural tipper',
    'agri flip',
    'agricultural dumper trailer sheeting',
    'tipper trailer sheeting systems agriculture'
  ];
  
  for (const query of queries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(60));
    
    try {
      // Call the enhanced search function
      const results = await searchSimilarContentEnhanced(
        query,
        domain,
        10, // Get top 10 results
        0.15 // Low threshold for broad recall
      );
      
      console.log(`✓ Found ${results.length} results`);
      
      // Check if Agri Flip is in the results
      const agriFlipIndex = results.findIndex(r => 
        r.url?.includes('agri-flip') || 
        r.title?.toLowerCase().includes('agri flip')
      );
      
      if (agriFlipIndex >= 0) {
        console.log(`\n🎯 AGRI FLIP FOUND at position ${agriFlipIndex + 1}!`);
        const agriFlip = results[agriFlipIndex];
        console.log(`   Title: ${agriFlip.title}`);
        console.log(`   URL: ${agriFlip.url}`);
        console.log(`   Similarity: ${(agriFlip.similarity * 100).toFixed(1)}%`);
        console.log(`   Content preview: ${agriFlip.content.substring(0, 100)}...`);
      } else {
        console.log(`\n❌ AGRI FLIP NOT FOUND in results`);
      }
      
      // Show top 5 results
      console.log('\nTop 5 results:');
      results.slice(0, 5).forEach((r, i) => {
        console.log(`${i + 1}. [${(r.similarity * 100).toFixed(1)}%] ${r.title}`);
        if (r.url?.includes('agri')) {
          console.log(`   ✓ Contains "agri" in URL`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST COMPLETE');
  console.log('\nSUMMARY:');
  console.log('The enhanced search function should now be finding the Agri Flip product');
  console.log('for agricultural queries, with comprehensive logging showing the flow.');
}

main().catch(console.error);