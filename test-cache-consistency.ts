#!/usr/bin/env npx tsx

/**
 * Test Cache Consistency and Versioning
 * Verifies that cache versioning properly invalidates old entries
 */

import { getSearchCacheManager } from './lib/search-cache';
import { SEARCH_CACHE_VERSION } from './lib/cache-versioning';
import { searchSimilarContent } from './lib/embeddings';

async function testCacheConsistency() {
  console.log('=== Cache Consistency Test ===');
  console.log(`Current cache version: ${SEARCH_CACHE_VERSION}`);
  console.log('');

  const cacheManager = getSearchCacheManager();
  const testDomain = 'thompsonseparts.co.uk';
  const testQuery = 'Cifa';

  try {
    // Step 1: Get current cache statistics
    console.log('1. Current cache statistics:');
    const statsBefore = await cacheManager.getCacheStats();
    console.log(`   - Total cached entries: ${statsBefore.totalCached}`);
    console.log(`   - Versioned entries (v${SEARCH_CACHE_VERSION}): ${statsBefore.versionedEntries}`);
    console.log(`   - Legacy entries: ${statsBefore.legacyEntries}`);
    console.log(`   - Cache hit rate: ${statsBefore.hitRate.toFixed(2)}%`);
    console.log('');

    // Step 2: Clear old version caches
    console.log('2. Clearing old version caches...');
    await cacheManager.clearOldVersionCaches();
    console.log('');

    // Step 3: Check if query is cached
    console.log(`3. Checking if "${testQuery}" is cached...`);
    const cachedResult = await cacheManager.getCachedResult(testQuery, testDomain, 100);
    
    if (cachedResult) {
      console.log(`   ✓ Found cached result with ${cachedResult.chunks?.length || 0} items`);
      console.log(`   - Cached at: ${new Date(cachedResult.cachedAt).toISOString()}`);
      
      // Check if it's from current version by performing a fresh search
      console.log('');
      console.log('4. Verifying cache consistency with fresh search...');
      const freshResults = await searchSimilarContent(testQuery, testDomain, 100, 0.15);
      
      console.log(`   - Fresh search returned: ${freshResults.length} items`);
      console.log(`   - Cached result had: ${cachedResult.chunks?.length || 0} items`);
      
      if (freshResults.length !== (cachedResult.chunks?.length || 0)) {
        console.log('   ⚠️  INCONSISTENCY DETECTED - counts differ!');
        console.log('   This suggests old cache entries are being returned.');
        
        // Clear and re-cache
        console.log('');
        console.log('5. Invalidating and rebuilding cache...');
        await cacheManager.invalidateQuery(testQuery, testDomain, 100);
        
        // Perform search again to rebuild cache
        const rebuiltResults = await searchSimilarContent(testQuery, testDomain, 100, 0.15);
        console.log(`   ✓ Cache rebuilt with ${rebuiltResults.length} items`);
      } else {
        console.log('   ✓ Cache is consistent with fresh results');
      }
    } else {
      console.log('   - No cached result found');
      
      // Perform search to populate cache
      console.log('');
      console.log('4. Performing fresh search to populate cache...');
      const results = await searchSimilarContent(testQuery, testDomain, 100, 0.15);
      console.log(`   ✓ Search completed with ${results.length} results`);
      
      // Verify it was cached
      const newCachedResult = await cacheManager.getCachedResult(testQuery, testDomain, 100);
      if (newCachedResult) {
        console.log(`   ✓ Result successfully cached`);
      } else {
        console.log(`   ⚠️  Failed to cache result`);
      }
    }

    // Step 5: Final cache statistics
    console.log('');
    console.log('6. Final cache statistics:');
    const statsAfter = await cacheManager.getCacheStats();
    console.log(`   - Total cached entries: ${statsAfter.totalCached}`);
    console.log(`   - Versioned entries (v${SEARCH_CACHE_VERSION}): ${statsAfter.versionedEntries}`);
    console.log(`   - Legacy entries: ${statsAfter.legacyEntries}`);
    console.log(`   - Cache hit rate: ${statsAfter.hitRate.toFixed(2)}%`);

    // Step 6: Test multiple queries
    console.log('');
    console.log('7. Testing cache consistency for multiple queries...');
    const testQueries = ['hydraulic pump', 'valve', 'all Cifa'];
    
    for (const query of testQueries) {
      const cached = await cacheManager.getCachedResult(query, testDomain, 100);
      if (cached) {
        console.log(`   - "${query}": Cached with ${cached.chunks?.length || 0} items`);
      } else {
        console.log(`   - "${query}": Not cached`);
      }
    }

    console.log('');
    console.log('=== Cache Consistency Test Complete ===');
    
    // Exit cleanly
    const redis = (cacheManager as any).redis;
    if (redis && redis.quit) {
      await redis.quit();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cache consistency test:', error);
    process.exit(1);
  }
}

// Run the test
testCacheConsistency().catch(console.error);