/**
 * Test: Out-of-bounds list reference handling
 */

import { TESTS } from '../scenarios';
import { sendMessage } from '../chat-client';
import { TestResult } from '../types';

export async function runOutOfBoundsTest(testConversations: string[]): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 8: Out-of-bounds list reference handling');

    const turn1 = await sendMessage('Show me your top 3 products');
    testConversations.push(turn1.conversationId);

    if (!turn1.metadata.lists) {
      return {
        testName: TESTS.OUT_OF_BOUNDS,
        passed: false,
        reason: 'No list created in Turn 1',
      };
    }

    const turn2 = await sendMessage('Tell me about item 5', turn1.conversationId);
    const responseLower = turn2.response.toLowerCase();
    const hasCorrectBehavior =
      responseLower.includes('only') ||
      responseLower.includes('three') ||
      responseLower.includes('3') ||
      responseLower.includes('which one') ||
      responseLower.includes('clarif');

    const hallucinatedItem5 = /item 5.*(?:cost|price|feature)/i.test(turn2.response);

    return {
      testName: TESTS.OUT_OF_BOUNDS,
      passed: hasCorrectBehavior && !hallucinatedItem5,
      reason: hasCorrectBehavior && !hallucinatedItem5
        ? 'AI correctly handled out-of-bounds reference'
        : hallucinatedItem5
          ? 'AI hallucinated item 5'
          : 'AI did not explain limitation',
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.OUT_OF_BOUNDS,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
