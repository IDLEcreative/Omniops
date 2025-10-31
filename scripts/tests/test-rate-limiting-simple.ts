#!/usr/bin/env tsx
/**
 * Simple rate limiting test using /api/setup-rag endpoint
 *
 * Requirements:
 * 1. Dev server must be running (npm run dev)
 * 2. ENABLE_DEBUG_ENDPOINTS must be set (or NODE_ENV=development)
 *
 * Expected behavior:
 * - Requests 1-10: 200 OK
 * - Request 11+: 429 Too Many Requests
 *
 * Usage:
 *   npx tsx scripts/tests/test-rate-limiting-simple.ts
 */

const API_URL = 'http://localhost:3000';
const TEST_DOMAIN = 'test-rate-limit-domain.com';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting (Simple Test)\n');
  console.log('⚙️  Configuration:');
  console.log(`   - Endpoint: GET ${API_URL}/api/setup-rag`);
  console.log(`   - Limit: 10 requests per hour`);
  console.log(`   - Test domain: ${TEST_DOMAIN}\n`);

  const results: Array<{ request: number; status: number; rateLimited: boolean }> = [];

  // Make 12 requests to test the 10 req/hour limit
  for (let i = 1; i <= 12; i++) {
    try {
      const response = await fetch(`${API_URL}/api/setup-rag?domain=${TEST_DOMAIN}`);

      const rateLimited = response.status === 429;

      results.push({
        request: i,
        status: response.status,
        rateLimited
      });

      if (rateLimited) {
        const data = await response.json();
        console.log(`❌ Request ${i}: RATE LIMITED (429)`);
        console.log(`   Message: ${data.message || data.error}`);
      } else {
        console.log(`✅ Request ${i}: ${response.status}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`❌ Request ${i}: ERROR - ${error}`);
      results.push({ request: i, status: 0, rateLimited: false });
    }
  }

  // Analyze results
  console.log('\n📊 Test Results Summary\n');

  const rateLimitedCount = results.filter(r => r.rateLimited).length;
  const notRateLimitedCount = results.length - rateLimitedCount;

  console.log(`   Total requests: ${results.length}`);
  console.log(`   Not rate limited: ${notRateLimitedCount}`);
  console.log(`   Rate limited: ${rateLimitedCount}`);

  // Verify expectations
  console.log('\n🔍 Verification:\n');

  let allPassed = true;

  // First 10 requests should NOT be rate limited
  const first10 = results.slice(0, 10);
  const first10RateLimited = first10.filter(r => r.rateLimited).length;
  if (first10RateLimited === 0) {
    console.log(`   ✅ First 10 requests were NOT rate limited (0/10 rate limited)`);
  } else {
    console.log(`   ❌ FAIL: ${first10RateLimited}/10 of the first 10 requests were rate limited`);
    allPassed = false;
  }

  // Request 11+ should be rate limited
  const after10 = results.slice(10);
  const after10RateLimited = after10.filter(r => r.rateLimited).length;
  if (after10RateLimited === after10.length) {
    console.log(`   ✅ All requests after 10 were rate limited (${after10RateLimited}/${after10.length} rate limited)`);
  } else {
    console.log(`   ❌ FAIL: Only ${after10RateLimited}/${after10.length} requests after 10 were rate limited`);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ✅ ✅ All rate limiting tests PASSED ✅ ✅ ✅');
    console.log('\nRate limiting is working correctly!');
  } else {
    console.log('❌ Some rate limiting tests FAILED');
    process.exit(1);
  }

  console.log('\n💡 To test again, wait 1 hour or restart the dev server to clear rate limits\n');
}

// Check if dev server is running first
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/setup-rag?domain=health-check`, {
      signal: AbortSignal.timeout(2000)
    });
    return true;
  } catch {
    return false;
  }
}

// Run tests
(async () => {
  console.log('🔍 Checking if dev server is running...\n');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Dev server is not running on http://localhost:3000');
    console.error('   Please start it with: npm run dev\n');
    process.exit(1);
  }

  console.log('✅ Dev server is running\n');
  await testRateLimiting();
})().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
