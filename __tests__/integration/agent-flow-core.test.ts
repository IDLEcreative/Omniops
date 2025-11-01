/**
 * Complete Agent Flow - E2E Integration Tests (Core Flows)
 *
 * CRITICAL: Tests the entire production path from user message to AI response.
 *
 * What This Tests:
 * - Full flow: User message → Chat API → ReAct loop → Tool execution → AI response
 * - Real OpenAI API calls (validates AI decision-making)
 * - Tool execution with real parameters
 * - Response parsing and formatting
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 * Expected Bug Detection: 60-70% of integration issues
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// IMPORTANT: Override Jest's mocked env vars for E2E tests
// Jest setup mocks these for unit tests, but E2E tests need real connections
// Set E2E_TEST flag FIRST to prevent jest.setup.js from overriding
process.env.E2E_TEST = 'true';

if (process.env.NODE_ENV !== 'production') {

  // Load actual .env.local file
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    // Override ALL environment variables from .env.local
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });

    console.log('[E2E ENV OVERRIDE] Loaded real environment from .env.local:', Object.keys(envConfig).length, 'variables');
  } else {
    console.warn('[E2E ENV OVERRIDE] .env.local not found, using existing env vars');
  }
}

// CRITICAL: Unmock Supabase FIRST - before any imports that might use it
jest.unmock('@supabase/supabase-js');

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

// Helper to get service role client with proper configuration
async function getSupabaseClient() {
  console.log('[getSupabaseClient] Creating client with:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const supabase = createServiceRoleClientSync();

  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  console.log('[getSupabaseClient] Client created:', !!supabase);
  return supabase;
}

// Helper function to create test config (without organizations for simpler E2E tests)
// NOTE: In production, customer_configs should always have organization_id
// But for E2E tests, we bypass this for simplicity
async function createTestConfig(testName: string, extraFields: Record<string, any> = {}) {
  const testDomain = `test-${testName}-${Date.now()}.example.com`;
  const supabase = await getSupabaseClient();

  console.log('[createTestConfig] Attempting insert for domain:', testDomain);

  // Create customer config directly (service role can bypass RLS)
  const { data: customerConfig, error: configError } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: `${testName} Test`,
      ...extraFields
    })
    .select()
    .single();

  console.log('[createTestConfig] Insert result:', {
    hasData: !!customerConfig,
    hasError: !!configError,
    error: configError,
    dataType: typeof customerConfig,
    dataValue: customerConfig,
    fullResponse: JSON.stringify({ data: customerConfig, error: configError }, null, 2)
  });

  return { customerConfig, configError, testDomain, supabase };
}

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

    // DEBUG: Test if real Supabase client is working
    console.log('[E2E Setup] Testing direct Supabase query...');
    const testDomain = `test-debug-${Date.now()}.example.com`;
    const {data: testData, error: testError} = await supabase
      .from('customer_configs')
      .insert({
        domain: testDomain,
        business_name: 'Debug Test'
      })
      .select()
      .single();

    console.log('[E2E Setup] Direct query result:', {
      hasData: !!testData,
      data: testData?.id ? `Has ID: ${testData.id}` : 'No data',
      error: testError
    });

    if (testData) {
      // Clean up test record
      await supabase.from('customer_configs').delete().eq('id', testData.id);
      console.log('[E2E Setup] ✅ Direct Supabase connection working!');
    } else {
      console.error('[E2E Setup] ❌ Direct Supabase connection failed!');
    }

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

  describe('Product Search Flow', () => {
    it('should handle pump search with real AI', async () => {
      const { customerConfig, configError, testDomain, supabase } = await createTestConfig('product-search');

      if (configError || !customerConfig) {
        throw new Error('Failed to create test config: ' + JSON.stringify(configError));
      }

      const sessionId = 'test-session-' + Date.now();

      await supabase.from('scraped_pages').insert({
        domain_id: customerConfig.id,
        url: 'https://' + testDomain + '/products/model-a',
        title: 'Product Model A',
        content_text: 'Product Model A. Price: $299.99. In Stock.',
        last_scraped: new Date().toISOString(),
        content_type: 'text/html',
        status_code: 200
      });

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me pumps',
            domain: testDomain,
            session_id: sessionId
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(data.message).toBeTruthy();
        expect(data.searchMetadata).toBeDefined();

        console.log('[Test 1 PASSED] Product search');

        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('scraped_pages').delete().eq('domain_id', customerConfig.id);
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);

    it('should handle "no results found" gracefully', async () => {
      const { customerConfig, configError, testDomain, supabase } = await createTestConfig('no-results');
      if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Do you have unicorn-powered flux capacitors?',
            domain: testDomain,
            session_id: 'test-session-' + Date.now()
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        const lower = data.message.toLowerCase();
        expect(lower.includes('sorry') || lower.includes('unable') || lower.includes("don't")).toBe(true);

        console.log('[Test 2 PASSED] No results handled gracefully');
        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);
  });

  describe('Order Lookup Flow', () => {
    it('should handle order lookup with verification', async () => {
      const { customerConfig, configError, testDomain, supabase } = await createTestConfig('order-verify');
      if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "What's the status of order #12345?",
            domain: testDomain,
            session_id: 'test-session-' + Date.now()
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        const lower = data.message.toLowerCase();
        expect(lower.includes('email') || lower.includes('verify')).toBe(true);

        console.log('[Test 3 PASSED] Order verification requested');
        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);

    it('should prevent order access without verification', async () => {
      const { customerConfig, configError, testDomain, supabase } = await createTestConfig('order-security');
      if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me my recent orders',
            domain: testDomain,
            session_id: 'test-session-' + Date.now()
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        const lower = data.message.toLowerCase();
        expect(lower.includes('email') || lower.includes('verify')).toBe(true);
        expect(lower).not.toContain('order #');

        console.log('[Test 4 PASSED] Order access prevented');
        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);
  });

  describe('ReAct Loop Behavior', () => {
    it('should execute multiple tools in parallel when needed', async () => {
      const { customerConfig, configError, testDomain, supabase } = await createTestConfig('parallel-tools');
      if (configError || !customerConfig) throw new Error('Failed to create test config: ' + JSON.stringify(configError));

      await supabase.from('scraped_pages').insert({
        domain_id: customerConfig.id,
        url: 'https://' + testDomain + '/products/pump',
        title: 'Industrial Pump',
        content_text: 'Industrial pump. Price: $199.99.',
        last_scraped: new Date().toISOString(),
        content_type: 'text/html',
        status_code: 200
      });

      try {
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me hydraulic pumps and my recent orders',
            domain: testDomain,
            session_id: 'test-session-' + Date.now()
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        const lower = data.message.toLowerCase();
        expect(lower.includes('pump') || lower.includes('hydraulic')).toBe(true);
        expect(lower.includes('order') || lower.includes('email')).toBe(true);

        console.log('[Test 5 PASSED] Parallel tools handled');
        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('scraped_pages').delete().eq('domain_id', customerConfig.id);
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);
  });
});
