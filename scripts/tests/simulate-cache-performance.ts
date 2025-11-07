#!/usr/bin/env tsx
/**
 * Cache Hit Rate Simulation Test
 *
 * Simulates production cache behavior by making multiple identical requests
 * and measuring cache hit rates and performance improvements.
 *
 * Expected Results:
 * - Request 1: ~300-500ms (cache miss, database query)
 * - Requests 2-20: ~10-50ms (cache hit, from Redis)
 * - Cache hit rate: 95% (19/20 requests)
 * - Performance improvement: 5-10x faster for cached requests
 *
 * Usage:
 *   npx tsx scripts/tests/simulate-cache-performance.ts
 */

import { ConversationCache } from '@/lib/cache/conversation-cache';
import { getRedisClient } from '@/lib/redis';
import type { ConversationListFilters } from '@/lib/cache/conversation-cache';

interface TestResult {
  requestNumber: number;
  duration: number;
  cacheHit: boolean;
  timestamp: string;
}

async function testCacheHitRate(): Promise<void> {
  console.log('🔬 Cache Hit Rate Simulation Test');
  console.log('=====================================\n');

  const domainId = 'test-domain-' + Date.now();
  const filters: ConversationListFilters = { days: 7, limit: 20 };
  const totalRequests = 20;
  const results: TestResult[] = [];

  try {
    // Verify Redis connection
    const redis = getRedisClient();
    console.log('✅ Redis connection established\n');

    // Clear any existing cache for clean test
    console.log('🧹 Clearing existing cache...');
    await ConversationCache.invalidateConversation('*', domainId);
    console.log('✅ Cache cleared\n');

    console.log(`📊 Making ${totalRequests} identical requests...\n`);

    // Simulate mock data (what would come from database)
    const mockDatabaseData = {
      total: 150,
      change: 8,
      statusCounts: {
        active: 45,
        waiting: 30,
        resolved: 75
      },
      languages: [
        { language: 'en', count: 120, percentage: 80 },
        { language: 'es', count: 30, percentage: 20 }
      ],
      peakHours: [
        { hour: 9, label: '9 AM', level: 'high', count: 25 },
        { hour: 14, label: '2 PM', level: 'high', count: 30 }
      ],
      recent: [],
      pagination: {
        nextCursor: null,
        hasMore: false,
        limit: 20
      }
    };

    // Make requests and measure performance
    for (let i = 1; i <= totalRequests; i++) {
      const start = Date.now();

      // Try to get from cache
      const cached = await ConversationCache.getConversationsList(domainId, filters);

      if (!cached && i === 1) {
        // First request - simulate database fetch and cache storage
        const dbFetchStart = Date.now();

        // Simulate database query delay (100-200ms)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));

        const dbFetchTime = Date.now() - dbFetchStart;

        // Store in cache
        await ConversationCache.setConversationsList(domainId, filters, mockDatabaseData);

        const totalDuration = Date.now() - start;

        results.push({
          requestNumber: i,
          duration: totalDuration,
          cacheHit: false,
          timestamp: new Date().toISOString()
        });

        console.log(`Request ${i.toString().padStart(2, ' ')}: ${totalDuration.toString().padStart(4, ' ')}ms ❌ MISS (DB fetch: ${dbFetchTime}ms)`);
      } else if (cached) {
        // Cache hit - should be fast
        const duration = Date.now() - start;

        results.push({
          requestNumber: i,
          duration,
          cacheHit: true,
          timestamp: new Date().toISOString()
        });

        console.log(`Request ${i.toString().padStart(2, ' ')}: ${duration.toString().padStart(4, ' ')}ms ✅ HIT`);
      } else {
        // Unexpected: cache miss after first request
        console.log(`Request ${i.toString().padStart(2, ' ')}: ⚠️  UNEXPECTED MISS`);
      }

      // Small delay between requests to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate statistics
    const cacheMisses = results.filter(r => !r.cacheHit);
    const cacheHits = results.filter(r => r.cacheHit);

    const firstRequestTime = cacheMisses[0]?.duration || 0;
    const avgCacheHitTime = cacheHits.length > 0
      ? cacheHits.reduce((sum, r) => sum + r.duration, 0) / cacheHits.length
      : 0;

    const cacheHitRate = (cacheHits.length / totalRequests) * 100;
    const performanceImprovement = firstRequestTime > 0 && avgCacheHitTime > 0
      ? (firstRequestTime / avgCacheHitTime)
      : 0;

    // Print results
    console.log('\n📈 Results:');
    console.log('=====================================');
    console.log(`Total Requests:           ${totalRequests}`);
    console.log(`Cache Hits:               ${cacheHits.length} (${cacheHitRate.toFixed(1)}%)`);
    console.log(`Cache Misses:             ${cacheMisses.length}`);
    console.log('');
    console.log(`First Request (MISS):     ${firstRequestTime}ms`);
    console.log(`Avg Cached Request (HIT): ${avgCacheHitTime.toFixed(2)}ms`);
    console.log(`Min Cached Request:       ${Math.min(...cacheHits.map(r => r.duration))}ms`);
    console.log(`Max Cached Request:       ${Math.max(...cacheHits.map(r => r.duration))}ms`);
    console.log('');
    console.log(`Performance Improvement:  ${performanceImprovement.toFixed(1)}x faster`);
    console.log(`Time Saved:               ${((firstRequestTime - avgCacheHitTime) * cacheHits.length).toFixed(0)}ms total`);

    // Verify expectations
    console.log('\n✓ Verification:');
    console.log('=====================================');

    const expectations = [
      {
        name: 'Cache hit rate >= 90%',
        expected: true,
        actual: cacheHitRate >= 90,
        value: `${cacheHitRate.toFixed(1)}%`
      },
      {
        name: 'First request > 100ms',
        expected: true,
        actual: firstRequestTime > 100,
        value: `${firstRequestTime}ms`
      },
      {
        name: 'Avg cache hit < 100ms',
        expected: true,
        actual: avgCacheHitTime < 100,
        value: `${avgCacheHitTime.toFixed(2)}ms`
      },
      {
        name: 'Performance improvement > 2x',
        expected: true,
        actual: performanceImprovement > 2,
        value: `${performanceImprovement.toFixed(1)}x`
      }
    ];

    let allPassed = true;
    for (const expectation of expectations) {
      const status = expectation.actual === expectation.expected ? '✅' : '❌';
      console.log(`${status} ${expectation.name}: ${expectation.value}`);
      if (expectation.actual !== expectation.expected) {
        allPassed = false;
      }
    }

    // Check cache stats
    console.log('\n📊 Cache Statistics:');
    console.log('=====================================');
    const stats = await ConversationCache.getCacheStats(domainId);
    console.log(`Total cache keys:         ${stats.totalKeys}`);
    console.log(`List cache keys:          ${stats.listKeys}`);
    console.log(`Detail cache keys:        ${stats.detailKeys}`);
    console.log(`Analytics cache keys:     ${stats.analyticsKeys}`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await ConversationCache.clearDomainCache(domainId);
    console.log('✅ Cleanup complete');

    // Exit with appropriate code
    if (allPassed) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCacheHitRate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
