import { MockSupabaseClient, type MockQueryCall } from './mock-supabase-client';
import { simulateEnhancedSearch } from './simulation';

function groupQueriesByTable(calls: MockQueryCall[]) {
  return calls.reduce<Record<string, MockQueryCall[]>>((acc, call) => {
    const key = call.table === 'rpc' ? 'RPC Functions' : call.table;
    if (!acc[key]) acc[key] = [];
    acc[key].push(call);
    return acc;
  }, {});
}

function logQueryBreakdown(calls: MockQueryCall[]) {
  const grouped = groupQueriesByTable(calls);
  console.log('📊 QUERIES BY TABLE:');
  Object.entries(grouped).forEach(([table, tableCalls]) => {
    console.log(`   ${table}: ${tableCalls.length} queries`);
    tableCalls.forEach((call, idx) => {
      const filterText = call.filters ? ` [${call.filters.join(', ')}]` : '';
      console.log(`      ${idx + 1}. ${call.operation}${filterText}`);
    });
  });
  console.log();
}

function logEnhancementSummary(enhancementQueries: MockQueryCall[], results: any[]) {
  console.log('🎯 CRITICAL ENHANCEMENT QUERIES (product detail fetching):');
  console.log(`   Total: ${enhancementQueries.length} batched queries`);
  enhancementQueries.forEach((call, idx) => {
    console.log(`   ${idx + 1}. ${call.table}.${call.operation}()`);
  });
  console.log();

  const enhancedResults = results.filter((result: any) => result.enhanced);
  console.log('✨ ENHANCEMENT RESULTS:');
  console.log(`   Enhanced products: ${enhancedResults.length}/${results.length}`);
  console.log(`   Success rate: ${((enhancedResults.length / results.length) * 100).toFixed(1)}%`);
  console.log();
}

export async function runImprovedSearchVerification() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  IMPROVED SEARCH QUERY REDUCTION VERIFICATION TEST            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n📋 CLAIM TO VERIFY:');
  console.log('   "improved-search.ts reduces database queries from 200 to 2"');
  console.log('   for product enhancement with 10 product URLs\n');

  const mockClient = new MockSupabaseClient();
  const productUrls = Array.from({ length: 10 }, (_, i) => `https://example.com/product/item-${i + 1}`);

  console.log('🧪 TEST SETUP:');
  console.log(`   - Product URLs: ${productUrls.length}`);
  console.log('   - Mock client: Instrumented to count queries\n');

  const results = await simulateEnhancedSearch(mockClient, productUrls);
  const queryCalls = mockClient.getQueryCalls();

  console.log('\n' + '═'.repeat(65));
  console.log('📈 QUERY ANALYSIS RESULTS');
  console.log('═'.repeat(65) + '\n');

  logQueryBreakdown(queryCalls);

  const enhancementQueries = queryCalls.filter(
    call => (call.table === 'scraped_pages' || call.table === 'page_embeddings') && call.operation === 'in'
  );

  logEnhancementSummary(enhancementQueries, results);

  console.log('═'.repeat(65));
  console.log('🏁 VERIFICATION RESULTS');
  console.log('═'.repeat(65) + '\n');

  const EXPECTED_ENHANCEMENT_QUERIES = 2;
  const actualEnhancementQueries = enhancementQueries.length;
  const testPassed = actualEnhancementQueries === EXPECTED_ENHANCEMENT_QUERIES;

  console.log('📝 CLAIM: "Reduces queries from 200 to 2"');
  console.log(`   Expected enhancement queries: ${EXPECTED_ENHANCEMENT_QUERIES}`);
  console.log(`   Actual enhancement queries: ${actualEnhancementQueries}\n`);

  if (testPassed) {
    console.log('✅ TEST RESULT: PASS\n');
    console.log('🎉 VERIFICATION SUCCESSFUL!');
    console.log('   The improved-search.ts implementation uses two batched queries\n   regardless of product count.');
  } else {
    console.log('❌ TEST RESULT: FAIL\n');
    console.log('⚠️  VERIFICATION FAILED!');
    console.log(`   Expected ${EXPECTED_ENHANCEMENT_QUERIES} but observed ${actualEnhancementQueries} queries.`);
  }

  console.log('\n═'.repeat(65));
  console.log('📊 DETAILED BREAKDOWN');
  console.log('═'.repeat(65) + '\n');
  console.log('OLD APPROACH:');
  console.log('   - 2 queries per product (pages + embeddings)');
  console.log('   - 10 products → 20+ queries, potentially 100-200 with multiple chunks\n');
  console.log('NEW APPROACH:');
  console.log('   - Batch fetch all scraped_pages in one query');
  console.log('   - Batch fetch all page_embeddings in one query');
  console.log('   - Lookup maps provide O(1) access during enhancement');
  console.log('   - Total enhancement queries: 2\n');
  console.log('PERFORMANCE IMPROVEMENT:');
  console.log(`   - Query reduction: ${(20 / Math.max(actualEnhancementQueries, 1)).toFixed(0)}x minimum`);
  console.log(`   - Worst-case reduction: ${(200 / Math.max(actualEnhancementQueries, 1)).toFixed(0)}x`);
  console.log('   - Complexity: O(n²) → O(n)\n');

  process.exitCode = testPassed ? 0 : 1;
}
