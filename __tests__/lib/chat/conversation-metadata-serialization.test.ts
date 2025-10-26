/**
 * Unit Tests for Conversation Metadata Manager
 * Serialization and Deserialization
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';

describe('ConversationMetadataManager - Serialization', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Serialization and Deserialization', () => {
    test('should serialize and deserialize basic state', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test Product',
        aliases: ['it'],
        turnNumber: 1
      });
      manager.incrementTurn();

      const serialized = manager.serialize();
      const deserialized = ConversationMetadataManager.deserialize(serialized);

      expect(deserialized.getCurrentTurn()).toBe(1);
      const resolved = deserialized.resolveReference('it');
      expect(resolved?.value).toBe('Test Product');
    });

    test('should serialize and deserialize corrections', () => {
      manager.trackCorrection('old', 'new', 'context');
      const serialized = manager.serialize();
      const deserialized = ConversationMetadataManager.deserialize(serialized);

      const summary = deserialized.generateContextSummary();
      expect(summary).toContain('old');
      expect(summary).toContain('new');
    });

    test('should serialize and deserialize lists', () => {
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ]);

      const serialized = manager.serialize();
      const deserialized = ConversationMetadataManager.deserialize(serialized);

      const item = deserialized.resolveListItem(1);
      expect(item?.name).toBe('Item 1');
    });

    test('should handle invalid JSON gracefully', () => {
      const deserialized = ConversationMetadataManager.deserialize('invalid json');
      expect(deserialized).toBeInstanceOf(ConversationMetadataManager);
      expect(deserialized.getCurrentTurn()).toBe(0);
    });

    test('should handle empty string gracefully', () => {
      const deserialized = ConversationMetadataManager.deserialize('');
      expect(deserialized).toBeInstanceOf(ConversationMetadataManager);
    });

    test('should preserve all data through serialization cycle', () => {
      // Add various types of data
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Product A',
        aliases: ['it'],
        turnNumber: 1,
        metadata: { url: 'https://example.com/a' }
      });
      manager.trackCorrection('wrong', 'right', 'context');
      manager.trackList([
        { name: 'List Item 1', url: 'https://example.com/1' },
        { name: 'List Item 2', url: 'https://example.com/2' }
      ]);
      manager.incrementTurn();
      manager.incrementTurn();

      const serialized = manager.serialize();
      const deserialized = ConversationMetadataManager.deserialize(serialized);

      // Verify all data is preserved
      expect(deserialized.getCurrentTurn()).toBe(2);
      expect(deserialized.resolveReference('it')?.value).toBe('Product A');
      expect(deserialized.resolveListItem(1)?.name).toBe('List Item 1');

      const summary = deserialized.generateContextSummary();
      expect(summary).toContain('wrong');
      expect(summary).toContain('right');
    });
  });
});
