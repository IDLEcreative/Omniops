/**
 * Test: Context switching gracefully
 */

import { TESTS } from '../scenarios';
import { sendMessage, fetchMetadataFromDB } from '../chat-client';
import { TestResult } from '../types';

export async function runContextSwitchingTest(testConversations: string[]): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 10: Context switching gracefully');

    const turn1 = await sendMessage('Show me your products');
    testConversations.push(turn1.conversationId);

    const turn2 = await sendMessage('What about pricing?', turn1.conversationId);
    const turn3 = await sendMessage(
      'Actually, I want to check on my order status',
      turn2.conversationId
    );

    const turn3RecognizesSwitch =
      turn3.response.toLowerCase().includes('order') ||
      turn3.response.toLowerCase().includes('track');

    if (!turn3RecognizesSwitch) {
      return {
        testName: TESTS.CONTEXT_SWITCHING,
        passed: false,
        reason: 'Failed to recognize context switch to orders',
      };
    }

    const turn4 = await sendMessage(
      'Going back to the products, tell me about the first one',
      turn3.conversationId
    );
    const turn4RetainsContext =
      turn4.response.length > 50 && !turn4.response.toLowerCase().includes('which product');

    const metadata = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: TESTS.CONTEXT_SWITCHING,
      passed: turn4RetainsContext && metadata.currentTurn >= 4,
      reason: turn4RetainsContext
        ? '✅ Successfully switched context and returned'
        : '❌ Lost product context after switch',
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.CONTEXT_SWITCHING,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
