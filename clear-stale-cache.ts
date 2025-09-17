#!/usr/bin/env npx tsx

/**
 * Clear Stale Cache Entries
 * Removes old version caches and ensures consistency
 */

import { getSearchCacheManager } from './lib/search-cache';
import { SEARCH_CACHE_VERSION } from './lib/cache-versioning';

async function clearStaleCache() {
  console.log('=== Clearing Stale Cache Entries ===');
  console.log(`Current cache version: ${SEARCH_CACHE_VERSION}`);
  console.log('');

  const cacheManager = getSearchCacheManager();

  try {
    // Step 1: Get current cache statistics
    console.log('1. Current cache state:');
    const statsBefore = await cacheManager.getCacheStats();
    console.log(`   - Total cached entries: ${statsBefore.totalCached}`);
    console.log(`   - Current version (v${SEARCH_CACHE_VERSION}): ${statsBefore.versionedEntries} entries`);
    console.log(`   - Legacy/unversioned: ${statsBefore.legacyEntries} entries`);
    console.log(`   - Cache metrics:`);
    console.log(`     • Hits: ${statsBefore.cacheHits}`);
    console.log(`     • Misses: ${statsBefore.cacheMisses}`);
    console.log(`     • Hit rate: ${statsBefore.hitRate.toFixed(2)}%`);
    console.log('');

    // Step 2: Clear old version caches
    console.log('2. Clearing old version caches...');
    await cacheManager.clearOldVersionCaches();
    console.log('');

    // Step 3: Clear specific problematic queries if needed
    const problematicQueries = [
      { query: 'Cifa', domain: 'thompsonseparts.co.uk' },
      { query: 'all Cifa', domain: 'thompsonseparts.co.uk' },
      { query: 'Cifa products', domain: 'thompsonseparts.co.uk' }
    ];

    console.log('3. Invalidating specific problematic queries...');
    for (const { query, domain } of problematicQueries) {
      await cacheManager.invalidateQuery(query, domain, 100);
      console.log(`   ✓ Invalidated: "${query}" for ${domain}`);
    }
    console.log('');

    // Step 4: Optional - Clear ALL cache (use with caution)
    const clearAll = process.argv.includes('--clear-all');
    if (clearAll) {
      console.log('4. Clearing ALL cache entries (--clear-all flag detected)...');
      await cacheManager.clearAllCache();
      console.log('   ✓ All cache entries cleared');
      console.log('');
    }

    // Step 5: Get final cache statistics
    console.log('5. Final cache state:');
    const statsAfter = await cacheManager.getCacheStats();
    console.log(`   - Total cached entries: ${statsAfter.totalCached}`);
    console.log(`   - Current version (v${SEARCH_CACHE_VERSION}): ${statsAfter.versionedEntries} entries`);
    console.log(`   - Legacy/unversioned: ${statsAfter.legacyEntries} entries`);
    console.log('');

    console.log('=== Cache Cleanup Complete ===');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test searches to verify they return correct results');
    console.log('2. Monitor cache hit rate to ensure caching is working');
    console.log('3. Run cache warmer if needed to pre-populate common queries');

    // Exit cleanly
    const redis = (cacheManager as any).redis;
    if (redis && redis.quit) {
      await redis.quit();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cache cleanup:', error);
    process.exit(1);
  }
}

// Show usage
if (process.argv.includes('--help')) {
  console.log('Usage: npx tsx clear-stale-cache.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --clear-all    Clear ALL cache entries (use with caution)');
  console.log('  --help         Show this help message');
  process.exit(0);
}

// Run the cleanup
clearStaleCache().catch(console.error);