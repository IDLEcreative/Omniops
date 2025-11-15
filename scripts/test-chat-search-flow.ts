/**
 * Test the EXACT search flow that the chatbot uses
 * This simulates what happens when AI calls search_products tool
 */

import { executeSearchProducts } from '../lib/chat/tool-handlers/search-products';
import { getCommerceProvider } from '../lib/agents/commerce-provider';
import { searchSimilarContent } from '../lib/embeddings';
import { sanitizeOutboundLinks } from '../lib/link-sanitizer';

async function testChatSearchFlow() {
  console.log('=== TESTING CHAT SEARCH FLOW ===');
  console.log('This simulates the exact flow when AI calls search_products\n');

  const testDomain = 'thompsonseparts.co.uk';
  const testQuery = 'pumps';

  // Test with the exact dependencies the chat route uses
  const deps = {
    getCommerceProvider,
    searchSimilarContent,
    sanitizeOutboundLinks
  };

  console.log(`Testing search for "${testQuery}" on domain "${testDomain}"\n`);

  try {
    const result = await executeSearchProducts(
      testQuery,
      100, // default limit
      testDomain,
      deps
    );

    console.log('\n=== SEARCH RESULT ===');
    console.log(`Success: ${result.success}`);
    console.log(`Source: ${result.source}`);
    console.log(`Results count: ${result.results.length}`);
    if (result.errorMessage) {
      console.log(`Error message: ${result.errorMessage}`);
    }

    if (result.results.length > 0) {
      console.log(`\nFirst 3 results:`);
      result.results.slice(0, 3).forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Similarity: ${r.similarity ? (r.similarity * 100).toFixed(1) + '%' : 'N/A'}`);
        console.log(`   Content preview: ${r.content.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ NO RESULTS RETURNED');
      console.log('This is the problem the chatbot is experiencing!');
    }

  } catch (error) {
    console.error('\n❌ ERROR IN SEARCH FLOW:');
    console.error(error);
  }
}

testChatSearchFlow().then(() => {
  console.log('\n=== TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
