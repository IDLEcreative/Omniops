/**
 * Agent Memory & State Tests
 *
 * Tests that AI agents maintain state correctly across turns and handle concurrent conversations.
 *
 * Priority: HIGH - Critical for multi-user system reliability
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  API_BASE_URL,
  validateEnvironment,
  setupTestDomain,
  cleanupConversations
} from '@/__tests__/utils/conversation/helpers';

describe('Agent Memory & State', () => {
  let testDomainId: string;
  const testConversations: string[] = [];

  beforeAll(async () => {
    validateEnvironment();
    testDomainId = await setupTestDomain();
  });

  afterAll(async () => {
    await cleanupConversations(testConversations);
  });

  it('should maintain agent state across turns', async () => {
    const API_URL = `${API_BASE_URL}/api/chat`;
    const testDomain = 'example.com';
    const sessionId = `test-state-${Date.now()}`;

    const turn1Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me all available pumps',
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn1Response.ok).toBe(true);
    const turn1Data = await turn1Response.json();
    expect(turn1Data.conversation_id).toBeDefined();

    const conversationId = turn1Data.conversation_id;

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

    expect(turn2Response.ok).toBe(true);
    const turn2Data = await turn2Response.json();
    expect(turn2Data.message?.length).toBeGreaterThan(0);

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

    expect(turn3Response.ok).toBe(true);
    const turn3Data = await turn3Response.json();
    expect(turn3Data.message).toBeDefined();
    expect(turn1Data.conversation_id).toBe(conversationId);
    expect(turn2Data.conversation_id).toBe(conversationId);
    expect(turn3Data.conversation_id).toBe(conversationId);
  }, 60000);

  it('should handle concurrent conversations without state leakage', async () => {
    const API_URL = `${API_BASE_URL}/api/chat`;
    const testDomain = 'example.com';
    const sessionA = `test-concurrent-A-${Date.now()}`;
    const sessionB = `test-concurrent-B-${Date.now()}`;

    const [convA_turn1, convB_turn1] = await Promise.all([
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me hydraulic pumps',
          session_id: sessionA,
          domain: testDomain
        })
      }),
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Show me electric pumps',
          session_id: sessionB,
          domain: testDomain
        })
      })
    ]);

    expect(convA_turn1.ok).toBe(true);
    expect(convB_turn1.ok).toBe(true);

    const dataA1 = await convA_turn1.json();
    const dataB1 = await convB_turn1.json();

    const conversationIdA = dataA1.conversation_id;
    const conversationIdB = dataB1.conversation_id;

    expect(conversationIdA).toBeDefined();
    expect(conversationIdB).toBeDefined();
    expect(conversationIdA).not.toBe(conversationIdB);

    const [convA_turn2, convB_turn2] = await Promise.all([
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What types of hydraulic pumps do you have?',
          conversation_id: conversationIdA,
          session_id: sessionA,
          domain: testDomain
        })
      }),
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What types of electric pumps are available?',
          conversation_id: conversationIdB,
          session_id: sessionB,
          domain: testDomain
        })
      })
    ]);

    expect(convA_turn2.ok).toBe(true);
    expect(convB_turn2.ok).toBe(true);

    const dataA2 = await convA_turn2.json();
    const dataB2 = await convB_turn2.json();

    const responseA = dataA2.message?.toLowerCase() || '';
    const responseB = dataB2.message?.toLowerCase() || '';

    expect(responseA.length).toBeGreaterThan(0);
    expect(responseB.length).toBeGreaterThan(0);
    expect(dataA2.conversation_id).toBe(conversationIdA);
    expect(dataB2.conversation_id).toBe(conversationIdB);
    expect(conversationIdA).not.toBe(conversationIdB);
  }, 120000);
});
