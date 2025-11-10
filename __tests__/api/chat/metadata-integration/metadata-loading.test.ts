/**
 * Metadata Loading Tests
 * Tests the database loading and initialization of conversation metadata.
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { createChainableMockSupabaseClient } from '@/__tests__/utils/metadata/mock-supabase';

describe('Chat Route Metadata - Loading', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';
    mockSupabaseClient = createChainableMockSupabaseClient();
  });

  test('should load existing metadata from database', async () => {
    const existingMetadata = {
      entities: [
        ['product_1', {
          id: 'product_1',
          type: 'product',
          value: 'ZF4 Pump',
          aliases: ['it', 'that'],
          turnNumber: 1
        }]
      ],
      corrections: [],
      lists: [],
      currentTurn: 1
    };

    mockSupabaseClient.single.mockResolvedValue({
      data: { metadata: existingMetadata },
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

    expect(metadataManager.getCurrentTurn()).toBe(1);
    const resolved = metadataManager.resolveReference('it');
    expect(resolved?.value).toBe('ZF4 Pump');
  });

  test('should create new metadata manager for new conversation', async () => {
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
    expect(metadataManager.generateContextSummary()).toBe('');
  });

  test('should handle missing metadata column gracefully', async () => {
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
    expect(metadataManager.getCurrentTurn()).toBe(0);
  });

  test('should handle corrupted metadata gracefully', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: { metadata: { corrupted: 'invalid data structure' } },
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
    expect(metadataManager.getCurrentTurn()).toBe(0);
  });
});
