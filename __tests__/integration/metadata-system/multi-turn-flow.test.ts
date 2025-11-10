/**
 * Multi-Turn Conversation Flow Test
 *
 * Tests complete conversation simulation across 3 turns with:
 * - Entity tracking and persistence
 * - Metadata loading between turns
 * - Context accumulation
 * - Turn counter progression
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { TestResult, logTest, createTestConversation, cleanupTestConversation, loadMetadataFromConversation, saveMetadataToConversation } from '../../utils/metadata/metadata-system-helpers';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function testMultiTurnConversation(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Create conversation
    const result = await createTestConversation('test_multiturn');
    if (!result) {
      throw new Error('Failed to create test conversation');
    }

    const convId = result.conversationId;

    // Simulate Turn 1
    let manager = new ConversationMetadataManager();
    manager.incrementTurn();

    await parseAndTrackEntities(
      'Here is the [Blue Widget](https://example.com/blue) and order #111',
      'Show me the blue product',
      manager
    );

    const metadata1 = JSON.parse(manager.serialize());
    const supabase = await createServiceRoleClient();
    await supabase.from('conversations').update({ metadata: metadata1 }).eq('id', convId);

    // Simulate Turn 2 - Load previous metadata
    const loaded1 = await loadMetadataFromConversation(convId);
    if (!loaded1) {
      throw new Error('Failed to load metadata after turn 1');
    }

    manager = ConversationMetadataManager.deserialize(JSON.stringify(loaded1));
    manager.incrementTurn();

    await parseAndTrackEntities(
      'Perfect, order #111 is currently shipped',
      'What about that order?',
      manager
    );

    const metadata2 = JSON.parse(manager.serialize());
    await supabase.from('conversations').update({ metadata: metadata2 }).eq('id', convId);

    // Simulate Turn 3 - Verify context accumulation
    const loaded2 = await loadMetadataFromConversation(convId);
    if (!loaded2) {
      throw new Error('Failed to load metadata after turn 2');
    }

    manager = ConversationMetadataManager.deserialize(JSON.stringify(loaded2));

    if (manager.getCurrentTurn() !== 2) {
      throw new Error(`Turn count should be 2, got ${manager.getCurrentTurn()}`);
    }

    const contextSummary = manager.generateContextSummary();

    // Should remember the product from turn 1
    if (!contextSummary.includes('Widget') && !contextSummary.includes('Product')) {
      throw new Error('Multi-turn context should preserve previous entities');
    }

    // Cleanup
    await cleanupTestConversation(convId);

    return {
      name: 'Multi-Turn Conversation Simulation',
      passed: true,
      details:
        'Turn 1: product + order tracked → Turn 2: loaded & enhanced → Turn 3: context preserved across turns',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Multi-Turn Conversation Simulation',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testMultiTurnConversation().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
