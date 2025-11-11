import { TESTS } from './scenarios';
import { sendMessage, fetchMetadataFromDB } from './chat-client';
import { TestResult, AccuracyResult } from './types';

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

export async function runMetadataPersistenceTest(testConversations: string[]): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 12: Metadata persistence after each turn');

    const turn1 = await sendMessage('Show me pumps');
    testConversations.push(turn1.conversationId);
    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    if (dbMetadata1.currentTurn !== 1) {
      return {
        testName: TESTS.METADATA_PERSISTENCE,
        passed: false,
        reason: `Turn 1 metadata incorrect: expected 1, got ${dbMetadata1.currentTurn}`,
      };
    }

    const turn2 = await sendMessage('What about the first one?', turn1.conversationId);
    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);
    if (dbMetadata2.currentTurn !== 2) {
      return {
        testName: TESTS.METADATA_PERSISTENCE,
        passed: false,
        reason: `Turn 2 metadata incorrect: expected 2, got ${dbMetadata2.currentTurn}`,
      };
    }

    await sendMessage('Tell me more about it', turn2.conversationId);
    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);

    const allPersisted =
      dbMetadata3.currentTurn === 3 &&
      dbMetadata3.currentTurn > dbMetadata2.currentTurn &&
      dbMetadata2.currentTurn > dbMetadata1.currentTurn;

    return {
      testName: TESTS.METADATA_PERSISTENCE,
      passed: allPersisted,
      reason: allPersisted
        ? '✅ Metadata persisted correctly across all turns'
        : '❌ Metadata not cumulative',
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.METADATA_PERSISTENCE,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function runMetadataUpdatesTest(testConversations: string[]): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 13: Metadata updates when context changes');

    const turn1 = await sendMessage('Show me ZF5 pumps');
    testConversations.push(turn1.conversationId);

    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    if (dbMetadata1.currentTurn !== 1) {
      return {
        testName: TESTS.METADATA_UPDATES,
        passed: false,
        reason: 'Initial metadata not saved',
      };
    }

    const turn2 = await sendMessage('Sorry, I meant ZF4 not ZF5', turn1.conversationId);
    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);

    const hasCorrections = Array.isArray(dbMetadata2.corrections) && dbMetadata2.corrections.length > 0;
    const correctionDetected = hasCorrections
      ? /ZF5/i.test(dbMetadata2.corrections[0].originalValue) &&
        /ZF4/i.test(dbMetadata2.corrections[0].correctedValue)
      : false;

    const turn3 = await sendMessage('What are the prices for those?', turn2.conversationId);
    const mentionsWrongModel = turn3.response.toLowerCase().includes('zf5');
    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: TESTS.METADATA_UPDATES,
      passed: hasCorrections && !mentionsWrongModel && dbMetadata3.currentTurn === 3,
      reason: hasCorrections
        ? correctionDetected
          ? '✅ Correction detected and metadata updated'
          : '✅ Corrections tracked, history preserved'
        : '❌ Correction not detected in metadata',
      conversationId: turn1.conversationId,
    };
  } catch (error) {
    return {
      testName: TESTS.METADATA_UPDATES,
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
