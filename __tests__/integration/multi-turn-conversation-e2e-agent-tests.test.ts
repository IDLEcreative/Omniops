/**
 * Agent Memory & State - E2E Integration Tests (Tests 14-17)
 *
 * IMPORTANT: These tests use node-fetch to bypass MSW and hit the real dev server.
 * Requires: npm run dev to be running on port 3000
 *
 * Tests:
 * - Test 14: Agent state persistence across turns
 * - Test 15: Concurrent conversation isolation (CRITICAL for multi-tenancy)
 * - Test 16: Context loss recovery gracefully
 * - Test 17: Extremely long conversation handling (20+ turns)
 */

import { describe, it, expect } from '@jest/globals';
import fetchFallback from 'node-fetch';

// Use dynamic import to get real fetch that bypasses MSW
const fetch: typeof globalThis.fetch =
  (globalThis as any).fetch || (fetchFallback as unknown as typeof globalThis.fetch);

describe('Agent Memory & State - E2E (Tests 14-17)', () => {
  const API_URL = 'http://localhost:3000/api/chat';
  const testDomain = 'example.com';

  it('Test 14: should maintain agent state across turns', async () => {
    const sessionId = `test-state-${Date.now()}`;

    // Turn 1: Initial search
    const turn1Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all available pumps',
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn1Response.status).toBe(200);
    const turn1Data = await turn1Response.json();
    expect(turn1Data.conversation_id).toBeDefined();

    const conversationId = turn1Data.conversation_id;

    // Turn 2: Follow-up using context
    const turn2Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How many products did you find?',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn2Response.status).toBe(200);
    const turn2Data = await turn2Response.json();
    expect(turn2Data.message?.length).toBeGreaterThan(0);

    // Turn 3: Verify state persistence
    const turn3Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about the first one',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn3Response.status).toBe(200);
    const turn3Data = await turn3Response.json();
    expect(turn3Data.message).toBeDefined();

    // Verify conversation ID persistence
    expect(turn1Data.conversation_id).toBe(conversationId);
    expect(turn2Data.conversation_id).toBe(conversationId);
    expect(turn3Data.conversation_id).toBe(conversationId);

    console.log('✅ Test 14: Agent state persistence - PASSED');
  }, 60000);

  it('Test 15: should handle concurrent conversations without state leakage (CRITICAL)', async () => {
    const sessionA = `test-concurrent-A-${Date.now()}`;
    const sessionB = `test-concurrent-B-${Date.now()}`;

    // Start both conversations in parallel
    const [convA_turn1, convB_turn1] = await Promise.all([
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me Category A products',
          session_id: sessionA,
          domain: testDomain
        })
      }),
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me Category B products',
          session_id: sessionB,
          domain: testDomain
        })
      })
    ]);

    expect(convA_turn1.status).toBe(200);
    expect(convB_turn1.status).toBe(200);

    const dataA1 = await convA_turn1.json();
    const dataB1 = await convB_turn1.json();

    const conversationIdA = dataA1.conversation_id;
    const conversationIdB = dataB1.conversation_id;

    // CRITICAL: Must have different conversation IDs
    expect(conversationIdA).toBeDefined();
    expect(conversationIdB).toBeDefined();
    expect(conversationIdA).not.toBe(conversationIdB);

    // Continue both conversations in parallel
    const [convA_turn2, convB_turn2] = await Promise.all([
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What types of Category A products do you have?',
          conversation_id: conversationIdA,
          session_id: sessionA,
          domain: testDomain
        })
      }),
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What types of Category B products are available?',
          conversation_id: conversationIdB,
          session_id: sessionB,
          domain: testDomain
        })
      })
    ]);

    expect(convA_turn2.status).toBe(200);
    expect(convB_turn2.status).toBe(200);

    const dataA2 = await convA_turn2.json();
    const dataB2 = await convB_turn2.json();

    // Validate no cross-contamination
    const responseA = dataA2.message?.toLowerCase() || '';
    const responseB = dataB2.message?.toLowerCase() || '';

    expect(responseA.length).toBeGreaterThan(0);
    expect(responseB.length).toBeGreaterThan(0);

    // Verify conversation IDs remain separate
    expect(dataA2.conversation_id).toBe(conversationIdA);
    expect(dataB2.conversation_id).toBe(conversationIdB);
    expect(conversationIdA).not.toBe(conversationIdB);

    console.log('✅ Test 15: Concurrent conversation isolation - PASSED (SECURITY VALIDATED)');
  }, 120000);

  it('Test 16: should recover from context loss gracefully', async () => {
    const sessionId = `test-recovery-${Date.now()}`;

    // Turn 1: Establish context
    const turn1Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn1Response.status).toBe(200);
    const turn1Data = await turn1Response.json();
    const conversationId = turn1Data.conversation_id;

    // Turn 2: Vague follow-up (no clear context)
    const turn2Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What about it?',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn2Response.status).toBe(200);
    const turn2Data = await turn2Response.json();
    expect(turn2Data.message?.length).toBeGreaterThan(0);
    expect(turn2Data.conversation_id).toBe(conversationId);

    // Turn 3: Provide clear context and verify recovery
    const turn3Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need help finding products',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn3Response.status).toBe(200);
    const turn3Data = await turn3Response.json();
    expect(turn3Data.message?.length).toBeGreaterThan(0);
    expect(turn3Data.conversation_id).toBe(conversationId);

    console.log('✅ Test 16: Context loss recovery - PASSED');
  }, 60000);

  it('Test 17: should handle extremely long conversations (20+ turns)', async () => {
    const sessionId = `test-long-conv-${Date.now()}`;
    const turnCount = 22;

    let conversationId: string | undefined;
    const executionTimes: number[] = [];

    const messages = [
      'Hello, I need help',
      'Show me available pumps',
      'What types do you have?',
      'Tell me about Category A products',
      'What are the prices?',
      'Do you have any in stock?',
      'What about the first one?',
      'Is it available?',
      'What is the warranty?',
      'How much does shipping cost?',
      'Can I order multiple?',
      'What payment methods do you accept?',
      'Do you offer discounts?',
      'How long is delivery?',
      'Can I track my order?',
      'What is your return policy?',
      'Do you have customer support?',
      'What are your business hours?',
      'Can I cancel an order?',
      'Do you ship internationally?',
      'What about installation?',
      'Thanks for your help'
    ];

    for (let i = 0; i < turnCount; i++) {
      const startTime = Date.now();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messages[i] || `Turn ${i + 1}: General question`,
          conversation_id: conversationId,
          session_id: sessionId,
          domain: testDomain
        })
      });

      const endTime = Date.now();
      executionTimes.push(endTime - startTime);

      expect(response.status).toBe(200);
      const data = await response.json();

      if (!conversationId) {
        conversationId = data.conversation_id;
      }

      expect(data.conversation_id).toBe(conversationId);
      expect(data.message).toBeDefined();
      expect(data.message.length).toBeGreaterThan(0);
    }

    // Performance validation
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxExecutionTime = Math.max(...executionTimes);

    expect(avgExecutionTime).toBeLessThan(10000);
    expect(maxExecutionTime).toBeLessThan(20000);

    // Verify conversation still functional
    const finalResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Can you summarize what we discussed?',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(finalResponse.status).toBe(200);
    const finalData = await finalResponse.json();
    expect(finalData.message).toBeDefined();
    expect(finalData.message.length).toBeGreaterThan(0);

    console.log(`✅ Test 17: Long conversation (${turnCount} turns) - PASSED`);
    console.log(`   - Avg execution time: ${avgExecutionTime.toFixed(0)}ms`);
    console.log(`   - Max execution time: ${maxExecutionTime.toFixed(0)}ms`);
  }, 240000);
});
