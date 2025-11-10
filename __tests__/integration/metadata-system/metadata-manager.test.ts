/**
 * Metadata Manager Core Functionality Test
 *
 * Tests ConversationMetadataManager: entity tracking, reference resolution,
 * turn counting, correction tracking, list management, serialization.
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { TestResult, logTest } from '../../utils/metadata/metadata-system-helpers';

export async function testMetadataManager(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test 1: Create and increment turns
    const manager = new ConversationMetadataManager();

    if (manager.getCurrentTurn() !== 0) {
      throw new Error('Initial turn should be 0');
    }

    manager.incrementTurn();
    if (manager.getCurrentTurn() !== 1) {
      throw new Error('Turn should increment to 1');
    }

    // Test 2: Entity tracking
    manager.trackEntity({
      id: 'product_1',
      type: 'product',
      value: 'Blue Widget',
      aliases: ['it', 'that', 'the product'],
      turnNumber: 1,
      metadata: { url: 'https://example.com/blue-widget' }
    });

    // Test 3: Pronoun resolution
    const resolvedEntity = manager.resolveReference('it');
    if (!resolvedEntity || resolvedEntity.value !== 'Blue Widget') {
      throw new Error('Failed to resolve pronoun "it" to tracked entity');
    }

    // Test 4: Correction tracking
    manager.trackCorrection('ZF5', 'ZF4', 'User corrected part number');

    // Test 5: List tracking
    const listId = manager.trackList([
      { name: 'Product A', url: 'https://example.com/a' },
      { name: 'Product B', url: 'https://example.com/b' },
      { name: 'Product C', url: 'https://example.com/c' }
    ]);

    if (!listId || !listId.startsWith('list_')) {
      throw new Error('List tracking failed');
    }

    // Test 6: List item resolution
    const item2 = manager.resolveListItem(2);
    if (!item2 || item2.name !== 'Product B') {
      throw new Error('Failed to resolve list item 2');
    }

    // Test 7: Serialization and deserialization
    const serialized = manager.serialize();
    const deserialized = ConversationMetadataManager.deserialize(serialized);

    if (deserialized.getCurrentTurn() !== 1) {
      throw new Error('Deserialization lost turn count');
    }

    const resolvedAfterDeserialize = deserialized.resolveReference('it');
    if (!resolvedAfterDeserialize || resolvedAfterDeserialize.value !== 'Blue Widget') {
      throw new Error('Deserialization lost entity tracking');
    }

    return {
      name: 'ConversationMetadataManager Functionality',
      passed: true,
      details:
        'All operations: entity tracking, reference resolution, corrections, lists, serialization',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'ConversationMetadataManager Functionality',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testMetadataManager().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
