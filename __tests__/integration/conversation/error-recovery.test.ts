/**
 * Error Recovery Tests
 *
 * Tests AI's ability to recover from context loss and handle extremely long conversations.
 *
 * Priority: MEDIUM - Critical for production reliability and edge cases
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  API_BASE_URL,
  validateEnvironment,
  setupTestDomain,
  cleanupConversations
} from '@/__tests__/utils/conversation/helpers';

describe('Error Recovery', () => {
  let testDomainId: string;
  const testConversations: string[] = [];

  beforeAll(async () => {
    validateEnvironment();
    testDomainId = await setupTestDomain();
  });

  afterAll(async () => {
    await cleanupConversations(testConversations);
  });

  it('should recover from context loss gracefully', async () => {
    const API_URL = `${API_BASE_URL}/api/chat`;
    const testDomain = 'example.com';
    const sessionId = `test-recovery-${Date.now()}`;

    const turn1Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn1Response.ok).toBe(true);
    const turn1Data = await turn1Response.json();
    const conversationId = turn1Data.conversation_id;

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

    expect(turn2Response.ok).toBe(true);
    const turn2Data = await turn2Response.json();
    expect(turn2Data.message?.length).toBeGreaterThan(0);
    expect(turn2Data.conversation_id).toBe(conversationId);

    const turn3Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need help finding pumps',
        conversation_id: conversationId,
        session_id: sessionId,
        domain: testDomain
      })
    });

    expect(turn3Response.ok).toBe(true);
    const turn3Data = await turn3Response.json();
    expect(turn3Data.message?.length).toBeGreaterThan(0);
    expect(turn3Data.conversation_id).toBe(conversationId);
  }, 60000);

  it('should handle extremely long conversations', async () => {
    const API_URL = `${API_BASE_URL}/api/chat`;
    const testDomain = 'example.com';
    const sessionId = `test-long-conv-${Date.now()}`;
    const turnCount = 22;

    let conversationId: string | undefined;
    const executionTimes: number[] = [];

    const messages = [
      'Hello, I need help',
      'Show me available pumps',
      'What types do you have?',
      'Tell me about hydraulic pumps',
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

      expect(response.ok).toBe(true);
      const data = await response.json();

      if (!conversationId) {
        conversationId = data.conversation_id;
      }

      expect(data.conversation_id).toBe(conversationId);
      expect(data.message).toBeDefined();
      expect(data.message.length).toBeGreaterThan(0);
    }

    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxExecutionTime = Math.max(...executionTimes);

    expect(avgExecutionTime).toBeLessThan(10000);
    expect(maxExecutionTime).toBeLessThan(20000);

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

    expect(finalResponse.ok).toBe(true);
    const finalData = await finalResponse.json();
    expect(finalData.message).toBeDefined();
    expect(finalData.message.length).toBeGreaterThan(0);

    console.log(`[Long Conversation Test] Completed ${turnCount} turns`);
    console.log(`[Long Conversation Test] Avg execution time: ${avgExecutionTime.toFixed(0)}ms`);
    console.log(`[Long Conversation Test] Max execution time: ${maxExecutionTime.toFixed(0)}ms`);
  }, 240000);
});
