/**
 * Database Persistence Test
 *
 * Tests metadata save, retrieve, deserialization, and round-trip
 * integrity in conversations table.
 */

import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { TestResult, logTest, createTestConversation, cleanupTestConversation, verifyMetadataStructure } from '../../utils/metadata/metadata-system-helpers';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function testDatabasePersistence(): Promise<TestResult> {
  const start = Date.now();
  try {
    const supabase = await createServiceRoleClient();

    // Create test conversation
    const result = await createTestConversation('test_persist');
    if (!result) {
      throw new Error('Failed to create test conversation');
    }

    const { conversationId } = result;

    // Create metadata manager and add data
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.trackEntity({
      id: 'product_test',
      type: 'product',
      value: 'Test Product',
      aliases: ['it', 'that'],
      turnNumber: 1
    });
    manager.trackCorrection('Wrong', 'Correct', 'Test correction');
    manager.trackList([{ name: 'Item 1' }, { name: 'Item 2' }]);

    // Save to database
    const metadataObj = JSON.parse(manager.serialize());
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: metadataObj })
      .eq('id', conversationId);

    if (updateError) {
      throw new Error(`Failed to save metadata: ${updateError.message}`);
    }

    // Retrieve and verify
    const { data: retrieved, error: retrieveError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    if (retrieveError || !retrieved) {
      throw new Error(`Failed to retrieve metadata: ${retrieveError?.message}`);
    }

    // Verify structure
    const metadata = retrieved.metadata as any;
    const structureCheck = await verifyMetadataStructure(metadata);
    if (!structureCheck.valid) {
      throw new Error(`Retrieved metadata missing: ${structureCheck.missing.join(', ')}`);
    }

    // Test deserialization from database
    const deserializedManager = ConversationMetadataManager.deserialize(JSON.stringify(metadata));
    if (deserializedManager.getCurrentTurn() !== 1) {
      throw new Error('Turn count lost in round-trip');
    }

    // Cleanup
    await cleanupTestConversation(conversationId);

    return {
      name: 'Database Persistence and Round-Trip',
      passed: true,
      details: 'Metadata: create, save, retrieve, deserialize, verify structure',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Database Persistence and Round-Trip',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

// Run if executed directly
if (require.main === module) {
  testDatabasePersistence().then(result => {
    logTest(result);
    process.exit(result.passed ? 0 : 1);
  });
}
