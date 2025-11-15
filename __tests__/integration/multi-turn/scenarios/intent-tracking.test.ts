/**
 * Test: Conversation intent change tracking
 */

import { TESTS } from '../scenarios';
import { sendMessage, fetchMetadataFromDB } from '../chat-client';
import { TestResult } from '../types';

export async function runIntentTrackingTest(testConversations: string[]): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 11: Conversation intent change tracking');

    const turn1 = await sendMessage('I need to find a hydraulic pump');
    testConversations.push(turn1.conversationId);

    const turn1IsProductSearch =
      turn1.response.toLowerCase().includes('pump') ||
      turn1.response.toLowerCase().includes('product');

    const turn2 = await sendMessage(
      'Actually, can you help me track my order #12345?',
      turn1.conversationId
    );

    const turn2IsOrderLookup =
      turn2.response.toLowerCase().includes('order') ||
      turn2.response.toLowerCase().includes('12345') ||
      turn2.response.toLowerCase().includes('track');

    const metadata = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: TESTS.INTENT_TRACKING,
      passed: turn1IsProductSearch && turn2IsOrderLookup && metadata.entities !== undefined,
      reason:
        turn1IsProductSearch && turn2IsOrderLookup
          ? '✅ Tracked both product and order intents'
          : '❌ Failed to track intent changes',
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.INTENT_TRACKING,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
