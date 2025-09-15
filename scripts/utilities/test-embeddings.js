// Test script to debug embedding search
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { searchSimilarContent  } from './lib/embeddings';

async function testEmbeddingSearch() {
  const query = process.argv[2] || 'dc66-10p';
  console.log(`Testing embedding/keyword search for thompsonseparts.co.uk with query: "${query}"\n`);
  
  try {
    const results = await searchSimilarContent(
      query,
      'thompsonseparts.co.uk',
      5,
      0.3
    );
    
    console.log('Search Results:', results.length);
    if (results.length > 0) {
      console.log('\nFirst result:');
      console.log('- Title:', results[0].title);
      console.log('- URL:', results[0].url);
      console.log('- Similarity:', results[0].similarity);
      console.log('- Content preview:', results[0].content.substring(0, 200) + '...');
    } else {
      console.log('No results found!');
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

testEmbeddingSearch();
