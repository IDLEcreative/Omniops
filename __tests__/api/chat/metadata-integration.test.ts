/**
 * Chat Route Metadata Integration Tests
 *
 * Tests the integration of conversation metadata in the chat API route.
 * Validates metadata loading, tracking, and persistence flow.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { getEnhancedCustomerServicePrompt, getCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('Chat Route Metadata Integration', () => {
  let mockSupabaseClient: any;
  let mockConversationId: string;

  beforeEach(() => {
    mockConversationId = 'conv_12345';

    // Mock Supabase client with proper chaining
    const createChainableMock = () => {
      const mock = {
        from: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        update: jest.fn(),
        insert: jest.fn()
      };

      // Make all methods return the mock for chaining
      mock.from.mockReturnValue(mock);
      mock.select.mockReturnValue(mock);
      mock.eq.mockReturnValue(mock);
      mock.update.mockReturnValue(mock);
      mock.insert.mockReturnValue(mock);

      return mock;
    };

    mockSupabaseClient = createChainableMock();
  });

  describe('Metadata Loading from Database', () => {
    test('should load existing metadata from database', async () => {
      // Simulate existing metadata in database
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

      // Simulate the loading process from chat route
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
      // Simulate no existing metadata
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
      // Simulate old schema without metadata column
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
      // Simulate corrupted metadata
      mockSupabaseClient.single.mockResolvedValue({
        data: { metadata: { corrupted: 'invalid data structure' } },
        error: null
      });

      const { data: convMetadata } = await mockSupabaseClient
        .from('conversations')
        .select('metadata')
        .eq('id', mockConversationId)
        .single();

      // ConversationMetadataManager.deserialize should handle this gracefully
      const metadataManager = convMetadata?.metadata
        ? ConversationMetadataManager.deserialize(JSON.stringify(convMetadata.metadata))
        : new ConversationMetadataManager();

      expect(metadataManager).toBeInstanceOf(ConversationMetadataManager);
      expect(metadataManager.getCurrentTurn()).toBe(0);
    });
  });

  describe('Turn Counter Increment', () => {
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

      // Simulate chat route incrementing turn
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

      // Serialize for database
      const serialized = manager.serialize();
      const dbMetadata = JSON.parse(serialized);

      // Simulate database save
      mockSupabaseClient.update.mockResolvedValue({
        data: { metadata: dbMetadata },
        error: null
      });

      // Simulate loading from database
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

  describe('Entity Parsing and Tracking', () => {
    test('should parse and track entities after AI response', async () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      const userMessage = 'Show me pumps';
      const aiResponse = `
Here are the available pumps:
1. [ZF4 Pump](https://example.com/zf4)
2. [ZF5 Pump](https://example.com/zf5)
      `.trim();

      // Simulate chat route parsing entities
      await parseAndTrackEntities(aiResponse, userMessage, manager);

      // Verify entities were tracked
      const listItem = manager.resolveListItem(1);
      expect(listItem?.name).toBe('ZF4 Pump');

      const productRef = manager.resolveReference('it');
      expect(productRef).toBeTruthy();
    });

    test('should track corrections from user messages', async () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      const userMessage = 'Sorry I meant ZF4 not ZF5';
      const aiResponse = 'Got it, looking at ZF4 instead.';

      await parseAndTrackEntities(aiResponse, userMessage, manager);

      const contextSummary = manager.generateContextSummary();
      expect(contextSummary).toContain('Important Corrections');
      expect(contextSummary).toContain('ZF5');
      expect(contextSummary).toContain('ZF4');
    });

    test('should handle parsing errors gracefully', async () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      // Should not throw even with malformed content
      await expect(
        parseAndTrackEntities('[Broken](incomplete', 'user message', manager)
      ).resolves.not.toThrow();
    });
  });

  describe('Context Enhancement for AI', () => {
    test('should generate context summary for system prompt', () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'ZF4 Pump',
        aliases: ['it'],
        turnNumber: 1
      });

      manager.trackCorrection('ZF5', 'ZF4', 'user corrected');

      // Simulate chat route generating context
      const enhancedContext = manager.generateContextSummary();

      expect(enhancedContext).toContain('Important Corrections');
      expect(enhancedContext).toContain('Recently Mentioned');
      expect(enhancedContext).toContain('ZF4 Pump');
    });

    test('should include context in enhanced system prompt', () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ]);

      // Simulate chat route building enhanced prompt
      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);

      expect(enhancedPrompt).toContain('Active Numbered List');
      expect(enhancedPrompt).toContain('Item 1');
    });

    test('should handle empty metadata in context generation', () => {
      const manager = new ConversationMetadataManager();

      const enhancedContext = manager.generateContextSummary();
      expect(enhancedContext).toBe('');

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
      const basePrompt = getCustomerServicePrompt();

      // Empty metadata should return exactly base prompt (no enhancements)
      expect(enhancedPrompt).toBe(basePrompt);
      expect(enhancedPrompt).toContain('customer service representative');
      expect(enhancedPrompt).not.toContain('CRITICAL: Conversation Context Awareness');
    });
  });

  describe('Metadata Persistence to Database', () => {
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

      // Simulate chat route saving metadata
      const dbMetadata = JSON.parse(manager.serialize());

      // Make eq() return a resolved promise
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

      // Make eq() return a resolved promise with error
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const dbMetadata = JSON.parse(manager.serialize());

      // Should not throw (resolves with error object, doesn't reject)
      const result = await mockSupabaseClient
        .from('conversations')
        .update({ metadata: dbMetadata })
        .eq('id', mockConversationId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database error');
    });
  });

  describe('Complete Chat Flow Simulation', () => {
    test('should handle full request-response cycle with metadata', async () => {
      // 1. Load existing metadata (Turn 1)
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

      // 2. Increment turn (Turn 2)
      metadataManager.incrementTurn();
      expect(metadataManager.getCurrentTurn()).toBe(2);

      // 3. Generate enhanced context for AI
      const enhancedContext = metadataManager.generateContextSummary();

      // 4. Simulate AI response
      const aiResponse = '[Test Product](https://example.com/test)';
      const userMessage = 'Show me products';

      // 5. Parse and track entities
      await parseAndTrackEntities(aiResponse, userMessage, metadataManager);

      // 6. Save metadata back to database
      const dbMetadata = JSON.parse(metadataManager.serialize());
      mockSupabaseClient.eq.mockResolvedValue({
        data: { metadata: dbMetadata },
        error: null
      });

      await mockSupabaseClient
        .from('conversations')
        .update({ metadata: dbMetadata })
        .eq('id', mockConversationId);

      // Verify final state
      expect(metadataManager.getCurrentTurn()).toBe(2);
      expect(metadataManager.resolveReference('it')?.value).toBe('Test Product');
    });

    test('should maintain state across multiple turns', async () => {
      const manager = new ConversationMetadataManager();

      // Turn 1
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[Product A](https://example.com/a)',
        'Show A',
        manager
      );

      // Turn 2
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Ok, showing Product B',
        'Sorry I meant B not A',
        manager
      );

      // Turn 3
      manager.incrementTurn();
      await parseAndTrackEntities(
        '1. [Item 1](https://example.com/1)\n2. [Item 2](https://example.com/2)',
        'Show list',
        manager
      );

      // Verify all state is maintained
      expect(manager.getCurrentTurn()).toBe(3);

      const contextSummary = manager.generateContextSummary();
      expect(contextSummary).toContain('corrected');
      expect(contextSummary).toContain('Active Numbered List');

      const listItem = manager.resolveListItem(1);
      expect(listItem?.name).toBe('Item 1');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database query failures', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection error' }
      });

      const { data: convMetadata, error } = await mockSupabaseClient
        .from('conversations')
        .select('metadata')
        .eq('id', mockConversationId)
        .single();

      // Should fall back to new metadata manager
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

      // Should not throw
      expect(() => {
        const serialized = manager.serialize();
        JSON.parse(serialized);
      }).not.toThrow();
    });

    test('should handle very large metadata gracefully', () => {
      const manager = new ConversationMetadataManager();

      // Add lots of data
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

      // Should be reasonable size (<100KB)
      expect(sizeInKB).toBeLessThan(100);

      // Should deserialize without errors
      const deserialized = ConversationMetadataManager.deserialize(serialized);
      expect(deserialized.getCurrentTurn()).toBe(100);
    });
  });
});
