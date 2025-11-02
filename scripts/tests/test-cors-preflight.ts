#!/usr/bin/env node

/**
 * Test CORS Preflight for Widget Embedding
 *
 * This script verifies that the API endpoints return proper CORS headers
 * for preflight OPTIONS requests from external domains.
 *
 * Run: npx tsx scripts/tests/test-cors-preflight.ts
 */

const TEST_ORIGIN = 'https://epartstaging.wpengine.com';
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  passed: boolean;
  error?: string;
  headers?: Record<string, string>;
}

async function testPreflightRequest(endpoint: string): Promise<TestResult> {
  const url = `${API_URL}${endpoint}`;

  console.log(`\n🔍 Testing: ${endpoint}`);
  console.log(`   Origin: ${TEST_ORIGIN}`);

  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': TEST_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control')) {
        headers[key] = value;
      }
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, headers);

    // Check required CORS headers
    const hasOrigin = headers['access-control-allow-origin'];
    const hasMethods = headers['access-control-allow-methods'];
    const hasHeaders = headers['access-control-allow-headers'];

    if (response.status !== 204 && response.status !== 200) {
      return {
        endpoint,
        passed: false,
        error: `Expected status 200/204, got ${response.status}`,
        headers,
      };
    }

    if (!hasOrigin) {
      return {
        endpoint,
        passed: false,
        error: 'Missing Access-Control-Allow-Origin header',
        headers,
      };
    }

    if (!hasMethods || !hasMethods.includes('POST')) {
      return {
        endpoint,
        passed: false,
        error: 'Missing or invalid Access-Control-Allow-Methods header',
        headers,
      };
    }

    if (!hasHeaders) {
      return {
        endpoint,
        passed: false,
        error: 'Missing Access-Control-Allow-Headers header',
        headers,
      };
    }

    console.log(`   ✅ PASSED`);
    return { endpoint, passed: true, headers };

  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    return {
      endpoint,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testActualRequest(endpoint: string): Promise<TestResult> {
  const url = `${API_URL}${endpoint}`;

  console.log(`\n🔍 Testing actual POST: ${endpoint}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Origin': TEST_ORIGIN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message',
        domain: 'test.com',
        session_id: 'test-session',
      }),
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control')) {
        headers[key] = value;
      }
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`, headers);

    const hasOrigin = headers['access-control-allow-origin'];

    if (!hasOrigin) {
      return {
        endpoint,
        passed: false,
        error: 'Missing Access-Control-Allow-Origin header on actual request',
        headers,
      };
    }

    console.log(`   ✅ PASSED`);
    return { endpoint, passed: true, headers };

  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    return {
      endpoint,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('=================================================');
  console.log('🧪 CORS Preflight Test');
  console.log('=================================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Origin: ${TEST_ORIGIN}`);
  console.log('=================================================\n');

  const endpoints = ['/api/chat', '/api/widget/config', '/api/scrape/status'];
  const results: TestResult[] = [];

  // Test preflight requests
  console.log('\n📋 Testing OPTIONS (Preflight) Requests\n');
  for (const endpoint of endpoints) {
    const result = await testPreflightRequest(endpoint);
    results.push(result);
  }

  // Test actual requests
  console.log('\n\n📋 Testing Actual POST Requests\n');
  const actualResult = await testActualRequest('/api/chat');
  results.push(actualResult);

  // Summary
  console.log('\n\n=================================================');
  console.log('📊 Test Summary');
  console.log('=================================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ CORS configuration has issues!');
    process.exit(1);
  } else {
    console.log('\n✅ All CORS tests passed!');
    process.exit(0);
  }
}

main();
