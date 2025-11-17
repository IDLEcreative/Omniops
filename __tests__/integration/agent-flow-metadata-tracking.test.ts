/**
 * Complete Agent Flow - E2E Integration Tests (Metadata Tracking)
 *
 * Tests metadata tracking and max iteration limits
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 *
 * REQUIREMENTS:
 * - Dev server must be running on port 3000: npm run dev
 * - Redis must be running: docker-compose up -d redis
 * - OpenAI API key must be set
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

process.env.E2E_TEST = 'true';

// Load environment variables BEFORE any imports
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
  }
}

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// IMPORTANT: For E2E tests, we need to use the real Supabase client
// Jest's moduleNameMapper is forcing the mock, so we import directly
import { createClient } from '../../node_modules/@supabase/supabase-js/dist/main/index.js';
import { server } from '../mocks/server';
import { http, HttpResponse, bypass } from 'msw';

// Global variable to store the Supabase client created after fetch is properly set up
let globalSupabaseClient: any = null;

async function getSupabaseClient() {
  // Return cached client if already created (fetch is already set up)
  if (globalSupabaseClient) {
    return globalSupabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Failed to create Supabase client - missing environment variables');
  }

  // Create the real Supabase client directly
  globalSupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  return globalSupabaseClient;
}

async function createTestOrganizationAndConfig(
  testName: string,
  extraFields: Record<string, any> = {}
) {
  const supabase = await getSupabaseClient();
  const testDomain = `test-${testName}-${Date.now()}.example.com`;

  // Sanitize testName for slug format (only lowercase letters, numbers, and hyphens)
  const slugSafeTestName = testName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const { data: org, error: orgError} = await supabase
    .from('organizations')
    .insert({
      name: `Test Org - ${testName}`,
      slug: `test-org-${slugSafeTestName}-${Date.now()}`
    })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create test organization: ${JSON.stringify(orgError)}`);
  }

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

// Skip these tests if running in CI or if explicitly disabled
// These are E2E tests that require a running dev server
const SKIP_E2E = process.env.CI === 'true' || process.env.SKIP_E2E === 'true';
const describeE2E = SKIP_E2E ? describe.skip : describe;

describeE2E('Complete Agent Flow - E2E (Metadata Tracking) [Requires Dev Server]', () => {
  beforeAll(async () => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set - skipping E2E tests');
      return;
    }

    // Stop MSW for these E2E tests - we need real API calls
    // IMPORTANT: Must close server BEFORE replacing fetch, otherwise MSW can't restore properly
    server.close();

    // CRITICAL FIX: The jest.fn() fetch mock from jest.setup.msw.js always returns {}
    // For E2E tests, we need REAL HTTP calls to the dev server
    // Solution: Import and use node-fetch which makes real HTTP calls
    const { fetch: nodeFetch, Headers: NodeHeaders, Request: NodeRequest, Response: NodeResponse } = await import('node-fetch');

    // Replace global fetch with node-fetch for this test suite
    global.fetch = nodeFetch as any;
    global.Headers = NodeHeaders as any;
    global.Request = NodeRequest as any;
    global.Response = NodeResponse as any;

    // Check if dev server is running (don't fail in CI)
    if (!process.env.CI) {
      try {
        const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
        if (!healthCheck || !healthCheck.ok) {
          console.warn('Dev server is not running on port 3000. These tests require: npm run dev');
        }
      } catch (error) {
        console.warn('Dev server check failed. These tests require: npm run dev');
      }
    }

    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');
  });

  afterAll(async () => {
    const supabase = await getSupabaseClient();
    await supabase
      .from('customer_configs')
      .delete()
      .like('domain', 'test-%');

    // Restart MSW for other tests
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  describe('ReAct Loop Behavior', () => {
    it('should respect max iteration limit', async () => {
      const { org, customerConfig, testDomain, supabase } = await createTestOrganizationAndConfig(
        'max-iterations',
        {
          settings: {
            ai: {
              maxSearchIterations: 2
            }
          }
        }
      );

      try {
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

        expect(data.message).toBeTruthy();
        expect(data.searchMetadata).toBeDefined();
        expect(data.searchMetadata.iterations).toBeLessThanOrEqual(2);
      } finally {
        await supabase
          .from('organizations')
          .delete()
          .eq('id', org!.id);
      }
    }, 45000);
  });

  describe('Metadata Tracking', () => {
    it('should track products mentioned in conversation', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const { org, customerConfig, testDomain, supabase } = await createTestOrganizationAndConfig('product-tracking');

      await supabase
        .from('scraped_pages')
        .insert({
          domain_id: customerConfig!.id,
          url: `https://${testDomain}/products/test-product`,
          title: 'Product Model ZF4 - Premium Quality',
          content_text: 'Product Model ZF4 - High performance item. Price: $499.99. In Stock.',
          last_scraped: new Date().toISOString(),
          content_type: 'text/html',
          status_code: 200
        });

      try {

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
        const conversationId = data1.conversation_id;

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

        const responseLower = data2.message.toLowerCase();
        expect(
          responseLower.includes('$') ||
          responseLower.includes('price') ||
          responseLower.includes('cost') ||
          responseLower.includes('499')
        ).toBe(true);

        const { data: conversation } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('id', conversationId)
          .single();

        expect(conversation?.metadata).toBeDefined();
      } finally {
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 60000);

    it('should track corrections and adapt', async () => {
      const sessionId = `test-session-${Date.now()}`;
      const { org, customerConfig, testDomain, supabase } = await createTestOrganizationAndConfig('correction');

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

        const response1 = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Show me ZF5 pumps',
            domain: testDomain,
            session_id: sessionId
          })
        });

        const data1 = await response1.json();
        const conversationId = data1.conversation_id;

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

        const data2 = await response2.json();
        const responseLower = data2.message.toLowerCase();
        expect(responseLower).toContain('zf4');

        const { data: conversation } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('id', conversationId)
          .single();

        expect(conversation?.metadata).toBeDefined();
      } finally {
        await supabase.from('organizations').delete().eq('id', org!.id);
      }
    }, 60000);
  });
});
