/**
 * Test Enhanced Search for Agricultural Products
 * This tests the searchSimilarContentEnhanced function to ensure it finds Agri Flip
 */

import { searchSimilarContentEnhanced } from './lib/enhanced-embeddings';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testEnhancedSearch() {
  console.log('=== Testing Enhanced Search for Agricultural Tipper ===\n');
  
  const domain = 'thompsonseparts.co.uk';
  
  // Test queries
  const queries = [
    'agricultural tipper',
    'agri flip',
    'agricultural dumper trailer',
    'tipper for agriculture'
  ];
  
  for (const query of queries) {
    console.log(`\nTesting query: "${query}"`);
    console.log('=' .repeat(50));
    
    try {
      const results = await searchSimilarContentEnhanced(
        query,
        domain,
        10,  // Get top 10 results
        0.15 // Low threshold for maximum recall
      );
      
      console.log(`\nFound ${results.length} results:`);
      
      // Check if Agri Flip is in results
      let foundAgriFlip = false;
      
      results.forEach((result, index) => {
        const isAgriFlip = result.url.includes('agri-flip');
        if (isAgriFlip) {
          foundAgriFlip = true;
          console.log(`\n✓ AGRI FLIP FOUND at position ${index + 1}!`);
        }
        
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Content preview: ${result.content.substring(0, 150)}...`);
        
        if (isAgriFlip) {
          console.log('   ★ THIS IS THE AGRI FLIP PRODUCT ★');
        }
      });
      
      if (!foundAgriFlip) {
        console.log('\n❌ Agri Flip NOT found in results');
      }
      
    } catch (error) {
      console.error(`Error testing query "${query}":`, error);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testEnhancedSearch().catch(console.error);