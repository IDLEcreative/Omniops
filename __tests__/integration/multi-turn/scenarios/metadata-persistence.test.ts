/**
 * Test: Metadata persistence after each turn
 */

import { TESTS } from '../scenarios';
import { sendMessage, fetchMetadataFromDB } from '../chat-client';
import { TestResult } from '../types';

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
