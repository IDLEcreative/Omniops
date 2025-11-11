/**
 * Agent 4: Correction Tracking & List References (Tests 4-7)
 * REAL OpenAI + Supabase Integration Tests
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { sendChatMessage } from './agent4-correction/chat-client';
import { ensureServerAvailable, setupTestData } from './agent4-correction/setup';
import { cleanupConversations, printSummary } from './agent4-correction/reporting';
import { testMetrics } from './agent4-correction/metrics';
import { API_BASE_URL } from './agent4-correction/constants';

describe('Agent 4: Correction Tracking & List References', () => {
  const testConversations: string[] = [];

  beforeAll(async () => {
    await ensureServerAvailable();

    if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
      console.warn('⚠️  Dev server not running at', API_BASE_URL);
      console.warn('⚠️  Skipping Agent 4 integration tests (requires running server)');
      console.warn('💡 Run "npm run dev" in another terminal to enable these tests\n');
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required');
    }

    await setupTestData();

    console.log('\n🤖 Agent 4: Correction Tracking & List References Starting');
    console.log('⚠️  Making REAL OpenAI API calls - monitoring tokens\n');
  });

  afterAll(async () => {
    await cleanupConversations(testConversations);
    printSummary(testConversations.length, testMetrics);
  });

  describe('Correction Tracking', () => {
    it(
      'TEST 4: should track user corrections',
      async () => {
        if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
          console.log('⏭️  Skipping TEST 4 (server not available)');
          return;
        }

        testMetrics.totalTests++;
        testMetrics.correctionTests++;

        const sessionId = `test4-correction-${Date.now()}`;
        let conversationId: string | undefined;

        try {
          const turn1 = await sendChatMessage('Show me Pump C', { conversationId, sessionId });
          conversationId = turn1.conversationId;
          testConversations.push(conversationId);

          expect(turn1.response.toLowerCase()).toContain('pump');

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const turn2 = await sendChatMessage('Sorry, I meant Pump A not Pump C', {
            conversationId,
            sessionId,
          });

          const correctionHandled =
            turn2.response.toLowerCase().includes('pump a') || turn2.response.includes('299');
          expect(correctionHandled).toBe(true);
          expect(turn2.response.toLowerCase()).not.toContain('pump c');

          if (turn2.metadata?.corrections) {
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
      },
      60000
    );

    it(
      'TEST 5: should handle multiple corrections in one message',
      async () => {
        if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
          console.log('⏭️  Skipping TEST 5 (server not available)');
          return;
        }

        testMetrics.totalTests++;
        testMetrics.correctionTests++;

        const sessionId = `test5-multi-correction-${Date.now()}`;
        let conversationId: string | undefined;

        try {
          const turn1 = await sendChatMessage('Show me pumps', { conversationId, sessionId });
          conversationId = turn1.conversationId;
          testConversations.push(conversationId);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const turn2 = await sendChatMessage(
            'Actually, I meant under $400, and I need Category A not Category B',
            { conversationId, sessionId }
          );

          const handlesMultiple =
            (turn2.response.includes('400') || turn2.response.includes('$4')) &&
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
      },
      60000
    );

    it(
      'TEST 6: should distinguish correction from clarification',
      async () => {
        if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
          console.log('⏭️  Skipping TEST 6 (server not available)');
          return;
        }

        testMetrics.totalTests++;
        testMetrics.correctionTests++;

        const sessionId = `test6-clarification-${Date.now()}`;
        let conversationId: string | undefined;

        try {
          const turn1 = await sendChatMessage('Show me hydraulic pumps under $500', {
            conversationId,
            sessionId,
          });
          conversationId = turn1.conversationId;
          testConversations.push(conversationId);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const turn2 = await sendChatMessage('Also, I need them to be in stock', {
            conversationId,
            sessionId,
          });

          const addressesNewConstraint =
            turn2.response.toLowerCase().includes('stock') ||
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
      },
      60000
    );
  });

  describe('List Reference Resolution', () => {
    it(
      'TEST 7: should resolve list references (item 2, second one)',
      async () => {
        if (process.env.SKIP_INTEGRATION_TESTS === 'true') {
          console.log('⏭️  Skipping TEST 7 (server not available)');
          return;
        }

        testMetrics.totalTests++;
        testMetrics.listReferenceTests++;

        const sessionId = `test7-list-ref-${Date.now()}`;
        let conversationId: string | undefined;

        try {
          const turn1 = await sendChatMessage('Show me available pumps', { conversationId, sessionId });
          conversationId = turn1.conversationId;
          testConversations.push(conversationId);

          expect(turn1.response.length).toBeGreaterThan(50);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const turn2 = await sendChatMessage('Tell me more about the second one', {
            conversationId,
            sessionId,
          });

          const resolvesReference =
            turn2.response.toLowerCase().includes('pump') ||
            turn2.response.includes('$') ||
            turn2.response.toLowerCase().includes('warranty');

          expect(resolvesReference).toBe(true);
          expect(turn2.response.toLowerCase()).not.toContain("don't know which");

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const turn3 = await sendChatMessage('What about item 1?', { conversationId, sessionId });

          const resolvesNumerical =
            turn3.response.toLowerCase().includes('pump') || turn3.response.includes('$');
          expect(resolvesNumerical).toBe(true);

          if (turn3.metadata?.lists) {
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
      },
      60000
    );
  });
});
