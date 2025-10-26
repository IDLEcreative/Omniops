/**
 * Unit Tests for Conversation Metadata Manager
 * List Tracking and Resolution
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';

describe('ConversationMetadataManager - Lists', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('List Tracking and Resolution', () => {
    test('should track numbered list', () => {
      const items = [
        { name: 'ZF4 Pump', url: 'https://example.com/zf4' },
        { name: 'ZF5 Pump', url: 'https://example.com/zf5' },
        { name: 'ZF6 Pump', url: 'https://example.com/zf6' }
      ];

      const listId = manager.trackList(items);
      expect(listId).toBeTruthy();
      expect(listId).toMatch(/^list_/);
    });

    test('should resolve numbered list item', () => {
      const items = [
        { name: 'ZF4 Pump', url: 'https://example.com/zf4' },
        { name: 'ZF5 Pump', url: 'https://example.com/zf5' },
        { name: 'ZF6 Pump', url: 'https://example.com/zf6' }
      ];

      manager.trackList(items);
      const item2 = manager.resolveListItem(2);

      expect(item2).toBeTruthy();
      expect(item2?.name).toBe('ZF5 Pump');
      expect(item2?.position).toBe(2);
      expect(item2?.url).toBe('https://example.com/zf5');
    });

    test('should resolve "item 2" reference', () => {
      const items = [
        { name: 'ZF4 Pump', url: 'https://example.com/zf4' },
        { name: 'ZF5 Pump', url: 'https://example.com/zf5' }
      ];

      manager.trackList(items);
      const resolved = manager.resolveReference('item 2');

      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('ZF5 Pump');
      expect(resolved?.metadata?.position).toBe(2);
    });

    test('should resolve "the second one" reference', () => {
      const items = [
        { name: 'Product A', url: 'https://example.com/a' },
        { name: 'Product B', url: 'https://example.com/b' }
      ];

      manager.trackList(items);
      const resolved = manager.resolveReference('the second one');

      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Product B');
    });

    test('should resolve "first one" reference', () => {
      const items = [
        { name: 'First Item', url: 'https://example.com/1' },
        { name: 'Second Item', url: 'https://example.com/2' }
      ];

      manager.trackList(items);
      const resolved = manager.resolveReference('first one');

      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('First Item');
    });

    test('should prioritize most recent list', () => {
      const oldList = [
        { name: 'Old Item 1' },
        { name: 'Old Item 2' }
      ];

      const newList = [
        { name: 'New Item 1' },
        { name: 'New Item 2' }
      ];

      manager.trackList(oldList);
      manager.incrementTurn();
      manager.trackList(newList);

      const item1 = manager.resolveListItem(1);
      expect(item1?.name).toBe('New Item 1');
    });

    test('should include list in context summary', () => {
      const items = [
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ];

      manager.trackList(items);
      const summary = manager.generateContextSummary();

      expect(summary).toContain('Active Numbered List');
      expect(summary).toContain('Item 1');
      expect(summary).toContain('Item 2');
    });
  });
});
