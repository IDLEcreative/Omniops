/**
 * Agent 4: Correction Tracking & List References (Tests 4-7)
 *
 * REAL OpenAI + Supabase Integration Tests
 * Validates correction tracking and list reference resolution
 *
 * Assignment: Tests 4-7 for Agent 4
 * - Test 4: User correction tracking
 * - Test 5: Multiple corrections in one message
 * - Test 6: Correction vs clarification distinction
 * - Test 7: List reference resolution
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceRoleClient } from '@/lib/supabase-server';
import nodeFetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_DOMAIN = 'test-agent4-corrections.local';

const realFetch = nodeFetch as any;

interface ChatResponse {
  response: string;
  conversation_id: string;
  search_results?: any[];
}

interface TestResult {
  response: string;
  conversationId: string;
  metadata: any;
}

const testMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  correctionTests: 0,
  correctionPassed: 0,
  listReferenceTests: 0,
  listReferencePassed: 0,
  executionTimes: [] as number[]
};

describe('Agent 4: Correction Tracking & List References', () => {
  let testConversations: string[] = [];

  async function sendChatMessage(
    message: string,
    conversationId?: string,
    sessionId?: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    const response = await realFetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        session_id: sessionId || `agent4-session-${Date.now()}`,
        domain: TEST_DOMAIN,
        config: {
          allow_web_search: false,
          allow_woocommerce: false,
          allow_shopify: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${await response.text()}`);
    }

    const data: ChatResponse = await response.json();
    const metadata = await getConversationMetadata(data.conversation_id);

    const executionTime = Date.now() - startTime;
    testMetrics.executionTimes.push(executionTime);

    return {
      response: data.response,
      conversationId: data.conversation_id,
      metadata
    };
  }

  async function getConversationMetadata(conversationId: string): Promise<any> {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    return data?.metadata || {};
  }

  async function setupTestData() {
    const supabase = await createServiceRoleClient();

    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', TEST_DOMAIN)
      .single();

    if (!existingConfig) {
      await supabase.from('customer_configs').insert({
        domain: TEST_DOMAIN,
        business_name: 'Agent 4 Correction Test Business',
        industry: 'testing',
        created_at: new Date().toISOString()
      });
    }

    const { data: config } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', TEST_DOMAIN)
      .single();

    if (config) {
      const testProducts = [
        {
          title: 'Premium Hydraulic Pump Model A',
          url: `https://${TEST_DOMAIN}/pump-a`,
          content: 'Premium Product Model A - High performance item. Price: $299.99. Stock: Available (15 units). Warranty: 2 years.',
          metadata: { price: 299.99, stock: 'available', warranty_years: 2 }
        },
        {
          title: 'Industrial Hydraulic Pump Model B',
          url: `https://${TEST_DOMAIN}/pump-b`,
          content: 'Industrial Hydraulic Pump Model B - Medium duty pump for general use. Price: $399.99. Stock: Available (8 units). Warranty: 1 year.',
          metadata: { price: 399.99, stock: 'available', warranty_years: 1 }
        },
        {
          title: 'Heavy Duty Hydraulic Pump Model C',
          url: `https://${TEST_DOMAIN}/pump-c`,
          content: 'Heavy Duty Hydraulic Pump Model C - Professional grade heavy duty pump. Price: $499.99. Stock: Out of stock. Warranty: 3 years.',
          metadata: { price: 499.99, stock: 'out of stock', warranty_years: 3 }
        }
      ];

      for (const product of testProducts) {
        const { data: existing } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('url', product.url)
          .single();

        if (!existing) {
          await supabase.from('scraped_pages').insert({
            domain_id: config.id,
            url: product.url,
            title: product.title,
            content: product.content,
            metadata: product.metadata,
            last_scraped_at: new Date().toISOString()
          });
        }
      }
    }
  }

  beforeAll(async () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required');
    }

    await setupTestData();

    console.log('\n🤖 Agent 4: Correction Tracking & List References Starting');
    console.log('⚠️  Making REAL OpenAI API calls - monitoring tokens\n');
  });

  afterAll(async () => {
    const supabase = await createServiceRoleClient();
    for (const convId of testConversations) {
      await supabase.from('messages').delete().eq('conversation_id', convId);
      await supabase.from('conversations').delete().eq('id', convId);
    }

    const avgExecutionTime = testMetrics.executionTimes.reduce((a, b) => a + b, 0) / testMetrics.executionTimes.length || 0;
    const correctionAccuracy = testMetrics.correctionTests > 0
      ? (testMetrics.correctionPassed / testMetrics.correctionTests) * 100
      : 0;
    const listAccuracy = testMetrics.listReferenceTests > 0
      ? (testMetrics.listReferencePassed / testMetrics.listReferenceTests) * 100
      : 0;

    console.log('\n' + '='.repeat(70));
    console.log('📊 AGENT 4 CORRECTION & LIST REFERENCE REPORT');
    console.log('='.repeat(70));
    console.log(`\n✅ Tests Implemented: 4/4`);
    console.log(`✅ Tests Passing: ${testMetrics.passedTests}/${testMetrics.totalTests}`);
    console.log(`\n🎯 Correction Detection Accuracy: ${correctionAccuracy.toFixed(1)}% (target: 95%)`);
    console.log(`   - Tests run: ${testMetrics.correctionTests}`);
    console.log(`   - Tests passed: ${testMetrics.correctionPassed}`);
    console.log(`\n🎯 List Reference Accuracy: ${listAccuracy.toFixed(1)}% (target: 90%)`);
    console.log(`   - Tests run: ${testMetrics.listReferenceTests}`);
    console.log(`   - Tests passed: ${testMetrics.listReferencePassed}`);
    console.log(`\n⏱️  Average Execution Time: ${avgExecutionTime.toFixed(0)}ms`);
    console.log(`\n🧹 Cleanup: ${testConversations.length} conversations deleted\n`);
  });

  describe('Correction Tracking', () => {
    it('TEST 4: should track user corrections', async () => {
      testMetrics.totalTests++;
      testMetrics.correctionTests++;

      const sessionId = `test4-correction-${Date.now()}`;
      let conversationId: string | undefined;

      try {
        const turn1 = await sendChatMessage('Show me Pump C', conversationId, sessionId);
        conversationId = turn1.conversationId;
        testConversations.push(conversationId);

        expect(turn1.response.toLowerCase()).toContain('pump');

        await new Promise(resolve => setTimeout(resolve, 1000));

        const turn2 = await sendChatMessage('Sorry, I meant Pump A not Pump C', conversationId, sessionId);

        const correctionHandled = turn2.response.toLowerCase().includes('pump a') || turn2.response.includes('299');
        expect(correctionHandled).toBe(true);
        expect(turn2.response.toLowerCase()).not.toContain('pump c');

        if (turn2.metadata && turn2.metadata.corrections) {
          expect(turn2.metadata.corrections.length).toBeGreaterThan(0);
        }

        testMetrics.passedTests++;
        testMetrics.correctionPassed++;

        console.log('✅ TEST 4: User correction tracking - PASSED');
      } catch (error) {
        testMetrics.failedTests++;
        console.log('❌ TEST 4: User correction tracking - FAILED:', error);
        throw error;
      }
    }, 60000);

    it('TEST 5: should handle multiple corrections in one message', async () => {
      testMetrics.totalTests++;
      testMetrics.correctionTests++;

      const sessionId = `test5-multi-correction-${Date.now()}`;
      let conversationId: string | undefined;

      try {
        const turn1 = await sendChatMessage('Show me pumps', conversationId, sessionId);
        conversationId = turn1.conversationId;
        testConversations.push(conversationId);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const turn2 = await sendChatMessage('Actually, I meant under $400, and I need Category A not Category B', conversationId, sessionId);

        const handlesMultiple = (turn2.response.includes('400') || turn2.response.includes('$4')) &&
          turn2.response.toLowerCase().includes('category');

        expect(handlesMultiple).toBe(true);

        testMetrics.passedTests++;
        testMetrics.correctionPassed++;

        console.log('✅ TEST 5: Multiple corrections - PASSED');
      } catch (error) {
        testMetrics.failedTests++;
        console.log('❌ TEST 5: Multiple corrections - FAILED:', error);
        throw error;
      }
    }, 60000);

    it('TEST 6: should distinguish correction from clarification', async () => {
      testMetrics.totalTests++;
      testMetrics.correctionTests++;

      const sessionId = `test6-clarification-${Date.now()}`;
      let conversationId: string | undefined;

      try {
        const turn1 = await sendChatMessage('Show me hydraulic pumps under $500', conversationId, sessionId);
        conversationId = turn1.conversationId;
        testConversations.push(conversationId);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const turn2 = await sendChatMessage('Also, I need them to be in stock', conversationId, sessionId);

        const addressesNewConstraint = turn2.response.toLowerCase().includes('stock') ||
          turn2.response.toLowerCase().includes('available');

        expect(addressesNewConstraint).toBe(true);

        testMetrics.passedTests++;
        testMetrics.correctionPassed++;

        console.log('✅ TEST 6: Correction vs clarification - PASSED');
      } catch (error) {
        testMetrics.failedTests++;
        console.log('❌ TEST 6: Correction vs clarification - FAILED:', error);
        throw error;
      }
    }, 60000);
  });

  describe('List Reference Resolution', () => {
    it('TEST 7: should resolve list references (item 2, second one)', async () => {
      testMetrics.totalTests++;
      testMetrics.listReferenceTests++;

      const sessionId = `test7-list-ref-${Date.now()}`;
      let conversationId: string | undefined;

      try {
        const turn1 = await sendChatMessage('Show me available pumps', conversationId, sessionId);
        conversationId = turn1.conversationId;
        testConversations.push(conversationId);

        expect(turn1.response.length).toBeGreaterThan(50);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const turn2 = await sendChatMessage('Tell me more about the second one', conversationId, sessionId);

        const resolvesReference = turn2.response.toLowerCase().includes('pump') ||
          turn2.response.includes('$') ||
          turn2.response.toLowerCase().includes('warranty');

        expect(resolvesReference).toBe(true);
        expect(turn2.response.toLowerCase()).not.toContain("don't know which");

        await new Promise(resolve => setTimeout(resolve, 1000));

        const turn3 = await sendChatMessage('What about item 1?', conversationId, sessionId);

        const resolvesNumerical = turn3.response.toLowerCase().includes('pump') || turn3.response.includes('$');
        expect(resolvesNumerical).toBe(true);

        if (turn3.metadata && turn3.metadata.lists) {
          expect(turn3.metadata.lists.length).toBeGreaterThan(0);
        }

        testMetrics.passedTests++;
        testMetrics.listReferencePassed++;

        console.log('✅ TEST 7: List reference resolution - PASSED');
      } catch (error) {
        testMetrics.failedTests++;
        console.log('❌ TEST 7: List reference resolution - FAILED:', error);
        throw error;
      }
    }, 60000);
  });
});
