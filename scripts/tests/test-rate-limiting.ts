#!/usr/bin/env tsx
/**
 * Test script for rate limiting on expensive operations
 *
 * Requirements:
 * 1. Dev server must be running (npm run dev)
 * 2. Tests POST /api/scrape endpoint
 * 3. Verifies 10 req/hour limit
 *
 * Expected behavior:
 * - Requests 1-10: 200 OK (or 400 if invalid payload, but not rate limited)
 * - Request 11+: 429 Too Many Requests
 *
 * Usage:
 *   npx tsx scripts/tests/test-rate-limiting.ts
 */

const API_URL = 'http://localhost:3000';
const TEST_DOMAIN = 'test-rate-limit-domain.com';
const TEST_URL = `https://${TEST_DOMAIN}/test`;

interface RateLimitResponse {
  error?: string;
  message?: string;
  resetTime?: string;
  remaining?: number;
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting on Expensive Operations\n');
  console.log('⚙️  Configuration:');
  console.log(`   - Endpoint: POST ${API_URL}/api/scrape`);
  console.log(`   - Limit: 10 requests per hour`);
  console.log(`   - Test domain: ${TEST_DOMAIN}\n`);

  const results: Array<{ request: number; status: number; rateLimited: boolean; remaining?: number }> = [];

  // Make 12 requests to test the 10 req/hour limit
  for (let i = 1; i <= 12; i++) {
    try {
      const response = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token would be needed in production, but we're testing rate limiting specifically
        },
        body: JSON.stringify({
          url: TEST_URL,
          crawl: false
        })
      });

      const rateLimited = response.status === 429;
      const remaining = response.headers.get('X-RateLimit-Remaining');

      results.push({
        request: i,
        status: response.status,
        rateLimited,
        remaining: remaining ? parseInt(remaining) : undefined
      });

      if (rateLimited) {
        const data: RateLimitResponse = await response.json();
        console.log(`❌ Request ${i}: RATE LIMITED (429)`);
        console.log(`   Message: ${data.message}`);
        console.log(`   Reset at: ${data.resetTime}`);
        console.log(`   Remaining: ${data.remaining}`);
      } else {
        console.log(`✅ Request ${i}: ${response.status} (Remaining: ${remaining ?? 'N/A'})`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Request ${i}: ERROR - ${error}`);
      results.push({ request: i, status: 0, rateLimited: false });
    }
  }

  // Analyze results
  console.log('\n📊 Test Results Summary\n');

  const rateLimitedRequests = results.filter(r => r.rateLimited);
  const successfulRequests = results.filter(r => !r.rateLimited && r.status >= 200 && r.status < 500);

  console.log(`   Total requests: ${results.length}`);
  console.log(`   Not rate limited: ${results.length - rateLimitedRequests.length}`);
  console.log(`   Rate limited: ${rateLimitedRequests.length}`);

  // Verify expectations
  console.log('\n🔍 Verification:\n');

  let allPassed = true;

  // First 10 requests should NOT be rate limited
  const first10RateLimited = results.slice(0, 10).some(r => r.rateLimited);
  if (!first10RateLimited) {
    console.log('   ✅ First 10 requests were NOT rate limited');
  } else {
    console.log('   ❌ FAIL: Some of the first 10 requests were rate limited');
    allPassed = false;
  }

  // Request 11+ should be rate limited
  const after10NotRateLimited = results.slice(10).some(r => !r.rateLimited);
  if (!after10NotRateLimited) {
    console.log('   ✅ Requests 11+ were rate limited');
  } else {
    console.log('   ❌ FAIL: Some requests after 10 were NOT rate limited');
    allPassed = false;
  }

  // Check rate limit headers
  const hasRateLimitHeaders = results.some(r => r.remaining !== undefined);
  if (hasRateLimitHeaders) {
    console.log('   ✅ Rate limit headers are present');
  } else {
    console.log('   ⚠️  WARNING: Rate limit headers not found (may need CSRF protection bypass)');
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All rate limiting tests PASSED');
  } else {
    console.log('❌ Some rate limiting tests FAILED');
    process.exit(1);
  }

  console.log('\n💡 To test again, wait 1 hour or restart the dev server to clear rate limits\n');
}

// Run tests
testRateLimiting().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
