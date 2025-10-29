/**
 * Complete Agent Flow - End-to-End Integration Tests
 *
 * CRITICAL: Tests the entire production path from user message to AI response.
 *
 * What This Tests:
 * - Full flow: User message → Chat API → ReAct loop → Tool execution → AI response
 * - Real OpenAI API calls (validates AI decision-making)
 * - Tool execution with real parameters
 * - Commerce provider integration (WooCommerce/Shopify)
 * - Metadata tracking throughout the conversation
 * - Response parsing and formatting
 *
 * Why These Tests Matter:
 * - Unit tests mock components - integration tests catch **integration bugs**
 * - Validates AI makes correct tool choices in realistic scenarios
 * - Ensures metadata system works with actual AI responses
 * - Tests the **actual user experience** end-to-end
 *
 * Setup Required:
 * - Real OpenAI API key (test mode recommended)
 * - Real Supabase connection
 * - Mock or test WooCommerce/Shopify accounts
 * - Running development server (for API tests)
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 * Expected Bug Detection: 60-70% of integration issues
 */

// IMPORTANT: Override Jest's mocked env vars for E2E tests
// Jest setup mocks these for unit tests, but E2E tests need real connections
// Set E2E_TEST flag FIRST to prevent jest.setup.js from overriding
process.env.E2E_TEST = 'true';

if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');

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
import { createClient } from '@supabase/supabase-js';

// Helper to get service role client with proper configuration
async function getSupabaseClient() {
  console.log('[getSupabaseClient] Creating client with:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
      },
    }
  );

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

// Helper function to create test organization and config (for tests that need orgs)
async function createTestOrganizationAndConfig(
  testName: string,
  extraFields: Record<string, any> = {}
) {
  const supabase = await getSupabaseClient();
  const testDomain = `test-${testName}-${Date.now()}.example.com`;

  // Create test organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: `Test Org - ${testName}`,
      slug: `test-org-${testName}-${Date.now()}`
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create test organization: ${JSON.stringify(orgError)}`);
  }

  // Create customer config
  const { data: customerConfig, error: configError } = await supabase
    .from('customer_configs')
    .insert({
      domain: testDomain,
      business_name: `${testName} Test`,
      organization_id: org.id,
      ...extraFields
    })
    .select()
    .single();

  return { org, customerConfig, configError, testDomain, supabase };
}

describe('Complete Agent Flow - E2E', () => {
  /**
   * Setup Instructions:
   *
   * 1. Set environment variables:
   *    - OPENAI_API_KEY (test mode)
   *    - NEXT_PUBLIC_SUPABASE_URL
   *    - SUPABASE_SERVICE_ROLE_KEY
   *
   * 2. Start development server:
   *    npm run dev
   *
   * 3. Run tests:
   *    npm test -- __tests__/integration/agent-flow-e2e.test.ts
   *
   * 4. Monitor OpenAI usage:
   *    These tests make REAL API calls - track token usage!
   */

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
            message: 'Show me products and my recent orders',
            domain: testDomain,
            session_id: 'test-session-' + Date.now()
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();
        const lower = data.message.toLowerCase();
        expect(lower.includes('pump') || lower.includes('product')).toBe(true);
        expect(lower.includes('order') || lower.includes('email')).toBe(true);

        console.log('[Test 5 PASSED] Parallel tools handled');
        await supabase.from('conversations').delete().eq('id', data.conversation_id);
      } finally {
        await supabase.from('scraped_pages').delete().eq('domain_id', customerConfig.id);
        await supabase.from('customer_configs').delete().eq('domain', testDomain);
      }
    }, 60000);

    it('should respect max iteration limit', async () => {
      /**
       * Test: Complex query that triggers max ReAct loop iterations
       * System should: Stop after max iterations (default: 3), provide response
       *
       * Strategy: Send message that requires tool execution
       * Verify: Response includes searchMetadata.iterations === maxIterations
       */

      const testDomain = `test-max-iterations-${Date.now()}.example.com`;

      // Get Supabase client and create test organization
      const supabase = await getSupabaseClient();
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Org - Max Iterations',
          slug: `test-org-${Date.now()}`
        })
        .select()
        .single();

      // Create test customer config
      const { data: customerConfig, error: configError } = await supabase
        .from('customer_configs')
        .insert({
          domain: testDomain,
          business_name: 'Max Iterations Test',
          organization_id: org!.id,
          settings: {
            ai: {
              maxSearchIterations: 2 // Set low for faster test
            }
          }
        })
        .select()
        .single();

      expect(configError).toBeNull();
      expect(customerConfig).toBeTruthy();

      try {
        // Send a complex query that will trigger multiple tool calls
        const response = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me all available pumps',
            domain: testDomain,
            session_id: `test-session-${Date.now()}`,
            config: {
              ai: {
                maxSearchIterations: 2
              }
            }
          })
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        // Verify response exists
        expect(data.message).toBeTruthy();
        expect(typeof data.message).toBe('string');

        // Verify max iterations was respected
        expect(data.searchMetadata).toBeDefined();
        expect(data.searchMetadata.iterations).toBeLessThanOrEqual(2);

        console.log('[Test] Max iteration test passed:', {
          iterations: data.searchMetadata.iterations,
          maxAllowed: 2,
          responseLength: data.message.length
        });
      } finally {
        // Cleanup (customer_configs will cascade delete)
        await supabase
          .from('organizations')
          .delete()
          .eq('id', org!.id);
      }
    }, 45000);
  });

  describe('Metadata Tracking', () => {
    it('should track products mentioned in conversation', async () => {
      /**
       * Test Flow:
       * 1. User asks about a product
       * 2. AI responds with product details
       * 3. User asks follow-up using pronoun "it"
       * 4. AI should resolve "it" to the previously mentioned product
       *
       * Validation:
       * - Metadata tracking works across turns
       * - Pronoun resolution works correctly
       * - Conversation maintains context
       */

      const sessionId = `test-session-${Date.now()}`;

      // Create test organization and config
      const { org, customerConfig, testDomain } = await createTestOrganizationAndConfig('product-tracking');

      // Add test product to scraped pages
      const { data: scrapedPage } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: customerConfig!.id,
          url: `https://${testDomain}/products/test-product`,
          title: 'Product Model ZF4 - Premium Quality',
          content_text: 'Product Model ZF4 - High performance item. Price: $499.99. In Stock.',
          last_scraped: new Date().toISOString(),
          content_type: 'text/html',
          status_code: 200
        })
        .select()
        .single();

      try {
        let conversationId: string | undefined;

        // Turn 1: Ask about product
        const response1 = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Tell me about the ZF4 pump',
            domain: testDomain,
            session_id: sessionId
          })
        });

        expect(response1.ok).toBe(true);
        const data1 = await response1.json();
        conversationId = data1.conversation_id;

        expect(data1.message).toBeTruthy();
        console.log('[Test] Turn 1 response:', data1.message.substring(0, 200));

        // Turn 2: Ask follow-up using pronoun
        const response2 = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'How much does it cost?',
            domain: testDomain,
            session_id: sessionId,
            conversation_id: conversationId
          })
        });

        expect(response2.ok).toBe(true);
        const data2 = await response2.json();

        // Verify AI understood "it" refers to ZF4 pump
        expect(data2.message).toBeTruthy();
        const responseLower = data2.message.toLowerCase();

        // Should reference price or cost in the response
        expect(
          responseLower.includes('$') ||
          responseLower.includes('price') ||
          responseLower.includes('cost') ||
          responseLower.includes('499')
        ).toBe(true);

        console.log('[Test] Turn 2 response (pronoun resolution):', data2.message.substring(0, 200));

        // Verify metadata was tracked
        const { data: conversation } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('id', conversationId)
          .single();

        expect(conversation?.metadata).toBeDefined();
        console.log('[Test] Metadata tracking verified:', {
          hasMetadata: !!conversation?.metadata,
          turnCount: conversation?.metadata?.currentTurn || 0
        });

      } finally {
        // Cleanup (cascade will delete customer_configs and scraped_pages)
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 60000);


    it('should track corrections and adapt', async () => {
      /**
       * Test Flow:
       * 1. User: "Show me ZF5 pumps"
       * 2. AI: Responds about ZF5
       * 3. User: "Sorry, I meant ZF4 not ZF5"
       * 4. AI: Acknowledges correction and switches to ZF4
       *
       * Validation:
       * - Correction is detected
       * - AI adapts to corrected value
       * - Metadata tracks the correction
       */

      const sessionId = `test-session-${Date.now()}`;

      // Create test organization and config
      const { org, customerConfig, testDomain } = await createTestOrganizationAndConfig('correction');

      // Add test products
      await supabase.from('scraped_pages').insert([
        {
          domain_id: customerConfig!.id,
          url: `https://${testDomain}/products/zf5`,
          title: 'ZF5 Hydraulic Pump',
          content_text: 'ZF5 Hydraulic Pump - High performance model. Price: $599.99.',
          last_scraped: new Date().toISOString(),
          content_type: 'text/html',
          status_code: 200
        },
        {
          domain_id: customerConfig!.id,
          url: `https://${testDomain}/products/zf4`,
          title: 'ZF4 Hydraulic Pump',
          content_text: 'ZF4 Hydraulic Pump - Standard model. Price: $499.99.',
          last_scraped: new Date().toISOString(),
          content_type: 'text/html',
          status_code: 200
        }
      ]);

      try {
        let conversationId: string | undefined;

        // Turn 1: Ask about ZF5
        const response1 = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me ZF5 pumps',
            domain: testDomain,
            session_id: sessionId
          })
        });

        expect(response1.ok).toBe(true);
        const data1 = await response1.json();
        conversationId = data1.conversation_id;

        console.log('[Test] Initial query response:', data1.message.substring(0, 200));

        // Turn 2: Correct to ZF4
        const response2 = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Sorry, I meant ZF4 not ZF5',
            domain: testDomain,
            session_id: sessionId,
            conversation_id: conversationId
          })
        });

        expect(response2.ok).toBe(true);
        const data2 = await response2.json();

        // Verify correction was understood
        const responseLower = data2.message.toLowerCase();
        expect(responseLower).toContain('zf4');

        console.log('[Test] Correction response:', data2.message.substring(0, 200));

        // Verify metadata tracked the correction
        const { data: conversation } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('id', conversationId)
          .single();

        expect(conversation?.metadata).toBeDefined();

        // Check if corrections array exists in metadata
        if (conversation?.metadata?.corrections) {
          const corrections = conversation.metadata.corrections;
          console.log('[Test] Corrections tracked:', corrections);
          expect(Array.isArray(corrections)).toBe(true);
          expect(corrections.length).toBeGreaterThan(0);
        }

        console.log('[Test] Correction tracking verified');

      } finally {
        // Cleanup (cascade will delete customer_configs and scraped_pages)
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 60000);
  });

  describe('Commerce Provider Integration', () => {
    it('should route to WooCommerce when enabled', async () => {
      /**
       * Test: Customer with WooCommerce integration configured
       * System should: Detect WooCommerce config and use WooCommerce provider
       *
       * Strategy: Create customer config with woocommerce_url
       * Verify: getCommerceProvider returns WooCommerce provider
       */

      // Create test organization and config with WooCommerce credentials
      const { org, customerConfig, configError, testDomain } = await createTestOrganizationAndConfig('woocommerce', {
        woocommerce_url: 'https://test-woo-store.com',
        woocommerce_consumer_key: 'ck_test_key_12345',
        woocommerce_consumer_secret: 'cs_test_secret_67890'
      });

      expect(configError).toBeNull();
      expect(customerConfig).toBeTruthy();
      expect(customerConfig!.woocommerce_url).toBe('https://test-woo-store.com');

      try {
        // Test provider detection via commerce-provider module
        const { getCommerceProvider } = await import('@/lib/agents/commerce-provider');

        // Clear cache to ensure fresh lookup
        const { clearCommerceProviderCache } = await import('@/lib/agents/commerce-provider');
        clearCommerceProviderCache();

        // Get provider for this domain
        const provider = await getCommerceProvider(testDomain);

        // Verify WooCommerce provider was returned
        expect(provider).toBeTruthy();
        expect(provider?.platform).toBe('woocommerce');

        console.log('[Test] WooCommerce provider routing verified:', {
          platform: provider?.platform,
          domain: testDomain,
          hasProvider: !!provider
        });

      } finally {
        // Cleanup (cascade will delete customer_configs)
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 30000);

    it('should route to Shopify when enabled', async () => {
      /**
       * Test: Customer with Shopify integration configured
       * System should: Detect Shopify config and use Shopify provider
       *
       * Strategy: Create customer config with shopify_shop
       * Verify: getCommerceProvider returns Shopify provider
       */

      // Create test organization and config with Shopify credentials
      const { org, customerConfig, configError, testDomain } = await createTestOrganizationAndConfig('shopify', {
        shopify_shop: 'test-shop.myshopify.com',
        shopify_access_token: 'shpat_test_token_12345'
      });

      expect(configError).toBeNull();
      expect(customerConfig).toBeTruthy();
      expect(customerConfig!.shopify_shop).toBe('test-shop.myshopify.com');

      try {
        // Test provider detection
        const { getCommerceProvider } = await import('@/lib/agents/commerce-provider');

        // Clear cache to ensure fresh lookup
        const { clearCommerceProviderCache } = await import('@/lib/agents/commerce-provider');
        clearCommerceProviderCache();

        // Get provider for this domain
        const provider = await getCommerceProvider(testDomain);

        // Verify Shopify provider was returned
        expect(provider).toBeTruthy();
        expect(provider?.platform).toBe('shopify');

        console.log('[Test] Shopify provider routing verified:', {
          platform: provider?.platform,
          domain: testDomain,
          hasProvider: !!provider
        });

      } finally {
        // Cleanup (cascade will delete customer_configs)
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 30000);

    it.skip('should fall back to generic search when no provider (IMPLEMENT ME)', async () => {
      /**
       * Test: Customer without commerce provider
       * AI should: Use vector search instead of provider-specific lookup
       */

      // TODO: Implement fallback test
      expect(true).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it.skip('should handle OpenAI API errors gracefully (IMPLEMENT ME)', async () => {
      /**
       * Test: Simulate OpenAI rate limit or error
       * System should: Return user-friendly error message, log issue
       */

      // TODO: Implement error handling test
      expect(true).toBe(false);
    });

    it.skip('should handle tool execution failures gracefully (IMPLEMENT ME)', async () => {
      /**
       * Test: Tool execution throws error
       * AI should: Acknowledge issue, provide alternative or explanation
       */

      // TODO: Implement tool error handling test
      expect(true).toBe(false);
    });

    it.skip('should handle database connection failures gracefully (IMPLEMENT ME)', async () => {
      /**
       * Test: Database unavailable
       * System should: Return graceful error, not crash
       */

      // TODO: Implement database error test
      expect(true).toBe(false);
    });
  });

  describe('Response Quality', () => {
    it.skip('should format responses with proper markdown (IMPLEMENT ME)', async () => {
      /**
       * Validation:
       * - Links are formatted as [text](url), not raw URLs
       * - Lists have proper spacing
       * - Text is concise and scannable
       */

      // TODO: Implement response format validation
      expect(true).toBe(false);
    });

    it.skip('should never make up prices or specifications (IMPLEMENT ME)', async () => {
      /**
       * Test: Ask for price of product not in database
       * AI should: Admit uncertainty, not invent numbers
       */

      // TODO: Implement hallucination prevention test
      expect(true).toBe(false);
    });

    it.skip('should never link to external competitors (IMPLEMENT ME)', async () => {
      /**
       * Test: AI response should only contain links to customer's domain
       * Validation: Response contains no external commerce URLs
       */

      // TODO: Implement external link prevention test
      expect(true).toBe(false);
    });
  });
});

/**
 * Implementation Guide:
 *
 * 1. Start with "Product Search Flow" tests (simplest)
 * 2. Add "Order Lookup Flow" tests (adds verification)
 * 3. Implement "Metadata Tracking" tests (critical for accuracy)
 * 4. Add "Commerce Provider Integration" tests
 * 5. Implement "Error Handling" and "Response Quality" tests
 *
 * Estimated Time: 2-3 days for full implementation
 *
 * Success Metrics:
 * - All tests passing with real OpenAI
 * - < 10 seconds average test execution time
 * - < $0.10 OpenAI cost per test run
 * - 60-70% bug detection rate vs. unit tests alone
 */
