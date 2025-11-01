/**
 * Complete Agent Flow - E2E Integration Tests (Metadata Tracking)
 *
 * Tests metadata tracking and max iteration limits
 *
 * Priority: CRITICAL (Week 1 - Must Have)
 */

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

process.env.E2E_TEST = 'true';

if (process.env.NODE_ENV !== 'production') {

  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
  }
}

jest.unmock('@supabase/supabase-js');

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

async function getSupabaseClient() {
  const supabase = createServiceRoleClientSync();
  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }
  return supabase;
}

async function createTestOrganizationAndConfig(
  testName: string,
  extraFields: Record<string, any> = {}
) {
  const supabase = await getSupabaseClient();
  const testDomain = `test-${testName}-${Date.now()}.example.com`;

  const { data: org, error: orgError} = await supabase
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

describe('Complete Agent Flow - E2E (Metadata Tracking)', () => {
  beforeAll(async () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for E2E tests');
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
  });

  describe('ReAct Loop Behavior', () => {
    it('should respect max iteration limit', async () => {
      const testDomain = `test-max-iterations-${Date.now()}.example.com`;
      const supabase = await getSupabaseClient();

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Org - Max Iterations',
          slug: `test-org-${Date.now()}`
        })
        .select()
        .single();

      const { data: customerConfig } = await supabase
        .from('customer_configs')
        .insert({
          domain: testDomain,
          business_name: 'Max Iterations Test',
          organization_id: org!.id,
          settings: {
            ai: {
              maxSearchIterations: 2
            }
          }
        })
        .select()
        .single();

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
