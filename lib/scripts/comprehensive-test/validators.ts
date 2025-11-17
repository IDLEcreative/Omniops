/**
 * Test runner and validation orchestration
 * Extracted from scripts/comprehensive-test.js
 */

import type { SupabaseClient } from '@/lib/supabase/server';
import * as core from './core.js';
import { TestResult } from './core.js';
import { section, log, TestResults } from './reporters.js';

export interface TestConfig {
  apiUrl: string;
  supabase: SupabaseClient;
}

export interface TestDefinition {
  name: string;
  fn: (config: TestConfig) => Promise<TestResult>;
  description: string;
}

/**
 * Execute a single test and log results
 */
export async function runTest(
  test: TestDefinition,
  config: TestConfig
): Promise<boolean> {
  section(`TEST: ${test.description}`);
  log(`Running ${test.name}`, 'test');

  try {
    const result = await test.fn(config);

    if (result.passed) {
      log(result.message || 'Test passed', 'success');
      if (result.data) {
        Object.entries(result.data).forEach(([key, value]) => {
          log(`${key}: ${value}`, 'info');
        });
      }
      return true;
    } else {
      log(result.message || 'Test failed', 'error');
      return false;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`Test crashed: ${message}`, 'error');
    return false;
  }
}

/**
 * Get all test definitions
 */
export function getTestDefinitions(): TestDefinition[] {
  return [
    {
      name: 'testUUIDSessions',
      description: 'UUID Session Validation',
      fn: async ({ apiUrl, supabase }) => core.testUUIDSessions(apiUrl, supabase),
    },
    {
      name: 'testConversationPersistence',
      description: 'Conversation Persistence',
      fn: async ({ apiUrl, supabase }) =>
        core.testConversationPersistence(apiUrl, supabase),
    },
    {
      name: 'testConcurrency',
      description: 'Concurrent Request Handling',
      fn: async ({ apiUrl }) => core.testConcurrency(apiUrl),
    },
    {
      name: 'testEmbeddings',
      description: 'Embeddings Search Functionality',
      fn: async ({ apiUrl }) => core.testEmbeddings(apiUrl),
    },
    {
      name: 'testErrorRecovery',
      description: 'Error Handling and Recovery',
      fn: async ({ apiUrl }) => core.testErrorRecovery(apiUrl),
    },
    {
      name: 'testDatabaseState',
      description: 'Database State Verification',
      fn: async ({ supabase }) => core.testDatabaseState(supabase),
    },
    {
      name: 'testRateLimiting',
      description: 'Rate Limiting',
      fn: async ({ apiUrl }) => core.testRateLimiting(apiUrl),
    },
  ];
}

/**
 * Run all tests and collect results
 */
export async function runAllTests(config: TestConfig): Promise<TestResults> {
  const results: TestResults = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = getTestDefinitions();

  for (const test of tests) {
    const passed = await runTest(test, config);
    results.total++;
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}
