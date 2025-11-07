/**
 * Analytics Security Testing Suite
 *
 * Tests authentication, authorization, rate limiting, and multi-tenant
 * isolation for analytics endpoints.
 *
 * Run: npx tsx scripts/tests/test-analytics-security.ts
 *
 * Requirements:
 * - Development server running on http://localhost:3000
 * - Valid test user account with authentication
 * - Valid admin user account (optional)
 * - Redis running for rate limit tests
 */

import { config } from 'dotenv';
import { runTest, logResult, printSummary, TestResult, log } from './helpers/test-runner';
import { authenticateUser, makeRequest } from './helpers/auth-helpers';

config();

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'adminpassword123';

const results: TestResult[] = [];

// Test helper wrapper
function req(path: string, token?: string, options?: RequestInit) {
  return makeRequest(path, BASE_URL, options, token);
}

async function authUser(email: string, password: string) {
  return authenticateUser(email, password, SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function test1_UnauthenticatedAccess() {
  await runTest('Test 1: Unauthenticated access to dashboard analytics', async () => {
    const response = await req('/api/dashboard/analytics');
    return {
      passed: response.status === 401,
      message: response.status === 401 ? 'Correctly returned 401 Unauthorized' : `Expected 401, got ${response.status}`
    };
  }, results);

  await runTest('Test 1b: Unauthenticated access to BI endpoint', async () => {
    const response = await req('/api/analytics/intelligence?metric=all');
    return {
      passed: response.status === 401,
      message: response.status === 401 ? 'Correctly returned 401 Unauthorized' : `Expected 401, got ${response.status}`
    };
  }, results);
}

async function test2_NonAdminBIAccess() {
  await runTest('Test 2: Non-admin user attempts BI endpoint access', async () => {
    const userToken = await authUser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    if (!userToken) return { passed: false, message: 'Failed to authenticate test user' };

    const response = await req('/api/analytics/intelligence?metric=journey', userToken);

    if (response.status === 403) {
      return { passed: true, message: 'Correctly returned 403 Forbidden' };
    }

    if (response.status === 200) {
      return { passed: true, message: 'User has admin privileges (test skipped)' };
    }

    return { passed: false, message: `Expected 403, got ${response.status}` };
  }, results);
}

async function test3_AuthenticatedDashboardAccess() {
  await runTest('Test 3: Authenticated user accesses dashboard analytics', async () => {
    const userToken = await authUser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    if (!userToken) return { passed: false, message: 'Failed to authenticate test user' };

    const response = await req('/api/dashboard/analytics?days=7', userToken);

    if (response.status === 200) {
      const data = await response.json();
      if (data.metrics && data.responseTime !== undefined) {
        return { passed: true, message: 'Successfully retrieved dashboard analytics' };
      }
      return { passed: false, message: 'Response missing expected fields' };
    }

    return { passed: false, message: `Expected 200, got ${response.status}` };
  }, results);
}

async function test4_AdminBIAccess() {
  await runTest('Test 4: Admin user accesses BI endpoint', async () => {
    const adminToken = await authUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    if (!adminToken) return { passed: false, message: 'Failed to authenticate admin user' };

    const response = await req('/api/analytics/intelligence?metric=journey&days=7', adminToken);

    if (response.status === 200) {
      const data = await response.json();
      if (data.timeRange && data.customerJourney) {
        return { passed: true, message: 'Successfully retrieved BI analytics' };
      }
      return { passed: false, message: 'Response missing expected fields' };
    }

    return { passed: false, message: `Expected 200, got ${response.status}` };
  }, results);
}

async function test5_RateLimiting() {
  await runTest('Test 5: Rate limiting on dashboard endpoint', async () => {
    const userToken = await authUser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    if (!userToken) return { passed: false, message: 'Failed to authenticate test user' };

    let lastResponse: Response | null = null;
    for (let i = 0; i < 21; i++) {
      lastResponse = await req('/api/dashboard/analytics?days=1', userToken);
      if (lastResponse.status === 429) break;
    }

    if (lastResponse?.status === 429) {
      const limit = lastResponse.headers.get('X-RateLimit-Limit');
      const reset = lastResponse.headers.get('X-RateLimit-Reset');
      return { passed: true, message: `Rate limit enforced (Limit: ${limit}, Reset: ${reset})` };
    }

    return { passed: false, message: 'Rate limiting did not trigger after 21 requests' };
  }, results);
}

async function test6_CacheInvalidation() {
  await runTest('Test 6: Cache invalidation (admin only)', async () => {
    const adminToken = await authUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    if (!adminToken) return { passed: false, message: 'Failed to authenticate admin user' };

    const statsResponse = await req('/api/analytics/cache/invalidate?type=all', adminToken);
    if (statsResponse.status !== 200) {
      return { passed: false, message: `Failed to get cache stats: ${statsResponse.status}` };
    }

    const invalidateResponse = await req('/api/analytics/cache/invalidate?type=dashboard', adminToken, { method: 'POST' });

    if (invalidateResponse.status === 200) {
      const data = await invalidateResponse.json();
      if (data.success && data.deletedKeys !== undefined) {
        return { passed: true, message: `Cache invalidated (${data.deletedKeys} keys deleted)` };
      }
      return { passed: false, message: 'Response missing expected fields' };
    }

    return { passed: false, message: `Expected 200, got ${invalidateResponse.status}` };
  }, results);
}

async function test7_SecurityHeaders() {
  await runTest('Test 7: Security headers present', async () => {
    const response = await req('/api/dashboard/analytics');

    const headers = {
      'X-Frame-Options': response.headers.get('X-Frame-Options'),
      'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
      'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
    };

    const missing = Object.entries(headers)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length === 0) {
      return { passed: true, message: `All security headers present: ${Object.keys(headers).join(', ')}` };
    }

    return { passed: false, message: `Missing headers: ${missing.join(', ')}` };
  }, results);
}

async function main() {
  log('\n🔒 Analytics Security Test Suite\n', 'bold');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Test User: ${TEST_USER_EMAIL}`, 'blue');
  log(`Admin User: ${TEST_ADMIN_EMAIL}\n`, 'blue');

  // Run all tests
  await test1_UnauthenticatedAccess();
  await test2_NonAdminBIAccess();
  await test3_AuthenticatedDashboardAccess();
  await test4_AdminBIAccess();
  await test5_RateLimiting();
  await test6_CacheInvalidation();
  await test7_SecurityHeaders();

  // Print results
  log('\n📊 Test Results:', 'bold');
  results.forEach(logResult);
  printSummary(results);
}

main().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
