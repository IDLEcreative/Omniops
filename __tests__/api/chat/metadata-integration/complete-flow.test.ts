/**
 * Complete Flow Tests
 * Tests the full request-response cycle with metadata integration.
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { createChainableMockSupabaseClient } from '@/__tests__/utils/metadata/mock-supabase';

describe('Chat Route Metadata - Complete Flow', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';
    mockSupabaseClient = createChainableMockSupabaseClient();
  });

  test('should handle full request-response cycle with metadata', async () => {
    const existingMetadata = {
      entities: [],
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

    metadataManager.incrementTurn();
    expect(metadataManager.getCurrentTurn()).toBe(2);

    const enhancedContext = metadataManager.generateContextSummary();

    const aiResponse = '[Test Product](https://example.com/test)';
    const userMessage = 'Show me products';

    await parseAndTrackEntities(aiResponse, userMessage, metadataManager);

    const dbMetadata = JSON.parse(metadataManager.serialize());
    mockSupabaseClient.eq.mockResolvedValue({
      data: { metadata: dbMetadata },
      error: null
    });

    await mockSupabaseClient
      .from('conversations')
      .update({ metadata: dbMetadata })
      .eq('id', mockConversationId);

    expect(metadataManager.getCurrentTurn()).toBe(2);
    expect(metadataManager.resolveReference('it')?.value).toBe('Test Product');
  });

  test('should maintain state across multiple turns', async () => {
    const manager = new ConversationMetadataManager();

    manager.incrementTurn();
    await parseAndTrackEntities(
      '[Product A](https://example.com/a)',
      'Show A',
      manager
    );

    manager.incrementTurn();
    await parseAndTrackEntities(
      'Ok, showing Product B',
      'Sorry I meant B not A',
      manager
    );

    manager.incrementTurn();
    await parseAndTrackEntities(
      '1. [Item 1](https://example.com/1)\n2. [Item 2](https://example.com/2)',
      'Show list',
      manager
    );

    expect(manager.getCurrentTurn()).toBe(3);

    const contextSummary = manager.generateContextSummary();
    expect(contextSummary).toContain('corrected');
    expect(contextSummary).toContain('Active Numbered List');

    const listItem = manager.resolveListItem(1);
    expect(listItem?.name).toBe('Item 1');
  });
});
