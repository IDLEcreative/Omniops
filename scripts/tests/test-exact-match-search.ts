#!/usr/bin/env tsx

/**
 * Manual test script for exact-match SKU search
 *
 * Usage:
 *   npx tsx scripts/tests/test-exact-match-search.ts [SKU]
 *
 * Examples:
 *   npx tsx scripts/tests/test-exact-match-search.ts MU110667601
 *   npx tsx scripts/tests/test-exact-match-search.ts A4VTG90
 *   npx tsx scripts/tests/test-exact-match-search.ts "hydraulic pump"
 */

import {
  isSkuPattern,
  exactMatchSkuSearch,
  exactMatchProductCatalog,
  exactMatchSearch,
} from '@/lib/search/exact-match-search';

interface TestResult {
  query: string;
  isSkuPattern: boolean;
  catalogResults: number;
  contentResults: number;
  totalResults: number;
  latency: number;
  success: boolean;
  error?: string;
}

async function testExactMatchSearch(query: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing Exact-Match Search`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Query: "${query}"`);

    // Test 1: SKU Pattern Detection
    const isSku = isSkuPattern(query);
    console.log(`\n1. SKU Pattern Detection:`);
    console.log(`   - Is SKU Pattern: ${isSku ? '✅ YES' : '❌ NO'}`);

    if (!isSku) {
      console.log(`   - This query will skip exact-match and go directly to semantic search`);
    }

    // Test 2: Product Catalog Search
    console.log(`\n2. Product Catalog Search:`);
    const catalogStart = Date.now();
    const catalogResults = await exactMatchProductCatalog(query, null);
    const catalogTime = Date.now() - catalogStart;
    console.log(`   - Results: ${catalogResults.length}`);
    console.log(`   - Latency: ${catalogTime}ms`);

    if (catalogResults.length > 0) {
      console.log(`   - Sample Result:`);
      const sample = catalogResults[0];
      console.log(`     * Title: ${sample.title}`);
      console.log(`     * URL: ${sample.url}`);
      console.log(`     * Similarity: ${sample.similarity}`);
      console.log(`     * Method: ${sample.metadata?.searchMethod}`);
      console.log(`     * Content Preview: ${sample.content.substring(0, 150)}...`);
    }

    // Test 3: Scraped Content Search
    console.log(`\n3. Scraped Content Search:`);
    const contentStart = Date.now();
    const contentResults = await exactMatchSkuSearch(query, null, 10);
    const contentTime = Date.now() - contentStart;
    console.log(`   - Results: ${contentResults.length}`);
    console.log(`   - Latency: ${contentTime}ms`);

    if (contentResults.length > 0) {
      console.log(`   - Sample Result:`);
      const sample = contentResults[0];
      console.log(`     * Title: ${sample.title}`);
      console.log(`     * URL: ${sample.url}`);
      console.log(`     * Similarity: ${sample.similarity}`);
      console.log(`     * Method: ${sample.metadata?.searchMethod}`);
      console.log(`     * Content Preview: ${sample.content.substring(0, 150)}...`);
    }

    // Test 4: Combined Search
    console.log(`\n4. Combined Exact-Match Search:`);
    const combinedStart = Date.now();
    const combinedResults = await exactMatchSearch(query, null, 10);
    const combinedTime = Date.now() - combinedStart;
    console.log(`   - Total Results: ${combinedResults.length}`);
    console.log(`   - Latency: ${combinedTime}ms`);

    if (combinedResults.length > 0) {
      console.log(`   - All Results:`);
      combinedResults.forEach((result, idx) => {
        console.log(`     ${idx + 1}. ${result.title || 'Untitled'} (${result.metadata?.searchMethod})`);
        console.log(`        URL: ${result.url}`);
      });
    }

    const totalTime = Date.now() - startTime;

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Summary`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log(`SKU Pattern: ${isSku ? 'Yes' : 'No'}`);
    console.log(`Catalog Results: ${catalogResults.length}`);
    console.log(`Content Results: ${contentResults.length}`);
    console.log(`Total Results: ${combinedResults.length}`);
    console.log(`Total Latency: ${totalTime}ms`);
    console.log(`Status: ${combinedResults.length > 0 ? '✅ SUCCESS' : '⚠️  NO RESULTS'}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      query,
      isSkuPattern: isSku,
      catalogResults: catalogResults.length,
      contentResults: contentResults.length,
      totalResults: combinedResults.length,
      latency: totalTime,
      success: true,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Error during test:`, errorMsg);

    return {
      query,
      isSkuPattern: false,
      catalogResults: 0,
      contentResults: 0,
      totalResults: 0,
      latency: Date.now() - startTime,
      success: false,
      error: errorMsg,
    };
  }
}

async function main() {
  const query = process.argv[2];

  if (!query) {
    console.error('Usage: npx tsx scripts/tests/test-exact-match-search.ts [QUERY]');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/tests/test-exact-match-search.ts MU110667601');
    console.error('  npx tsx scripts/tests/test-exact-match-search.ts A4VTG90');
    console.error('  npx tsx scripts/tests/test-exact-match-search.ts "hydraulic pump"');
    process.exit(1);
  }

  // Run test
  const result = await testExactMatchSearch(query);

  // Exit with appropriate code
  if (!result.success) {
    process.exit(1);
  }

  if (result.totalResults === 0) {
    console.log('⚠️  Warning: No results found. This might be expected if database is empty.');
    process.exit(0);
  }

  console.log('✅ Test completed successfully!');
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testExactMatchSearch };
