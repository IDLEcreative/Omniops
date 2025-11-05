#!/usr/bin/env npx tsx
/**
 * Error Injection Tests: Null/Undefined Data Injection
 *
 * Validates that the system gracefully handles null/undefined data at critical
 * points without throwing TypeError or crashing.
 *
 * Injection Points Tested:
 * 1. WooCommerce products response → null products array
 * 2. Search results → undefined results
 * 3. Metadata search log → null/missing fields
 * 4. Widget config → missing ai_settings
 * 5. Conversation history → null messages
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'test-null-injection.local';

interface NullInjectionTest {
  name: string;
  description: string;
  injectionPoint: string;
  nullValue: any;
  query: string;
  validateResponse: (response: any) => {
    passed: boolean;
    hasTypeError: boolean;
    gracefulHandling: boolean;
    reason: string;
  };
}

interface TestResult {
  scenario: string;
  status: 'pass' | 'fail' | 'skip';
  hadTypeError: boolean;
  gracefulHandling: boolean;
  error?: string;
  details: Record<string, any>;
}

/**
 * Scenario 1: Null WooCommerce Products Response
 * Expected: No TypeError, fallback to search results or message about unavailable products
 */
const testNullWooCommerceProducts: NullInjectionTest = {
  name: 'Null WooCommerce Products',
  description: 'WooCommerce API returns null products array',
  injectionPoint: 'lib/woocommerce-api/index.ts',
  nullValue: null,
  query: 'Do you have any pumps?',
  validateResponse: (response) => {
    const hasTypeError = response.error?.includes('Cannot read properties') ||
                        response.error?.includes('TypeError') ||
                        response.message?.includes('Cannot read');

    const hasValidResponse = response.message && response.message.length > 0;
    const couldFallback = response.message?.includes('search') ||
                         response.message?.includes('not found') ||
                         response.message?.includes('no products');

    return {
      passed: !hasTypeError && hasValidResponse,
      hasTypeError,
      gracefulHandling: !hasTypeError,
      reason: hasTypeError
        ? 'TypeError thrown (bad)'
        : hasValidResponse
        ? 'Gracefully handled null products'
        : 'Response missing'
    };
  }
};

/**
 * Scenario 2: Undefined Search Results
 * Expected: No TypeError, uses empty array, returns appropriate message
 */
const testUndefinedSearchResults: NullInjectionTest = {
  name: 'Undefined Search Results',
  description: 'Search function returns undefined instead of array',
  injectionPoint: 'lib/embeddings.ts',
  nullValue: undefined,
  query: 'Find products similar to hydraulic pumps',
  validateResponse: (response) => {
    const hasTypeError = response.error?.includes('Cannot read properties') ||
                        response.error?.includes('TypeError') ||
                        response.error?.includes('map is not a function');

    const hasValidResponse = response.message && response.message.length > 0;

    return {
      passed: !hasTypeError && hasValidResponse,
      hasTypeError,
      gracefulHandling: !hasTypeError,
      reason: hasTypeError
        ? 'TypeError thrown on undefined array'
        : 'Gracefully handled undefined results'
    };
  }
};

/**
 * Scenario 3: Null Metadata Search Log
 * Expected: No TypeError, creates default metadata, continues
 */
const testNullMetadataSearchLog: NullInjectionTest = {
  name: 'Null Metadata Search Log',
  description: 'Metadata search log field is null',
  injectionPoint: 'lib/chat/conversation-metadata.ts',
  nullValue: null,
  query: 'What is the shipping cost?',
  validateResponse: (response) => {
    const hasTypeError = response.error?.includes('Cannot read') ||
                        response.error?.includes('TypeError');

    const hasValidResponse = response.message && response.message.length > 0;
    const continues = !hasTypeError;

    return {
      passed: !hasTypeError && hasValidResponse,
      hasTypeError,
      gracefulHandling: continues,
      reason: hasTypeError
        ? 'TypeError on metadata field'
        : 'Metadata handled gracefully'
    };
  }
};

/**
 * Scenario 4: Missing AI Settings in Widget Config
 * Expected: Uses default personality/language, no TypeError
 */
const testMissingAiSettings: NullInjectionTest = {
  name: 'Missing AI Settings',
  description: 'Widget config has no ai_settings property',
  injectionPoint: 'lib/chat/system-prompts.ts',
  nullValue: undefined,
  query: 'Tell me about your products',
  validateResponse: (response) => {
    const hasTypeError = response.error?.includes('Cannot read') ||
                        response.error?.includes('ai_settings');

    const hasValidResponse = response.message && response.message.length > 0;

    return {
      passed: !hasTypeError && hasValidResponse,
      hasTypeError,
      gracefulHandling: !hasTypeError,
      reason: hasTypeError
        ? 'TypeError on ai_settings'
        : 'Used default AI settings gracefully'
    };
  }
};

/**
 * Scenario 5: Null Conversation History
 * Expected: Uses empty array, no TypeError, response generated
 */
const testNullConversationHistory: NullInjectionTest = {
  name: 'Null Conversation History',
  description: 'Conversation history is null instead of array',
  injectionPoint: 'lib/chat/conversation-manager.ts',
  nullValue: null,
  query: 'This is my first question',
  validateResponse: (response) => {
    const hasTypeError = response.error?.includes('Cannot read') ||
                        response.error?.includes('TypeError') ||
                        response.error?.includes('map is not a function');

    const hasValidResponse = response.message && response.message.length > 0;
    const isFirstMessage = !response.error?.includes('history');

    return {
      passed: !hasTypeError && hasValidResponse,
      hasTypeError,
      gracefulHandling: !hasTypeError && hasValidResponse,
      reason: hasTypeError
        ? 'TypeError on history array'
        : 'Handled null history as first message'
    };
  }
};

/**
 * Send a chat request and capture TypeError behavior
 */
async function sendChatRequest(
  test: NullInjectionTest,
  sessionId: string = uuidv4()
): Promise<{
  response: any;
  status: number;
  duration: number;
  hasTypeError: boolean;
}> {
  const startTime = performance.now();

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Null-Injection': test.injectionPoint,
        'X-Null-Value': test.nullValue === undefined ? 'undefined' : 'null'
      },
      body: JSON.stringify({
        message: test.query,
        session_id: sessionId,
        conversation_id: null,
        domain: TEST_DOMAIN,
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      }),
    });

    const duration = performance.now() - startTime;
    const data = await apiResponse.json();

    // Check response for TypeError indicators
    const errorText = JSON.stringify(data);
    const hasTypeError = errorText.includes('TypeError') ||
                        errorText.includes('Cannot read') ||
                        errorText.includes('is not a function') ||
                        errorText.includes('is not defined');

    return {
      response: data,
      status: apiResponse.status,
      duration,
      hasTypeError
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorText = error instanceof Error ? error.message : String(error);
    const hasTypeError = errorText.includes('TypeError') ||
                        errorText.includes('Cannot read');

    return {
      response: {
        error: errorText
      },
      status: 0,
      duration,
      hasTypeError
    };
  }
}

/**
 * Run a single null injection test
 */
async function runNullInjectionTest(test: NullInjectionTest): Promise<TestResult> {
  console.log(`\n[TEST] ${test.name}`);
  console.log(`       ${test.description}`);
  console.log(`       Query: "${test.query}"`);

  const startTime = performance.now();

  try {
    const result = await sendChatRequest(test);
    const duration = performance.now() - startTime;

    const validation = test.validateResponse(result.response);

    console.log(`       Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`       Status Code: ${result.status}`);
    console.log(`       Type Error Detected: ${result.hasTypeError ? 'YES' : 'NO'}`);
    console.log(`       Graceful Handling: ${validation.gracefulHandling ? 'YES' : 'NO'}`);
    console.log(`       Reason: ${validation.reason}`);

    return {
      scenario: test.name,
      status: validation.passed ? 'pass' : 'fail',
      hadTypeError: result.hasTypeError,
      gracefulHandling: validation.gracefulHandling,
      details: {
        injectionPoint: test.injectionPoint,
        status: result.status,
        duration: result.duration,
        hasTypeError: validation.hasTypeError
      }
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    console.log(`       Duration: ${duration.toFixed(2)}ms`);
    console.log(`       Status: ERROR - ${error instanceof Error ? error.message : 'Unknown'}`);

    return {
      scenario: test.name,
      status: 'fail',
      hadTypeError: true,
      gracefulHandling: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        injectionPoint: test.injectionPoint
      }
    };
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('ERROR INJECTION TESTS: Null/Undefined Data Injection');
  console.log('='.repeat(70));

  console.log('\nTest Environment:');
  console.log(`  Domain: ${TEST_DOMAIN}`);
  console.log(`  API Endpoint: ${API_URL}`);

  const tests = [
    testNullWooCommerceProducts,
    testUndefinedSearchResults,
    testNullMetadataSearchLog,
    testMissingAiSettings,
    testNullConversationHistory
  ];

  const results: TestResult[] = [];

  // Run each test sequentially
  for (const test of tests) {
    const result = await runNullInjectionTest(test);
    results.push(result);

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print detailed results
  console.log('\n' + '='.repeat(70));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const typeErrors = results.filter(r => r.hadTypeError).length;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`\n${icon} ${result.scenario}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Had TypeError: ${result.hadTypeError ? 'YES ⚠️' : 'NO ✓'}`);
    console.log(`   Graceful Handling: ${result.gracefulHandling ? 'YES ✓' : 'NO'}`);

    if (result.details.duration) {
      console.log(`   Duration: ${result.details.duration.toFixed(2)}ms`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  console.log(`\n⚠️  TypeErrors Detected: ${typeErrors}/${results.length}`);
  if (typeErrors > 0) {
    console.log('   The following scenarios threw TypeErrors:');
    for (const result of results.filter(r => r.hadTypeError)) {
      console.log(`   ❌ ${result.scenario}`);
    }
  }

  console.log(`\n✓ Graceful Handling: ${results.filter(r => r.gracefulHandling).length}/${results.length}`);
  for (const result of results.filter(r => r.gracefulHandling)) {
    console.log(`  ✓ ${result.scenario}`);
  }

  const success = failed === 0 && typeErrors === 0;
  console.log(`\n${success ? '✅ ALL TESTS PASSED' : '❌ CRITICAL ISSUES FOUND'}`);
  console.log('='.repeat(70) + '\n');

  process.exit(success ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
