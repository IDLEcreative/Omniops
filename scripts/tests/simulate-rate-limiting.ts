#!/usr/bin/env tsx
/**
 * Rate Limiting Simulation Test
 *
 * Simulates production rate limiting by making requests beyond the configured limits
 * and verifying that rate limits are enforced correctly.
 *
 * Expected Results:
 * - Requests 1-100: Success (200 OK)
 * - Requests 101-150: Rate limited (429 Too Many Requests)
 * - Headers include X-RateLimit-Remaining, X-RateLimit-Reset
 * - Retry-After header present on 429 responses
 *
 * Tests:
 * 1. Dashboard endpoint (100 req/min)
 * 2. Bulk actions endpoint (10 req/min)
 * 3. Analytics endpoint (30 req/min)
 * 4. Export endpoint (5 req/5min)
 *
 * Usage:
 *   npx tsx scripts/tests/simulate-rate-limiting.ts
 */

import {
  checkDashboardRateLimit,
  getRateLimitConfig,
  type DashboardEndpoint
} from '@/lib/middleware/dashboard-rate-limit';
import { getRedisClient } from '@/lib/redis';

interface RateLimitTestResult {
  endpoint: DashboardEndpoint;
  limit: number;
  successCount: number;
  rateLimitedCount: number;
  firstRateLimitAt: number;
  hasRetryAfterHeader: boolean;
  hasRateLimitHeaders: boolean;
}

async function testEndpointRateLimit(
  endpoint: DashboardEndpoint,
  userId: string,
  requestCount: number
): Promise<RateLimitTestResult> {
  const config = getRateLimitConfig(endpoint);
  let successCount = 0;
  let rateLimitedCount = 0;
  let firstRateLimitAt = -1;
  let hasRetryAfterHeader = false;
  let hasRateLimitHeaders = false;

  console.log(`\n📊 Testing ${endpoint} endpoint (${config.maxRequests} req/${config.windowMs / 1000}s)`);
  console.log('─'.repeat(60));

  for (let i = 1; i <= requestCount; i++) {
    const result = await checkDashboardRateLimit(userId, endpoint);

    if (result === null) {
      successCount++;
      if (i <= 10 || i % 20 === 0) {
        console.log(`Request ${i.toString().padStart(3, ' ')}: ✅ Allowed`);
      }
    } else {
      rateLimitedCount++;

      if (firstRateLimitAt === -1) {
        firstRateLimitAt = i;

        // Check headers on first rate limit response
        const headers = result.headers;
        hasRetryAfterHeader = headers.has('Retry-After');
        hasRateLimitHeaders =
          headers.has('X-RateLimit-Limit') &&
          headers.has('X-RateLimit-Remaining') &&
          headers.has('X-RateLimit-Reset');

        const body = await result.json();
        console.log(`Request ${i.toString().padStart(3, ' ')}: ⛔ Rate Limited`);
        console.log(`  Message: ${body.message}`);
        console.log(`  Retry After: ${headers.get('Retry-After')}s`);
        console.log(`  Rate Limit: ${headers.get('X-RateLimit-Limit')}`);
        console.log(`  Remaining: ${headers.get('X-RateLimit-Remaining')}`);
        console.log(`  Reset: ${headers.get('X-RateLimit-Reset')}`);
      } else if (i % 20 === 0) {
        console.log(`Request ${i.toString().padStart(3, ' ')}: ⛔ Rate Limited`);
      }
    }
  }

  return {
    endpoint,
    limit: config.maxRequests,
    successCount,
    rateLimitedCount,
    firstRateLimitAt,
    hasRetryAfterHeader,
    hasRateLimitHeaders
  };
}

async function clearRateLimitCache(userId: string, endpoint: DashboardEndpoint): Promise<void> {
  try {
    const redis = getRedisClient();
    const identifier = `dashboard:${endpoint}:${userId}`;

    // Try to delete the rate limit key
    if (typeof (redis as any).del === 'function') {
      await (redis as any).del(identifier);
    }
  } catch (error) {
    console.warn('Could not clear rate limit cache:', error);
  }
}

async function testRateLimiting(): Promise<void> {
  console.log('🔬 Rate Limiting Simulation Test');
  console.log('=====================================\n');

  const userId = 'test-user-' + Date.now();
  const results: RateLimitTestResult[] = [];

  try {
    // Verify Redis connection
    const redis = getRedisClient();
    console.log('✅ Redis connection established');

    // Test 1: Dashboard endpoint (100 req/min)
    console.log('\n🧪 Test 1: Dashboard Endpoint');
    await clearRateLimitCache(userId, 'dashboard');
    const dashboardResult = await testEndpointRateLimit('dashboard', userId, 150);
    results.push(dashboardResult);

    // Wait a moment before next test
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Bulk actions endpoint (10 req/min)
    console.log('\n🧪 Test 2: Bulk Actions Endpoint');
    await clearRateLimitCache(userId, 'bulkActions');
    const bulkResult = await testEndpointRateLimit('bulkActions', userId, 20);
    results.push(bulkResult);

    // Wait a moment before next test
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Analytics endpoint (30 req/min)
    console.log('\n🧪 Test 3: Analytics Endpoint');
    await clearRateLimitCache(userId, 'analytics');
    const analyticsResult = await testEndpointRateLimit('analytics', userId, 50);
    results.push(analyticsResult);

    // Wait a moment before next test
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Export endpoint (5 req/5min)
    console.log('\n🧪 Test 4: Export Endpoint');
    await clearRateLimitCache(userId, 'export');
    const exportResult = await testEndpointRateLimit('export', userId, 10);
    results.push(exportResult);

    // Print summary
    console.log('\n\n📈 Test Summary:');
    console.log('=====================================');

    for (const result of results) {
      console.log(`\n${result.endpoint.toUpperCase()}`);
      console.log(`  Limit:               ${result.limit} requests`);
      console.log(`  Successful:          ${result.successCount}`);
      console.log(`  Rate Limited:        ${result.rateLimitedCount}`);
      console.log(`  First Limited At:    Request #${result.firstRateLimitAt}`);
      console.log(`  Retry-After Header:  ${result.hasRetryAfterHeader ? '✅' : '❌'}`);
      console.log(`  Rate Limit Headers:  ${result.hasRateLimitHeaders ? '✅' : '❌'}`);
    }

    // Verification
    console.log('\n\n✓ Verification:');
    console.log('=====================================');

    const expectations = [];

    // Dashboard: 100 allowed, rest blocked
    expectations.push({
      name: 'Dashboard: 100 requests allowed',
      expected: 100,
      actual: results[0].successCount,
      passed: results[0].successCount === 100
    });

    // Bulk: 10 allowed, rest blocked
    expectations.push({
      name: 'Bulk Actions: 10 requests allowed',
      expected: 10,
      actual: results[1].successCount,
      passed: results[1].successCount === 10
    });

    // Analytics: 30 allowed, rest blocked
    expectations.push({
      name: 'Analytics: 30 requests allowed',
      expected: 30,
      actual: results[2].successCount,
      passed: results[2].successCount === 30
    });

    // Export: 5 allowed, rest blocked
    expectations.push({
      name: 'Export: 5 requests allowed',
      expected: 5,
      actual: results[3].successCount,
      passed: results[3].successCount === 5
    });

    // All should have proper headers
    for (const result of results) {
      expectations.push({
        name: `${result.endpoint}: Has retry headers`,
        expected: true,
        actual: result.hasRetryAfterHeader,
        passed: result.hasRetryAfterHeader
      });

      expectations.push({
        name: `${result.endpoint}: Has rate limit headers`,
        expected: true,
        actual: result.hasRateLimitHeaders,
        passed: result.hasRateLimitHeaders
      });
    }

    let allPassed = true;
    for (const expectation of expectations) {
      const status = expectation.passed ? '✅' : '❌';
      const expectedStr = typeof expectation.expected === 'boolean'
        ? (expectation.expected ? 'Yes' : 'No')
        : expectation.expected;
      const actualStr = typeof expectation.actual === 'boolean'
        ? (expectation.actual ? 'Yes' : 'No')
        : expectation.actual;

      console.log(`${status} ${expectation.name}`);
      if (!expectation.passed) {
        console.log(`   Expected: ${expectedStr}, Actual: ${actualStr}`);
        allPassed = false;
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    for (const result of results) {
      await clearRateLimitCache(userId, result.endpoint);
    }
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
  testRateLimiting().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
