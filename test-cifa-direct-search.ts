import 'dotenv/config';
import { searchSimilarContent } from './lib/embeddings';

async function testCifaSearch() {
  console.log('Testing direct Cifa search...\n');
  
  const results = await searchSimilarContent(
    'Cifa',
    'thompsonseparts.co.uk',
    500, // High limit
    0.15
  );
  
  console.log(`Found ${results.length} total results`);
  
  // Count product pages
  const productPages = results.filter(r => r.url.includes('/product/'));
  console.log(`Found ${productPages.length} product pages`);
  
  // Show first 5 results
  console.log('\nFirst 5 results:');
  results.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   URL: ${r.url}`);
    console.log(`   Similarity: ${r.similarity}`);
  });
  
  // Show unique product count
  const uniqueUrls = new Set(productPages.map(r => r.url));
  console.log(`\nUnique product URLs: ${uniqueUrls.size}`);
  
  process.exit(0);
}

testCifaSearch().catch(console.error);