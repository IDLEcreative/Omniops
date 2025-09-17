import { searchSimilarContent } from './lib/embeddings';

async function testCifaSearch() {
  console.log('Testing Cifa search...');
  
  const results = await searchSimilarContent('Cifa', 'thompsonseparts.co.uk', 100, 0.15);
  
  console.log(`Found ${results.length} results for "Cifa"`);
  
  // Count actual Cifa products
  const cifaProducts = results.filter(r => 
    r.title?.toLowerCase().includes('cifa') || 
    r.content?.toLowerCase().includes('cifa')
  );
  
  console.log(`Actual Cifa products: ${cifaProducts.length}`);
  
  // Show first few titles
  console.log('\nFirst 5 titles:');
  results.slice(0, 5).forEach(r => {
    console.log(`- ${r.title}`);
  });
}

testCifaSearch().catch(console.error);
