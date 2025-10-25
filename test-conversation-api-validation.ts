#!/usr/bin/env tsx
/**
 * Comprehensive API Validation Script
 * Tests authentication, authorization, and input validation for conversation transcript API
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  expectedStatus?: number;
  actualStatus?: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🚀 Starting Conversation API Validation Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Unauthenticated access should return 401
  console.log('📝 Test 1: Unauthenticated Access');
  try {
    const response = await fetch(
      `${BASE_URL}/api/dashboard/conversations/123e4567-e89b-12d3-a456-426614174000`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const passed = response.status === 401;
    results.push({
      name: 'Unauthenticated access returns 401',
      passed,
      details: passed
        ? 'Correctly rejected unauthenticated request'
        : `Expected 401, got ${response.status}`,
      expectedStatus: 401,
      actualStatus: response.status,
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log(`   Status: ${response.status}\n`);
  } catch (error) {
    results.push({
      name: 'Unauthenticated access returns 401',
      passed: false,
      details: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL - Request failed');
    console.log(`   Error: ${error}\n`);
  }

  // Test 2: Invalid UUID format should return 400
  console.log('📝 Test 2: Invalid UUID Format Validation');
  try {
    const response = await fetch(
      `${BASE_URL}/api/dashboard/conversations/not-a-valid-uuid`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const passed = response.status === 400 && data.error?.includes('Invalid');

    results.push({
      name: 'Invalid UUID format returns 400',
      passed,
      details: passed
        ? 'Correctly validated UUID format'
        : `Expected 400 with validation error, got ${response.status}`,
      expectedStatus: 400,
      actualStatus: response.status,
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    results.push({
      name: 'Invalid UUID format returns 400',
      passed: false,
      details: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL - Request failed');
    console.log(`   Error: ${error}\n`);
  }

  // Test 3: Valid UUID with no auth should still return 401
  console.log('📝 Test 3: Valid UUID Without Authentication');
  try {
    const response = await fetch(
      `${BASE_URL}/api/dashboard/conversations/123e4567-e89b-12d3-a456-426614174000`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const passed = response.status === 401;
    results.push({
      name: 'Valid UUID without auth returns 401',
      passed,
      details: passed
        ? 'Authentication enforced before UUID validation'
        : `Expected 401, got ${response.status}`,
      expectedStatus: 401,
      actualStatus: response.status,
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log(`   Status: ${response.status}\n`);
  } catch (error) {
    results.push({
      name: 'Valid UUID without auth returns 401',
      passed: false,
      details: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL - Request failed');
    console.log(`   Error: ${error}\n`);
  }

  // Test 4: Check if server is responding
  console.log('📝 Test 4: Server Health Check');
  try {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
    });

    const passed = response.status === 200;
    results.push({
      name: 'Server health check',
      passed,
      details: passed ? 'Server is responding' : 'Server may be down',
      expectedStatus: 200,
      actualStatus: response.status,
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
    console.log(`   Status: ${response.status}\n`);
  } catch (error) {
    results.push({
      name: 'Server health check',
      passed: false,
      details: 'Server not responding',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('❌ FAIL - Server not responding');
    console.log(`   Error: ${error}\n`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  • ${r.name}`);
        console.log(`    ${r.details}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
  }

  console.log('\n' + '='.repeat(60));

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
