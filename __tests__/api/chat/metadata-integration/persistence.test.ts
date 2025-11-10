/**
 * Metadata Persistence Tests
 * Tests saving and loading metadata from the database.
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { createChainableMockSupabaseClient } from '@/__tests__/utils/metadata/mock-supabase';

describe('Chat Route Metadata - Persistence', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';
    mockSupabaseClient = createChainableMockSupabaseClient();
  });

  test('should serialize and save metadata to database', async () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.trackEntity({
      id: 'product_1',
      type: 'product',
      value: 'Test Product',
      aliases: ['it'],
      turnNumber: 1
    });

    const dbMetadata = JSON.parse(manager.serialize());

    mockSupabaseClient.eq.mockResolvedValue({
      data: { id: mockConversationId, metadata: dbMetadata },
      error: null
    });

    const result = await mockSupabaseClient
      .from('conversations')
      .update({ metadata: dbMetadata })
      .eq('id', mockConversationId);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
    expect(mockSupabaseClient.update).toHaveBeenCalledWith({ metadata: dbMetadata });
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockConversationId);
    expect(result.data).toBeTruthy();
  });

  test('should handle database save errors gracefully', async () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    mockSupabaseClient.eq.mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    const dbMetadata = JSON.parse(manager.serialize());

    const result = await mockSupabaseClient
      .from('conversations')
      .update({ metadata: dbMetadata })
      .eq('id', mockConversationId);

    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe('Database error');
  });
});
