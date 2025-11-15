/**
 * Complete Agent Flow - E2E Integration Tests - ORCHESTRATOR
 *
 * CRITICAL: Tests the entire production path from user message to AI response.
 *
 * Individual tests are in agent-flow/ directory.
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 * Expected Bug Detection: 60-70% of integration issues
 */

// CRITICAL: Unmock Supabase FIRST - before any imports that might use it
jest.unmock('@supabase/supabase-js');
jest.unmock('@supabase/ssr');
jest.unmock('@/lib/supabase/server');
jest.unmock('@/lib/supabase-server'); // Legacy path, just in case

// Reset module registry to ensure unmocked modules are loaded fresh
jest.resetModules();

import { describe, beforeAll, afterAll } from '@jest/globals';
import { getSupabaseClient } from './agent-flow/helpers';

// Import test suites
import './agent-flow/product-search.test';
import './agent-flow/order-lookup.test';
import './agent-flow/react-loop.test';

// TEMPORARY: Skipped until RLS migration is applied
describe('Complete Agent Flow - E2E (Core Flows)', () => {
  beforeAll(async () => {
    // Verify required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for E2E tests');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for E2E tests');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for E2E tests');
    }

    // Clean up any test data from previous runs
    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');

    console.log('[E2E Setup] Environment verified, test data cleaned');
  });

  afterAll(async () => {
    // Final cleanup of all test data
    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');

    console.log('[E2E Cleanup] All test data removed');
  });
});
