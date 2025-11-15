/**
 * Test: Context accumulation across 5+ turns (CRITICAL)
 */

import { TESTS } from '../scenarios';
import { sendMessage, fetchMetadataFromDB } from '../chat-client';
import { AccuracyResult } from '../types';

export async function runContextAccumulationTest(
  testConversations: string[]
): Promise<AccuracyResult> {
  try {
    console.log('\n🧪 Test 9: Context accumulation across 5+ turns (CRITICAL)');

    const turnResults: Array<{ turn: number; success: boolean; reason: string }> = [];

    const turn1 = await sendMessage('What types of products do you have?');
    testConversations.push(turn1.conversationId);
    const turn1Success =
      turn1.response.length > 50 && !turn1.response.toLowerCase().includes("don't understand");
    turnResults.push({
      turn: 1,
      success: turn1Success,
      reason: turn1Success ? 'Provided product categories' : 'Insufficient response',
    });

    const turn2 = await sendMessage(
      'Show me the first type you mentioned',
      turn1.conversationId
    );
    const turn2Success =
      turn2.response.length > 50 &&
      !turn2.response.toLowerCase().includes('which') &&
      !turn2.response.toLowerCase().includes("don't understand");
    turnResults.push({
      turn: 2,
      success: turn2Success,
      reason: turn2Success ? 'Resolved category reference' : 'Failed to resolve',
    });

    const turn3 = await sendMessage('What are the prices?', turn2.conversationId);
    const turn3Success =
      (turn3.response.toLowerCase().includes('price') ||
        turn3.response.toLowerCase().includes('cost') ||
        turn3.response.match(/\$\d+/)) &&
      !turn3.response.toLowerCase().includes('which product');
    turnResults.push({
      turn: 3,
      success: turn3Success,
      reason: turn3Success ? 'Resolved price query' : 'Lost context',
    });

    const turn4 = await sendMessage('Are they in stock?', turn3.conversationId);
    const turn4Success =
      (turn4.response.toLowerCase().includes('stock') ||
        turn4.response.toLowerCase().includes('available')) &&
      !turn4.response.toLowerCase().includes('which one');
    turnResults.push({
      turn: 4,
      success: turn4Success,
      reason: turn4Success ? 'Resolved pronoun "they"' : 'Failed pronoun',
    });

    const turn5 = await sendMessage('Can I get more details about the first one?', turn4.conversationId);
    const turn5Success =
      turn5.response.length > 50 &&
      !turn5.response.toLowerCase().includes('which') &&
      !turn5.response.toLowerCase().includes("don't understand");
    turnResults.push({
      turn: 5,
      success: turn5Success,
      reason: turn5Success ? 'Resolved list reference' : 'Failed reference',
    });

    const successfulTurns = turnResults.filter((t) => t.success).length;
    const accuracy = (successfulTurns / turnResults.length) * 100;

    console.log('\n📊 Turn-by-turn results:');
    turnResults.forEach((result) => {
      console.log(`  Turn ${result.turn}: ${result.success ? '✅' : '❌'} ${result.reason}`);
    });
    console.log(`\n🎯 Accuracy: ${accuracy}% (${successfulTurns}/${turnResults.length})`);

    const finalMetadata = await fetchMetadataFromDB(turn1.conversationId);
    const passed = accuracy >= 86 && finalMetadata.currentTurn >= 5;

    return {
      testName: TESTS.CONTEXT_ACCUMULATION,
      passed,
      accuracy,
      reason: passed
        ? `✅ Achieved ${accuracy}% accuracy (target: 86%)`
        : `❌ Only ${accuracy}% accuracy (target: 86%)`,
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.CONTEXT_ACCUMULATION,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
