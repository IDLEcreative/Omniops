#!/usr/bin/env tsx
/**
 * Unit Test for Analytics Caching
 *
 * Tests the caching logic directly without requiring a running server.
 * Verifies that the SearchCacheManager correctly stores and retrieves analytics data.
 */

import { getSearchCacheManager } from '@/lib/search-cache';

async function testCachingLogic() {
  console.log('Testing Analytics Caching Logic\n');
  console.log('='.repeat(70));

  const cacheManager = getSearchCacheManager();

  // Clear cache before testing
  await cacheManager.clearAllCache();
  console.log('✓ Cache cleared\n');

  // Test data
  const testAnalyticsData = {
    responseTime: 2.5,
    satisfactionScore: 4.2,
    resolutionRate: 87,
    topQueries: [
      { query: 'test query 1', count: 10, percentage: 25 },
      { query: 'test query 2', count: 8, percentage: 20 }
    ],
    metrics: {
      totalMessages: 100,
      userMessages: 60,
      avgMessagesPerDay: 14.3
    }
  };

  // Test 1: Store analytics data
  console.log('Test 1: Storing analytics data in cache...');
  const hourTimestamp = Math.floor(Date.now() / (60 * 60 * 1000));
  const cacheKey = `analytics:dashboard:7:${hourTimestamp}`;

  try {
    await cacheManager.cacheResult(cacheKey, {
      response: JSON.stringify(testAnalyticsData),
      chunks: [],
      metadata: {
        chunksRetrieved: 100,
        searchMethod: 'analytics-dashboard'
      }
    });
    console.log('✓ Data stored successfully\n');
  } catch (error) {
    console.error('✗ Failed to store data:', error);
    process.exit(1);
  }

  // Test 2: Retrieve analytics data
  console.log('Test 2: Retrieving analytics data from cache...');
  try {
    const cached = await cacheManager.getCachedResult(cacheKey);

    if (!cached) {
      console.error('✗ Cache returned null');
      process.exit(1);
    }

    if (!cached.response) {
      console.error('✗ Cache missing response field');
      process.exit(1);
    }

    const retrievedData = JSON.parse(cached.response);
    console.log('✓ Data retrieved successfully\n');

    // Test 3: Verify data integrity
    console.log('Test 3: Verifying data integrity...');
    const dataMatch = JSON.stringify(testAnalyticsData) === JSON.stringify(retrievedData);

    if (!dataMatch) {
      console.error('✗ Data mismatch!');
      console.error('Original:', testAnalyticsData);
      console.error('Retrieved:', retrievedData);
      process.exit(1);
    }

    console.log('✓ Data integrity verified\n');
  } catch (error) {
    console.error('✗ Failed to retrieve data:', error);
    process.exit(1);
  }

  // Test 4: Test BI analytics caching
  console.log('Test 4: Testing BI analytics caching...');
  const biTestData = {
    customerJourney: {
      conversionRate: 0.23,
      avgSessionsBeforeConversion: 3.5,
      stages: ['initial', 'product', 'checkout', 'purchase']
    }
  };

  const biCacheKey = `analytics:bi:all:journey:7:${hourTimestamp}`;

  try {
    await cacheManager.cacheResult(biCacheKey, {
      response: JSON.stringify(biTestData),
      chunks: [],
      metadata: {
        searchMethod: 'analytics-bi',
        sourcesUsed: ['journey']
      }
    });

    const cached = await cacheManager.getCachedResult(biCacheKey);
    if (!cached || !cached.response) {
      console.error('✗ BI cache failed');
      process.exit(1);
    }

    const retrievedBiData = JSON.parse(cached.response);
    const biDataMatch = JSON.stringify(biTestData) === JSON.stringify(retrievedBiData);

    if (!biDataMatch) {
      console.error('✗ BI data mismatch');
      process.exit(1);
    }

    console.log('✓ BI analytics caching verified\n');
  } catch (error) {
    console.error('✗ BI caching test failed:', error);
    process.exit(1);
  }

  // Test 5: Verify cache stats
  console.log('Test 5: Checking cache statistics...');
  try {
    const stats = await cacheManager.getCacheStats();

    console.log('Cache Statistics:');
    console.log(`  Total cached entries: ${stats.totalCached}`);
    console.log(`  Cache hits: ${stats.cacheHits}`);
    console.log(`  Cache misses: ${stats.cacheMisses}`);
    console.log(`  Cache writes: ${stats.cacheWrites}`);
    console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%\n`);

    if (stats.totalCached < 2) {
      console.error('✗ Expected at least 2 cached entries');
      process.exit(1);
    }

    console.log('✓ Cache statistics look good\n');
  } catch (error) {
    console.error('✗ Failed to get cache stats:', error);
    process.exit(1);
  }

  // Test 6: Test cache invalidation
  console.log('Test 6: Testing cache invalidation...');
  try {
    await cacheManager.clearAllCache();
    const statsAfterClear = await cacheManager.getCacheStats();

    if (statsAfterClear.totalCached !== 0) {
      console.error('✗ Cache not fully cleared');
      process.exit(1);
    }

    console.log('✓ Cache invalidation works\n');
  } catch (error) {
    console.error('✗ Cache invalidation failed:', error);
    process.exit(1);
  }

  // Success
  console.log('='.repeat(70));
  console.log('✓ ALL TESTS PASSED - Caching logic is working correctly!');
  console.log('='.repeat(70));
  console.log('\nNext steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Run integration test: npx tsx scripts/tests/verify-analytics-caching.ts');
}

// Run tests
testCachingLogic().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
