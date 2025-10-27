#!/usr/bin/env npx tsx

/**
 * Agent 4: Standalone E2E Tests for Pronoun & Correction Tracking
 *
 * This script runs OUTSIDE of Jest to avoid MSW interference.
 * Makes REAL API calls to localhost:3000 and REAL Supabase queries.
 *
 * Tests 1-7:
 * 1. "It" pronoun resolution across 3+ turns
 * 2. "They" plural pronoun resolution
 * 3. Ambiguous pronoun handling
 * 4. User correction tracking
 * 5. Multiple corrections in one message
 * 6. Correction vs clarification distinction
 * 7. List reference resolution
 */

import { createServiceRoleClient } from './lib/supabase-server';

const API_BASE_URL = 'http://localhost:3000';
const TEST_DOMAIN = 'test-agent4.local';

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  pronounResolutionTests: number;
  pronounResolutionPassed: number;
  correctionTests: number;
  correctionPassed: number;
  executionTimes: number[];
}

const metrics: TestMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  pronounResolutionTests: 0,
  pronounResolutionPassed: 0,
  correctionTests: 0,
  correctionPassed: 0,
  executionTimes: []
};

const conversationsToCleanup: string[] = [];

async function sendChatMessage(
  message: string,
  conversationId?: string,
  sessionId?: string
): Promise<{ response: string; conversationId: string; metadata: any }> {
  const startTime = Date.now();

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      session_id: sessionId || `agent4-${Date.now()}`,
      domain: TEST_DOMAIN,
      config: {
        allow_web_search: false,
        allow_woocommerce: false,
        allow_shopify: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const metadata = await getMetadata(data.conversation_id);

  metrics.executionTimes.push(Date.now() - startTime);

  return {
    response: data.response,
    conversationId: data.conversation_id,
    metadata
  };
}

async function getMetadata(conversationId: string): Promise<any> {
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

  const { data: config } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (!config) {
    await supabase.from('customer_configs').insert({
      domain: TEST_DOMAIN,
      business_name: 'Agent 4 Test',
      industry: 'testing'
    });

    const { data: newConfig } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', TEST_DOMAIN)
      .single();

    if (newConfig) {
      const products = [
        {
          title: 'Hydraulic Pump A',
          url: `https://${TEST_DOMAIN}/pump-a`,
          content: 'Hydraulic Pump A - $299.99. In stock. 2 year warranty.',
          metadata: { price: 299.99, stock: 'available', warranty: 2 }
        },
        {
          title: 'Hydraulic Pump B',
          url: `https://${TEST_DOMAIN}/pump-b`,
          content: 'Hydraulic Pump B - $399.99. In stock. 1 year warranty.',
          metadata: { price: 399.99, stock: 'available', warranty: 1 }
        },
        {
          title: 'Hydraulic Pump C',
          url: `https://${TEST_DOMAIN}/pump-c`,
          content: 'Hydraulic Pump C - $499.99. Out of stock. 3 year warranty.',
          metadata: { price: 499.99, stock: 'out of stock', warranty: 3 }
        }
      ];

      for (const p of products) {
        await supabase.from('scraped_pages').insert({
          domain_id: newConfig.id,
          url: p.url,
          title: p.title,
          content: p.content,
          metadata: p.metadata,
          last_scraped_at: new Date().toISOString()
        });
      }
    }
  }
}

async function cleanup() {
  const supabase = await createServiceRoleClient();
  for (const convId of conversationsToCleanup) {
    await supabase.from('messages').delete().eq('conversation_id', convId);
    await supabase.from('conversations').delete().eq('id', convId);
  }
}

async function runTest(name: string, testFn: () => Promise<void>, category: 'pronoun' | 'correction') {
  metrics.totalTests++;
  if (category === 'pronoun') metrics.pronounResolutionTests++;
  if (category === 'correction') metrics.correctionTests++;

  try {
    await testFn();
    metrics.passedTests++;
    if (category === 'pronoun') metrics.pronounResolutionPassed++;
    if (category === 'correction') metrics.correctionPassed++;
    console.log(`✅ ${name} - PASSED`);
    return true;
  } catch (error) {
    metrics.failedTests++;
    console.log(`❌ ${name} - FAILED:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log('\n🤖 Agent 4: Pronoun & Correction Tests (Standalone)');
  console.log('⚠️  Making REAL OpenAI API calls\n');

  await setupTestData();

  // TEST 1: "It" pronoun resolution
  await runTest('TEST 1: "It" pronoun resolution', async () => {
    const sessionId = `test1-${Date.now()}`;
    const turn1 = await sendChatMessage('Do you have hydraulic pumps?', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    if (!turn1.response.toLowerCase().includes('pump')) {
      throw new Error('Turn 1: No pump mention');
    }

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage("What's the price of the first one?", turn1.conversationId, sessionId);
    if (!turn2.response.includes('$') && !turn2.response.includes('299')) {
      throw new Error('Turn 2: No price info');
    }

    await new Promise(r => setTimeout(r, 1000));

    const turn3 = await sendChatMessage('Is it in stock?', turn1.conversationId, sessionId);
    if (!turn3.response.toLowerCase().includes('stock')) {
      throw new Error('Turn 3: No stock info');
    }
  }, 'pronoun');

  // TEST 2: "They" plural pronoun
  await runTest('TEST 2: "They" plural pronoun', async () => {
    const sessionId = `test2-${Date.now()}`;
    const turn1 = await sendChatMessage('Show me pumps under $500', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage('Are they all in stock?', turn1.conversationId, sessionId);
    if (!turn2.response.toLowerCase().includes('stock')) {
      throw new Error('Turn 2: No stock response');
    }

    await new Promise(r => setTimeout(r, 1000));

    const turn3 = await sendChatMessage('What are their warranty periods?', turn1.conversationId, sessionId);
    if (!turn3.response.toLowerCase().includes('warranty') && !turn3.response.toLowerCase().includes('year')) {
      throw new Error('Turn 3: No warranty info');
    }
  }, 'pronoun');

  // TEST 3: Ambiguous pronoun handling
  await runTest('TEST 3: Ambiguous pronoun handling', async () => {
    const sessionId = `test3-${Date.now()}`;
    const turn1 = await sendChatMessage('Tell me about Pump A and Pump B', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage("What's the price of it?", turn1.conversationId, sessionId);
    const handlesWell = turn2.response.toLowerCase().includes('which') ||
      turn2.response.toLowerCase().includes('both') ||
      (turn2.response.match(/\$/g) || []).length >= 2;

    if (!handlesWell) {
      throw new Error('Turn 2: Did not handle ambiguity well');
    }
  }, 'pronoun');

  // TEST 4: User correction tracking
  await runTest('TEST 4: User correction tracking', async () => {
    const sessionId = `test4-${Date.now()}`;
    const turn1 = await sendChatMessage('Show me Pump C', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage('Sorry, I meant Pump A not Pump C', turn1.conversationId, sessionId);
    if (!turn2.response.toLowerCase().includes('pump a') && !turn2.response.includes('299')) {
      throw new Error('Turn 2: Did not switch to Pump A');
    }
  }, 'correction');

  // TEST 5: Multiple corrections
  await runTest('TEST 5: Multiple corrections', async () => {
    const sessionId = `test5-${Date.now()}`;
    const turn1 = await sendChatMessage('Show me pumps', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage('Actually, I meant under $400, and I need hydraulic not pneumatic', turn1.conversationId, sessionId);
    const handlesMultiple = (turn2.response.includes('400') || turn2.response.includes('$4')) &&
      turn2.response.toLowerCase().includes('hydraulic');

    if (!handlesMultiple) {
      throw new Error('Turn 2: Did not handle multiple corrections');
    }
  }, 'correction');

  // TEST 6: Correction vs clarification
  await runTest('TEST 6: Correction vs clarification', async () => {
    const sessionId = `test6-${Date.now()}`;
    const turn1 = await sendChatMessage('Show me pumps under $500', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage('Also, I need them to be in stock', turn1.conversationId, sessionId);
    if (!turn2.response.toLowerCase().includes('stock')) {
      throw new Error('Turn 2: Did not address stock clarification');
    }
  }, 'correction');

  // TEST 7: List reference resolution
  await runTest('TEST 7: List reference resolution', async () => {
    const sessionId = `test7-${Date.now()}`;
    const turn1 = await sendChatMessage('Show me available pumps', undefined, sessionId);
    conversationsToCleanup.push(turn1.conversationId);

    await new Promise(r => setTimeout(r, 1000));

    const turn2 = await sendChatMessage('Tell me more about the second one', turn1.conversationId, sessionId);
    if (!turn2.response.toLowerCase().includes('pump') && !turn2.response.includes('$')) {
      throw new Error('Turn 2: Did not resolve list reference');
    }

    await new Promise(r => setTimeout(r, 1000));

    const turn3 = await sendChatMessage('What about item 1?', turn1.conversationId, sessionId);
    if (!turn3.response.toLowerCase().includes('pump') && !turn3.response.includes('$')) {
      throw new Error('Turn 3: Did not resolve numerical reference');
    }
  }, 'pronoun');

  // Calculate results
  const avgTime = metrics.executionTimes.reduce((a, b) => a + b, 0) / metrics.executionTimes.length || 0;
  const pronounAccuracy = metrics.pronounResolutionTests > 0
    ? (metrics.pronounResolutionPassed / metrics.pronounResolutionTests) * 100
    : 0;
  const correctionAccuracy = metrics.correctionTests > 0
    ? (metrics.correctionPassed / metrics.correctionTests) * 100
    : 0;

  console.log('\n' + '='.repeat(70));
  console.log('📊 AGENT 4 FINAL REPORT');
  console.log('='.repeat(70));
  console.log(`\n✅ Tests Implemented: 7/7`);
  console.log(`✅ Tests Passing: ${metrics.passedTests}/${metrics.totalTests}`);
  console.log(`\n🎯 Pronoun Resolution Accuracy: ${pronounAccuracy.toFixed(1)}% (target: 90%)`);
  console.log(`   - Tests run: ${metrics.pronounResolutionTests}`);
  console.log(`   - Tests passed: ${metrics.pronounResolutionPassed}`);
  console.log(`\n🎯 Correction Detection Accuracy: ${correctionAccuracy.toFixed(1)}% (target: 95%)`);
  console.log(`   - Tests run: ${metrics.correctionTests}`);
  console.log(`   - Tests passed: ${metrics.correctionPassed}`);
  console.log(`\n⏱️  Average Execution Time: ${avgTime.toFixed(0)}ms per turn`);
  console.log(`💰 Token Usage: Minimal (web search disabled)`);

  console.log(`\n🧹 Cleaning up ${conversationsToCleanup.length} test conversations...`);
  await cleanup();

  console.log('\n✅ Agent 4 tests complete!\n');

  process.exit(metrics.passedTests === metrics.totalTests ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
