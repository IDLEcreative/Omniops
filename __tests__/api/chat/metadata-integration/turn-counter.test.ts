/**
 * Turn Counter Tests
 * Tests the conversation turn tracking and incrementation logic.
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { createChainableMockSupabaseClient } from '@/__tests__/utils/metadata/mock-supabase';

describe('Chat Route Metadata - Turn Counter', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';
    mockSupabaseClient = createChainableMockSupabaseClient();
  });

  test('should increment turn counter for each message', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { metadata: null },
      error: null
    });

    const { data: convMetadata } = await mockSupabaseClient
      .from('conversations')
      .select('metadata')
      .eq('id', mockConversationId)
      .single();

    const metadataManager = convMetadata?.metadata
      ? ConversationMetadataManager.deserialize(JSON.stringify(convMetadata.metadata))
      : new ConversationMetadataManager();

    expect(metadataManager.getCurrentTurn()).toBe(0);
    metadataManager.incrementTurn();
    expect(metadataManager.getCurrentTurn()).toBe(1);
    metadataManager.incrementTurn();
    expect(metadataManager.getCurrentTurn()).toBe(2);
  });

  test('should maintain turn count through save/load cycle', async () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.incrementTurn();
    expect(manager.getCurrentTurn()).toBe(2);

    const serialized = manager.serialize();
    const dbMetadata = JSON.parse(serialized);

    mockSupabaseClient.update.mockResolvedValue({
      data: { metadata: dbMetadata },
      error: null
    });

    mockSupabaseClient.single.mockResolvedValue({
      data: { metadata: dbMetadata },
      error: null
    });

    const { data: convMetadata } = await mockSupabaseClient
      .from('conversations')
      .select('metadata')
      .eq('id', mockConversationId)
      .single();

    const reloadedManager = ConversationMetadataManager.deserialize(
      JSON.stringify(convMetadata.metadata)
    );

    expect(reloadedManager.getCurrentTurn()).toBe(2);
  });
});
