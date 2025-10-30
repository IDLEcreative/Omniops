import { executeSearchProducts, executeGetCompletePageDetails } from './lib/chat/tool-handlers';
import { getCommerceProvider } from './lib/agents/commerce-provider';
import { searchSimilarContent } from './lib/embeddings';

async function testComparisonScenario() {
  console.log('=== COMPARISON SCENARIO TEST ===\n');
  console.log('User Query: "Compare 10mtr vs 20mtr extension cables"\n');

  const domain = 'thompsonseparts.co.uk';
  const deps = {
    getCommerceProvider,
    searchSimilarContent
  };

  // PHASE 1: BREADTH - Get initial search results
  console.log('=== BREADTH PHASE: SEARCH ===');
  console.log('Calling: searchProducts("extension cables", 100, "thompsonseparts.co.uk")\n');

  const searchResults = await executeSearchProducts(
    'extension cables',
    100,
    domain,
    deps
  );

  const productCount = searchResults.results?.length || 0;
  console.log(`Search returned ${productCount} products\n`);

  // Check for 10mtr and 20mtr products
  const products = searchResults.results || [];
  const product10mtr = products.find((p: any) =>
    p.title?.toLowerCase().includes('10') &&
    (p.title?.toLowerCase().includes('mtr') || p.title?.toLowerCase().includes('meter') || p.title?.toLowerCase().includes('metre'))
  );
  const product20mtr = products.find((p: any) =>
    p.title?.toLowerCase().includes('20') &&
    (p.title?.toLowerCase().includes('mtr') || p.title?.toLowerCase().includes('meter') || p.title?.toLowerCase().includes('metre'))
  );

  console.log('✅/❌ Found 10mtr:', product10mtr ? '✅ YES' : '❌ NO');
  if (product10mtr) {
    console.log(`   - ${product10mtr.title}`);
    console.log(`   - URL: ${product10mtr.url}`);
  }

  console.log('\n✅/❌ Found 20mtr:', product20mtr ? '✅ YES' : '❌ NO');
  if (product20mtr) {
    console.log(`   - ${product20mtr.title}`);
    console.log(`   - URL: ${product20mtr.url}`);
  }

  console.log('\nAll extension cable products found:');
  products
    .filter((p: any) => p.title?.toLowerCase().includes('extension'))
    .slice(0, 10)
    .forEach((p: any) => {
      console.log(`  - ${p.title}`);
    });

  // PHASE 2: DEPTH - Get complete details for each product
  console.log('\n\n=== DEPTH PHASE: GET COMPLETE DETAILS ===\n');

  // Test 10mtr
  console.log('--- 10mtr Extension Cable ---');
  console.log('Calling: getCompletePageDetails("10mtr extension cable", "thompsonseparts.co.uk")\n');

  const details10mtr = await executeGetCompletePageDetails(
    '10mtr extension cable',
    domain
  );

  console.log('✅/❌ Full details retrieved:', details10mtr.success ? '✅ YES' : '❌ NO');
  if (details10mtr.pageInfo) {
    console.log(`Title: ${details10mtr.pageInfo.title || 'N/A'}`);
    console.log(`URL: ${details10mtr.pageInfo.url || 'N/A'}`);
    console.log(`Chunks returned: ${details10mtr.results.length}`);
    console.log(`Total content length: ${details10mtr.results.reduce((sum: number, r: any) => sum + (r.content?.length || 0), 0)} chars`);
  }

  // Test 20mtr
  console.log('\n--- 20mtr Extension Cable ---');
  console.log('Calling: getCompletePageDetails("20mtr extension cable", "thompsonseparts.co.uk")\n');

  const details20mtr = await executeGetCompletePageDetails(
    '20mtr extension cable',
    domain
  );

  console.log('✅/❌ Full details retrieved:', details20mtr.success ? '✅ YES' : '❌ NO');
  if (details20mtr.pageInfo) {
    console.log(`Title: ${details20mtr.pageInfo.title || 'N/A'}`);
    console.log(`URL: ${details20mtr.pageInfo.url || 'N/A'}`);
    console.log(`Chunks returned: ${details20mtr.results.length}`);
    console.log(`Total content length: ${details20mtr.results.reduce((sum: number, r: any) => sum + (r.content?.length || 0), 0)} chars`);
  }

  // PHASE 3: COMPARISON ANALYSIS
  console.log('\n\n=== COMPARISON CAPABILITY ANALYSIS ===\n');

  const has10mtrDetails = details10mtr.success && details10mtr.results.length > 0;
  const has20mtrDetails = details20mtr.success && details20mtr.results.length > 0;

  // Check if content mentions price
  const content10mtr = details10mtr.results.map((r: any) => r.content).join(' ').toLowerCase();
  const content20mtr = details20mtr.results.map((r: any) => r.content).join(' ').toLowerCase();

  const has10mtrPrice = content10mtr.includes('£') || content10mtr.includes('price') || /\d+\.\d{2}/.test(content10mtr);
  const has20mtrPrice = content20mtr.includes('£') || content20mtr.includes('price') || /\d+\.\d{2}/.test(content20mtr);

  const canComparePrices = has10mtrPrice && has20mtrPrice;
  const canCompareSpecs = has10mtrDetails && has20mtrDetails;
  const hasCompleteInfo = canComparePrices && canCompareSpecs;

  console.log('✅/❌ AI can compare prices:', canComparePrices ? '✅ YES' : '❌ NO');
  if (!canComparePrices) {
    console.log(`   - 10mtr has price: ${has10mtrPrice ? 'YES' : 'NO'}`);
    console.log(`   - 20mtr has price: ${has20mtrPrice ? 'YES' : 'NO'}`);
  }

  console.log('\n✅/❌ AI can compare specs:', canCompareSpecs ? '✅ YES' : '❌ NO');
  if (canCompareSpecs) {
    console.log(`   - 10mtr: ${details10mtr.results.length} chunks (${content10mtr.length} chars)`);
    console.log(`   - 20mtr: ${details20mtr.results.length} chunks (${content20mtr.length} chars)`);
  }

  console.log('\n✅/❌ AI can provide recommendation:', hasCompleteInfo ? '✅ YES' : '❌ NO');

  // Missing information analysis
  console.log('\n--- Missing Information ---');
  const missing: string[] = [];
  if (!product10mtr || !product20mtr) {
    missing.push('❌ Not both products found in search');
  }
  if (!has10mtrDetails || !has20mtrDetails) {
    missing.push('❌ Not both products have complete details');
  }
  if (!canComparePrices) {
    missing.push('❌ Price information incomplete');
  }

  if (missing.length === 0) {
    console.log('✅ No missing information - AI has everything needed for comparison!');
  } else {
    missing.forEach(m => console.log(m));
  }

  // VERDICT
  console.log('\n\n=== FINAL VERDICT ===\n');
  if (product10mtr && product20mtr && has10mtrDetails && has20mtrDetails && canComparePrices) {
    console.log('✅ SUCCESS: AI can provide a comprehensive comparison');
    console.log('   - Found both products in search (breadth)');
    console.log('   - Retrieved complete details for both (depth)');
    console.log('   - Has price information for both');
    console.log('   - Can provide informed recommendation');
  } else {
    console.log('❌ PARTIAL: AI has limited comparison capability');
    if (missing.length > 0) {
      console.log('   Issues:');
      missing.forEach(m => console.log(`     ${m}`));
    }
  }

  console.log('\n=== TEST COMPLETE ===');
}

testComparisonScenario().catch(console.error);
