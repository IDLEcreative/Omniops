/**
 * Error Handling Tests
 * Tests error scenarios and edge cases in metadata integration.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { createChainableMockSupabaseClient } from '@/__tests__/utils/metadata/mock-supabase';

describe('Chat Route Metadata - Error Handling', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';
    mockSupabaseClient = createChainableMockSupabaseClient();
  });

  test('should handle database query failures', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { message: 'Connection error' }
    });

    const { data: convMetadata } = await mockSupabaseClient
      .from('conversations')
      .select('metadata')
      .eq('id', mockConversationId)
      .single();

    const metadataManager = convMetadata?.metadata
      ? ConversationMetadataManager.deserialize(JSON.stringify(convMetadata.metadata))
      : new ConversationMetadataManager();

    expect(metadataManager).toBeInstanceOf(ConversationMetadataManager);
    expect(metadataManager.getCurrentTurn()).toBe(0);
  });

  test('should handle null metadata in database', async () => {
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

    expect(metadataManager).toBeInstanceOf(ConversationMetadataManager);
  });

  test('should handle undefined metadata in database', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: {},
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

    expect(metadataManager).toBeInstanceOf(ConversationMetadataManager);
  });

  test('should recover from serialization errors', () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    expect(() => {
      const serialized = manager.serialize();
      JSON.parse(serialized);
    }).not.toThrow();
  });

  test('should handle very large metadata gracefully', () => {
    const manager = new ConversationMetadataManager();

    for (let i = 0; i < 100; i++) {
      manager.incrementTurn();
      manager.trackEntity({
        id: `entity_${i}`,
        type: 'product',
        value: `Product ${i}`,
        aliases: ['it'],
        turnNumber: i
      });
    }

    const serialized = manager.serialize();
    const sizeInKB = new Blob([serialized]).size / 1024;

    expect(sizeInKB).toBeLessThan(100);

    const deserialized = ConversationMetadataManager.deserialize(serialized);
    expect(deserialized.getCurrentTurn()).toBe(100);
  });
});
