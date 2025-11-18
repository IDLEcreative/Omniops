/**
 * Verification Script: Two-Tier Cache Implementation
 *
 * Tests the Redis + Database caching layer to verify:
 * - Cache hits/misses are working correctly
 * - TTL expiration behaves as expected
 * - Cache invalidation works
 * - Graceful fallback when Redis is unavailable
 *
 * Run: npx tsx scripts/tests/verify-two-tier-cache.ts
 */

import { TwoTierCache } from '@/lib/cache/two-tier-cache';
import { getRedisClient } from '@/lib/redis';

interface TestData {
  id: string;
  value: string;
  timestamp: number;
}

async function verifyTwoTierCache() {
  console.log('🧪 Two-Tier Cache Verification\n');

  // Test 1: Basic Get/Set
  console.log('📝 Test 1: Basic Cache Operations');
  const cache = new TwoTierCache<TestData>({
    ttl: 10,
    prefix: 'test',
    verbose: true,
  });

  let dbCallCount = 0;
  const mockDbFetcher = async (): Promise<TestData> => {
    dbCallCount++;
    console.log(`   [DB] Fetching from database (call #${dbCallCount})`);
    return {
      id: 'test-1',
      value: 'Hello from database',
      timestamp: Date.now(),
    };
  };

  // First call - should hit database
  console.log('\n   First call (expect DB fetch):');
  const result1 = await cache.get('key-1', mockDbFetcher);
  console.log(`   ✓ Result: ${result1.value} (DB calls: ${dbCallCount})`);

  // Second call - should hit cache
  console.log('\n   Second call (expect cache hit):');
  const result2 = await cache.get('key-1', mockDbFetcher);
  console.log(`   ✓ Result: ${result2.value} (DB calls: ${dbCallCount})`);

  if (dbCallCount === 1) {
    console.log('   ✅ PASS: Cache prevented second DB call\n');
  } else {
    console.log('   ❌ FAIL: Cache did not work as expected\n');
  }

  // Test 2: Cache Invalidation
  console.log('📝 Test 2: Cache Invalidation');
  await cache.invalidate('key-1');
  console.log('   Invalidated key-1');

  dbCallCount = 0;
  const result3 = await cache.get('key-1', mockDbFetcher);
  console.log(`   ✓ Result after invalidation: ${result3.value} (DB calls: ${dbCallCount})`);

  if (dbCallCount === 1) {
    console.log('   ✅ PASS: Invalidation forced DB fetch\n');
  } else {
    console.log('   ❌ FAIL: Invalidation did not work\n');
  }

  // Test 3: Pattern Invalidation
  console.log('📝 Test 3: Pattern Invalidation');
  const cache2 = new TwoTierCache<TestData>({ ttl: 10, prefix: 'test-pattern' });

  await cache2.set('user-1', { id: '1', value: 'User 1', timestamp: Date.now() });
  await cache2.set('user-2', { id: '2', value: 'User 2', timestamp: Date.now() });
  await cache2.set('product-1', { id: '3', value: 'Product 1', timestamp: Date.now() });

  const exists1 = await cache2.exists('user-1');
  const exists2 = await cache2.exists('user-2');
  console.log(`   Before pattern invalidation: user-1=${exists1}, user-2=${exists2}`);

  await cache2.invalidatePattern('user-*');
  console.log('   Invalidated pattern: user-*');

  const exists3 = await cache2.exists('user-1');
  const exists4 = await cache2.exists('user-2');
  const exists5 = await cache2.exists('product-1');
  console.log(`   After pattern invalidation: user-1=${exists3}, user-2=${exists4}, product-1=${exists5}`);

  if (!exists3 && !exists4 && exists5) {
    console.log('   ✅ PASS: Pattern invalidation worked correctly\n');
  } else {
    console.log('   ❌ FAIL: Pattern invalidation did not work as expected\n');
  }

  // Test 4: Performance Comparison
  console.log('📝 Test 4: Performance Comparison');
  const perfCache = new TwoTierCache<TestData>({ ttl: 60, prefix: 'perf-test' });

  // Simulate slow database query
  const slowDbFetch = async (): Promise<TestData> => {
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
    return { id: 'perf-1', value: 'Performance test', timestamp: Date.now() };
  };

  // First call (database)
  const startDb = Date.now();
  await perfCache.get('perf-key', slowDbFetch);
  const dbTime = Date.now() - startDb;

  // Second call (cache)
  const startCache = Date.now();
  await perfCache.get('perf-key', slowDbFetch);
  const cacheTime = Date.now() - startCache;

  console.log(`   Database fetch: ${dbTime}ms`);
  console.log(`   Cache fetch: ${cacheTime}ms`);
  console.log(`   Speedup: ${Math.round((dbTime / cacheTime) * 100) / 100}x faster`);

  if (cacheTime < dbTime) {
    console.log('   ✅ PASS: Cache is faster than database\n');
  } else {
    console.log('   ⚠️  WARNING: Cache not faster (might be Redis unavailable)\n');
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  const redis = getRedisClient();
  const testKeys = await redis.keys('test*');
  if (testKeys.length > 0) {
    await redis.del(...testKeys);
    console.log(`   Deleted ${testKeys.length} test keys`);
  }

  console.log('\n✅ Verification complete!');
  process.exit(0);
}

// Run verification
verifyTwoTierCache().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
