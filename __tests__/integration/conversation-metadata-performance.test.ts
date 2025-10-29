/**
 * E2E Integration Tests for Conversation Metadata System (Performance & Edge Cases)
 *
 * Focus: Performance validation, system prompts, and edge case handling
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { getEnhancedCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('E2E: Conversation Metadata Performance & Edge Cases', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Scenario D: Context Persistence Flow', () => {
    test('should persist and restore full conversation state', async () => {
      // Build complex conversation state
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Ok, looking at ZF4',
        'Sorry I meant ZF4 not ZF5',
        manager
      );

      manager.incrementTurn();
      await parseAndTrackEntities(
        '1. [Item A](https://example.com/a)\n2. [Item B](https://example.com/b)',
        'Show items',
        manager
      );

      manager.incrementTurn();
      await parseAndTrackEntities(
        'Here is the [Product X](https://example.com/x)',
        'Show product',
        manager
      );

      // Simulate database save
      const serialized = manager.serialize();
      const dbMetadata = JSON.parse(serialized);

      // Simulate page refresh / conversation reload
      const restoredManager = ConversationMetadataManager.deserialize(
        JSON.stringify(dbMetadata)
      );

      // Verify all state restored
      expect(restoredManager.getCurrentTurn()).toBe(3);

      const contextSummary = restoredManager.generateContextSummary();
      expect(contextSummary).toContain('ZF4');
      expect(contextSummary).toContain('Item A');

      const listItem = restoredManager.resolveListItem(1);
      expect(listItem?.name).toBe('Item A');

      const productRef = restoredManager.resolveReference('it');
      expect(productRef?.value).toBe('Product X');
    });

    test('should handle database metadata round-trip', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[ZF5 Hydraulic Pump](https://example.com/zf5)',
        'Show ZF5',
        manager
      );

      // Simulate what happens in chat route
      const metadataForDB = JSON.parse(manager.serialize());

      // Simulate database storage (would be JSON/JSONB column)
      const storedMetadata = JSON.stringify(metadataForDB);

      // Simulate loading from database
      const loadedManager = ConversationMetadataManager.deserialize(storedMetadata);

      const resolved = loadedManager.resolveReference('it');
      expect(resolved?.value).toBe('ZF5 Hydraulic Pump');
    });

    test('should handle corrupted metadata gracefully', async () => {
      // Simulate corrupted database data
      const corruptedData = '{"invalid": "json"';
      const manager = ConversationMetadataManager.deserialize(corruptedData);

      // Should create fresh instance, not crash
      expect(manager).toBeInstanceOf(ConversationMetadataManager);
      expect(manager.getCurrentTurn()).toBe(0);
      expect(manager.generateContextSummary()).toBe('');
    });

    test('should handle missing metadata column gracefully', async () => {
      // Simulate old conversation without metadata column
      const manager = ConversationMetadataManager.deserialize('');

      expect(manager).toBeInstanceOf(ConversationMetadataManager);
      expect(manager.getCurrentTurn()).toBe(0);
    });
  });

  describe('Performance Validation', () => {
    test('metadata deserialization should be fast (<10ms)', () => {
      // Create complex metadata
      const manager = new ConversationMetadataManager();
      for (let i = 0; i < 10; i++) {
        manager.incrementTurn();
        manager.trackEntity({
          id: `entity_${i}`,
          type: 'product',
          value: `Product ${i}`,
          aliases: ['it'],
          turnNumber: i
        });
        manager.trackCorrection(`old${i}`, `new${i}`, `context${i}`);
        manager.trackList([
          { name: `Item ${i}A`, url: `https://example.com/${i}a` },
          { name: `Item ${i}B`, url: `https://example.com/${i}b` }
        ]);
      }

      const serialized = manager.serialize();

      const start = performance.now();
      const deserialized = ConversationMetadataManager.deserialize(serialized);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
      expect(deserialized.getCurrentTurn()).toBe(10);
    });

    test('context summary generation should be fast (<20ms)', () => {
      const manager = new ConversationMetadataManager();

      // Add realistic data
      for (let i = 0; i < 5; i++) {
        manager.incrementTurn();
        manager.trackEntity({
          id: `product_${i}`,
          type: 'product',
          value: `Product ${i}`,
          aliases: ['it', 'that'],
          turnNumber: i
        });
      }
      manager.trackCorrection('old', 'new', 'context');
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ]);

      const start = performance.now();
      const summary = manager.generateContextSummary();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(20);
      expect(summary.length).toBeGreaterThan(0);
    });

    test('entity parsing should be fast (<15ms)', async () => {
      const complexResponse = `
Here are your options:
1. [Product A](https://example.com/a)
2. [Product B](https://example.com/b)
3. [Product C](https://example.com/c)

Your order #12345 is being processed.
We also found order #67890.
      `.trim();

      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      const start = performance.now();
      await parseAndTrackEntities(
        complexResponse,
        'Show me options and order status',
        manager
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(15);
    });

    test('complete metadata cycle should be fast (<50ms)', async () => {
      const manager = new ConversationMetadataManager();
      manager.incrementTurn();

      const start = performance.now();

      // Parse and track
      await parseAndTrackEntities(
        '1. [Item A](https://example.com/a)\n2. [Item B](https://example.com/b)',
        'Show items',
        manager
      );

      // Generate summary
      manager.generateContextSummary();

      // Serialize
      const serialized = manager.serialize();

      // Deserialize
      ConversationMetadataManager.deserialize(serialized);

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('System Prompt Enhancement', () => {
    test('enhanced prompt should include context summary', () => {
      manager.incrementTurn();
      manager.trackCorrection('wrong', 'right', 'context');

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);

      expect(enhancedPrompt).toContain('Conversation Context');
      expect(enhancedPrompt).toContain('Important Corrections');
      expect(enhancedPrompt).toContain('wrong');
      expect(enhancedPrompt).toContain('right');
    });

    test('enhanced prompt should be reasonable size (<15KB)', () => {
      // Add complex data
      for (let i = 0; i < 10; i++) {
        manager.incrementTurn();
        manager.trackEntity({
          id: `entity_${i}`,
          type: 'product',
          value: `Product ${i}`,
          aliases: ['it'],
          turnNumber: i
        });
      }

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
      const sizeInKB = new Blob([enhancedPrompt]).size / 1024;

      expect(sizeInKB).toBeLessThan(15);
    });

    test('enhanced prompt without metadata should return base prompt', () => {
      const basePrompt = getEnhancedCustomerServicePrompt();

      expect(basePrompt).toContain('customer service representative');
      expect(basePrompt).toContain('SEARCH BEHAVIOR');
      expect(basePrompt).not.toContain('CRITICAL: Conversation Context Awareness');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty AI responses', async () => {
      await expect(
        parseAndTrackEntities('', 'user message', manager)
      ).resolves.not.toThrow();
    });

    test('should handle very long responses', async () => {
      const longResponse = 'a'.repeat(50000);
      await expect(
        parseAndTrackEntities(longResponse, 'message', manager)
      ).resolves.not.toThrow();
    });

    test('should handle malformed markdown', async () => {
      const malformed = '[Broken link](incomplete';
      await expect(
        parseAndTrackEntities(malformed, 'message', manager)
      ).resolves.not.toThrow();
    });

    test('should handle special characters in product names', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[A&B Co. "Special" Product](https://example.com/special)',
        'Show special',
        manager
      );

      const resolved = manager.resolveReference('it');
      expect(resolved?.value).toBe('A&B Co. "Special" Product');
    });

    test('should handle concurrent metadata updates', () => {
      const manager1 = new ConversationMetadataManager();
      const manager2 = new ConversationMetadataManager();

      manager1.incrementTurn();
      manager1.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Product A',
        aliases: ['it'],
        turnNumber: 1
      });

      manager2.incrementTurn();
      manager2.trackEntity({
        id: 'product_2',
        type: 'product',
        value: 'Product B',
        aliases: ['it'],
        turnNumber: 1
      });

      // Each manager should maintain independent state
      expect(manager1.resolveReference('it')?.value).toBe('Product A');
      expect(manager2.resolveReference('it')?.value).toBe('Product B');
    });
  });
});
