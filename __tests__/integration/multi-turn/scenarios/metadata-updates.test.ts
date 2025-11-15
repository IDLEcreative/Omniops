/**
 * Test: Metadata updates when context changes
 */

import { TESTS } from '../scenarios';
import { sendMessage, fetchMetadataFromDB } from '../chat-client';
import { TestResult } from '../types';

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
