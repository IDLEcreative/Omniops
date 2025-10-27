/**
 * Test Full Page Retrieval with Exact 10mtr Product
 *
 * This tests the function with a more specific query to get the actual 10mtr product
 */

import { executeGetCompletePageDetails } from './lib/chat/tool-handlers';

async function testExactProduct() {
  console.log('=== TEST FULL PAGE RETRIEVAL - 10MTR PRODUCT ===\n');

  // Test with more specific query to get 10mtr
  const testQuery = '10mtr extension cables TS Camera 10M-CC';
  const testDomain = 'thompsonseparts.co.uk';

  console.log(`Query: "${testQuery}"`);
  console.log(`Domain: ${testDomain}\n`);

  try {
    const result = await executeGetCompletePageDetails(testQuery, testDomain);

    if (!result.success || result.results.length === 0) {
      console.log('❌ NO RESULTS RETURNED');
      return;
    }

    console.log(`✅ SUCCESS: ${result.results.length} chunks retrieved`);
    console.log(`Source: ${result.source}`);
    console.log(`Page URL: ${result.results[0].url}`);
    console.log(`Page Title: ${result.pageInfo?.title || result.results[0].title}\n`);

    // Check if this is the correct product
    const allContent = result.results.map(r => r.content).join('\n');
    const is10mtr = allContent.includes('10mtr') || allContent.includes('10M-CC') || allContent.includes('10 metre');
    const is20mtr = allContent.includes('20mtr') || allContent.includes('20M-CC');

    console.log('=== PRODUCT VERIFICATION ===\n');
    console.log(`Is 10mtr product: ${is10mtr ? '✅ YES' : '❌ NO'}`);
    console.log(`Is 20mtr product: ${is20mtr ? '✅ YES' : '❌ NO'}\n`);

    // Show all chunks
    console.log('=== CHUNKS ===\n');
    result.results.forEach((chunk, index) => {
      console.log(`--- CHUNK ${index + 1} ---`);
      console.log(chunk.content);
      console.log('\n');
    });

    // Extract key info
    console.log('=== EXTRACTED INFO ===\n');

    // Extract price
    const priceMatch = allContent.match(/£(\d+\.?\d*)/);
    console.log(`Price: ${priceMatch ? priceMatch[0] : 'NOT FOUND'}`);

    // Extract SKU
    const skuMatch = allContent.match(/SKU:\s*(\S+)/);
    console.log(`SKU: ${skuMatch ? skuMatch[1] : 'NOT FOUND'}`);

    // Check availability
    const inStock = !allContent.toLowerCase().includes('out of stock');
    console.log(`Availability: ${inStock ? 'In Stock' : 'Out of Stock'}\n`);

    // Token count
    const totalChars = result.results.reduce((sum, r) => sum + r.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    console.log(`Total Characters: ${totalChars}`);
    console.log(`Estimated Tokens: ${estimatedTokens}\n`);

    // Final verification
    console.log('=== FUNCTION VERIFICATION ===\n');
    console.log(`✅ Returns full page: ${result.results.length > 1 ? 'YES' : 'NO'}`);
    console.log(`✅ All chunks same URL: ${[...new Set(result.results.map(r => r.url))].length === 1 ? 'YES' : 'NO'}`);
    console.log(`✅ Source is 'full-page': ${result.source === 'full-page' ? 'YES' : 'NO'}`);
    console.log(`✅ Page info present: ${result.pageInfo ? 'YES' : 'NO'}`);
    console.log(`✅ Contains product info: ${priceMatch && skuMatch ? 'YES' : 'NO'}\n`);

  } catch (error) {
    console.error('ERROR:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

testExactProduct().catch(console.error);
