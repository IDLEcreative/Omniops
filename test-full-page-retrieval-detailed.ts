/**
 * Detailed Full Page Retrieval Diagnostic
 *
 * Shows COMPLETE chunk content to verify what's actually being retrieved
 */

import { executeGetCompletePageDetails } from './lib/chat/tool-handlers';

async function runDetailedTest() {
  console.log('=== DETAILED FULL PAGE RETRIEVAL DIAGNOSTIC ===\n');

  const testQuery = '10mtr extension cables';
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

    console.log('=== COMPLETE CHUNK CONTENT ===\n');

    result.results.forEach((chunk, index) => {
      console.log(`--- CHUNK ${index + 1} of ${result.results.length} ---`);
      console.log(`URL: ${chunk.url}`);
      console.log(`Title: ${chunk.title}`);
      console.log(`Similarity: ${chunk.similarity}`);
      console.log(`Content Length: ${chunk.content.length} chars`);
      console.log(`\nContent:\n${chunk.content}`);
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Search for specific terms in all content
    const allContent = result.results.map(r => r.content).join('\n');

    console.log('=== SEARCH FOR SPECIFIC TERMS ===\n');

    const searchTerms = [
      '£',
      '25.98',
      '10M-CC',
      '20M-CC',
      'price',
      'SKU',
      'sku',
      'cost',
      'buy'
    ];

    searchTerms.forEach(term => {
      const found = allContent.includes(term);
      console.log(`${found ? '✅' : '❌'} "${term}": ${found ? 'FOUND' : 'NOT FOUND'}`);
    });

  } catch (error) {
    console.error('ERROR:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

runDetailedTest().catch(console.error);
