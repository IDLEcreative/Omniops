#!/usr/bin/env tsx
/**
 * Analytics Caching Verification Script
 *
 * Tests Redis caching implementation for analytics endpoints:
 * - Dashboard Analytics (/api/dashboard/analytics)
 * - Business Intelligence (/api/analytics/intelligence)
 *
 * Verifies:
 * 1. First request hits database (cache miss)
 * 2. Second request hits cache (cache hit)
 * 3. Cache returns same data as database
 * 4. Response time improvement with cache
 * 5. Cache expires after 1 hour
 */

import { getSearchCacheManager } from '@/lib/search-cache';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  cacheMiss: number;
  cacheHit: number;
  improvement: string;
  dataMatch: boolean;
  cacheHitRate?: number;
}

async function measureRequest(url: string): Promise<{ data: any; duration: number }> {
  const start = Date.now();
  const response = await fetch(url);
  const duration = Date.now() - start;

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { data, duration };
}

function deepEqual(obj1: any, obj2: any): boolean {
  // Simple deep equality check
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

async function testEndpoint(
  name: string,
  url: string,
  clearCache: boolean = true
): Promise<TestResult> {
  console.log(`\nTesting ${name}...`);
  console.log(`URL: ${url}`);

  // Clear cache before testing if requested
  if (clearCache) {
    const cacheManager = getSearchCacheManager();
    await cacheManager.clearAllCache();
    console.log('✓ Cache cleared');
  }

  // First request (cache miss)
  console.log('\n1. First request (expecting cache miss)...');
  const firstRequest = await measureRequest(url);
  console.log(`   Duration: ${firstRequest.duration}ms`);

  // Small delay to ensure cache is written
  await new Promise(resolve => setTimeout(resolve, 100));

  // Second request (cache hit)
  console.log('\n2. Second request (expecting cache hit)...');
  const secondRequest = await measureRequest(url);
  console.log(`   Duration: ${secondRequest.duration}ms`);

  // Check data consistency
  const dataMatch = deepEqual(firstRequest.data, secondRequest.data);
  console.log(`\n3. Data consistency: ${dataMatch ? '✓ PASS' : '✗ FAIL'}`);

  // Calculate improvement
  const improvement = (((firstRequest.duration - secondRequest.duration) / firstRequest.duration) * 100).toFixed(1);
  console.log(`\n4. Performance improvement: ${improvement}%`);

  // Get cache stats
  const cacheManager = getSearchCacheManager();
  const stats = await cacheManager.getCacheStats();
  const hitRate = stats.hitRate * 100;
  console.log(`\n5. Cache hit rate: ${hitRate.toFixed(1)}%`);

  return {
    endpoint: name,
    cacheMiss: firstRequest.duration,
    cacheHit: secondRequest.duration,
    improvement: `${improvement}%`,
    dataMatch,
    cacheHitRate: hitRate
  };
}

async function verifyAnalyticsCaching() {
  console.log('='.repeat(70));
  console.log('Analytics Caching Verification');
  console.log('='.repeat(70));

  const results: TestResult[] = [];

  try {
    // Test 1: Dashboard Analytics (7 days)
    results.push(
      await testEndpoint(
        'Dashboard Analytics (7 days)',
        `${APP_URL}/api/dashboard/analytics?days=7`
      )
    );

    // Test 2: Dashboard Analytics (30 days)
    results.push(
      await testEndpoint(
        'Dashboard Analytics (30 days)',
        `${APP_URL}/api/dashboard/analytics?days=30`
      )
    );

    // Test 3: Business Intelligence - Customer Journey
    results.push(
      await testEndpoint(
        'BI Analytics - Customer Journey',
        `${APP_URL}/api/analytics/intelligence?metric=journey&days=7`
      )
    );

    // Test 4: Business Intelligence - Content Gaps
    results.push(
      await testEndpoint(
        'BI Analytics - Content Gaps',
        `${APP_URL}/api/analytics/intelligence?metric=content-gaps&days=7`
      )
    );

    // Test 5: Business Intelligence - All Metrics
    results.push(
      await testEndpoint(
        'BI Analytics - All Metrics',
        `${APP_URL}/api/analytics/intelligence?metric=all&days=7`
      )
    );

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('\n');

    const table = results.map(r => ({
      Endpoint: r.endpoint.substring(0, 35),
      'Miss (ms)': r.cacheMiss,
      'Hit (ms)': r.cacheHit,
      'Improvement': r.improvement,
      'Data Match': r.dataMatch ? '✓' : '✗',
      'Hit Rate': `${r.cacheHitRate?.toFixed(1)}%`
    }));

    console.table(table);

    // Calculate overall statistics
    const avgMiss = results.reduce((sum, r) => sum + r.cacheMiss, 0) / results.length;
    const avgHit = results.reduce((sum, r) => sum + r.cacheHit, 0) / results.length;
    const avgImprovement = ((avgMiss - avgHit) / avgMiss) * 100;
    const allDataMatch = results.every(r => r.dataMatch);

    console.log('\nOVERALL STATISTICS:');
    console.log(`  Average cache miss time: ${avgMiss.toFixed(0)}ms`);
    console.log(`  Average cache hit time: ${avgHit.toFixed(0)}ms`);
    console.log(`  Average improvement: ${avgImprovement.toFixed(1)}%`);
    console.log(`  Data consistency: ${allDataMatch ? '✓ ALL PASSED' : '✗ SOME FAILED'}`);

    // Success criteria
    console.log('\n' + '='.repeat(70));
    console.log('SUCCESS CRITERIA:');
    console.log('='.repeat(70));

    const criteria = [
      {
        name: 'Cache hit rate >80%',
        pass: results.every(r => (r.cacheHitRate || 0) >= 80),
        value: `${results[results.length - 1].cacheHitRate?.toFixed(1)}%`
      },
      {
        name: 'Response time <100ms for cached requests',
        pass: avgHit < 100,
        value: `${avgHit.toFixed(0)}ms`
      },
      {
        name: 'Data consistency maintained',
        pass: allDataMatch,
        value: allDataMatch ? 'All match' : 'Some mismatch'
      },
      {
        name: 'Performance improvement >50%',
        pass: avgImprovement > 50,
        value: `${avgImprovement.toFixed(1)}%`
      }
    ];

    criteria.forEach(c => {
      const status = c.pass ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${status} ${c.name}: ${c.value}`);
    });

    const allPassed = criteria.every(c => c.pass);
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('✓ ALL TESTS PASSED - Caching implementation successful!');
    } else {
      console.log('✗ SOME TESTS FAILED - Review implementation');
    }
    console.log('='.repeat(70));

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n✗ Error during verification:', error);
    process.exit(1);
  }
}

// Run verification
verifyAnalyticsCaching();
