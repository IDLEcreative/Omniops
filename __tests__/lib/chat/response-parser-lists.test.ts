/**
 * Unit Tests for Response Parser
 * List Detection, Edge Cases, and Integration
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ResponseParser, parseAndTrackEntities } from '../../../lib/chat/response-parser';
import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';

describe('ResponseParser - Lists and Integration', () => {
  describe('List Detection', () => {
    test('should detect numbered list with markdown links', () => {
      const response = `
1. [ZF4 Pump](https://example.com/zf4)
2. [ZF5 Pump](https://example.com/zf5)
3. [ZF6 Pump](https://example.com/zf6)
      `;

      const result = ResponseParser.parseResponse('Show options', response, 1);

      expect(result.lists).toHaveLength(1);
      expect(result.lists[0].items).toHaveLength(3);
      expect(result.lists[0].items[0].name).toBe('ZF4 Pump');
    });

    test('should detect bullet list', () => {
      const response = `
- [Product A](https://example.com/a)
- [Product B](https://example.com/b)
      `;

      const result = ResponseParser.parseResponse('Show', response, 1);

      expect(result.lists).toHaveLength(1);
      expect(result.lists[0].items).toHaveLength(2);
    });

    test('should not create list with single item', () => {
      const response = '1. [Single Item](https://example.com/item)';
      const result = ResponseParser.parseResponse('Show', response, 1);

      expect(result.lists).toHaveLength(0);
    });

    test('should extract URLs from list items', () => {
      const response = `
1. [Item A](https://example.com/a)
2. [Item B](https://example.com/b)
      `;

      const result = ResponseParser.parseResponse('Show', response, 1);

      expect(result.lists[0].items[0].url).toBe('https://example.com/a');
      expect(result.lists[0].items[1].url).toBe('https://example.com/b');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', () => {
      const result = ResponseParser.parseResponse('', '', 1);

      expect(result.entities).toHaveLength(0);
      expect(result.corrections).toHaveLength(0);
      expect(result.lists).toHaveLength(0);
    });

    test('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const result = ResponseParser.parseResponse(longText, longText, 1);

      // Should not crash
      expect(result).toBeTruthy();
    });

    test('should handle malformed markdown', () => {
      const result = ResponseParser.parseResponse(
        'Show',
        '[Broken link](incomplete',
        1
      );

      // Should not crash
      expect(result).toBeTruthy();
    });

    test('should handle special characters', () => {
      const result = ResponseParser.parseResponse(
        'Show "special" items',
        'Here is [Item & Co.](https://example.com/item)',
        1
      );

      expect(result.entities[0].value).toBe('Item & Co.');
    });
  });
});

describe('parseAndTrackEntities Integration', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  test('should parse and track all entities from response', async () => {
    const aiResponse = `
Here are your options:
1. [ZF4 Pump](https://example.com/zf4)
2. [ZF5 Pump](https://example.com/zf5)

Your order #12345 is being prepared.
    `;

    await parseAndTrackEntities(aiResponse, 'Show me options', manager);

    // Should track products
    const product = manager.resolveReference('it');
    expect(product).toBeTruthy();

    // Should track list
    const listItem = manager.resolveListItem(1);
    expect(listItem?.name).toBe('ZF4 Pump');

    // Should track order
    const summary = manager.generateContextSummary();
    expect(summary).toContain('order');
  });

  test('should resolve "which one" after showing product alternatives', async () => {
    // Simulate AI showing alternatives
    const aiResponse = `
I found two options for you:
- [A4VTG90 Pump](https://example.com/a4vtg90) - Original model
- [Alternative Model X](https://example.com/alternative) - Compatible alternative
    `;

    await parseAndTrackEntities(aiResponse, 'Show me alternatives', manager);

    // User asks "Which one would you recommend?"
    manager.incrementTurn();
    const resolved = manager.resolveReference('which one would you recommend');

    // Should resolve to most recent entity (Alternative Model X)
    expect(resolved).toBeTruthy();
    expect(resolved?.type).toBe('product');
    expect(resolved?.value).toMatch(/Model X|A4VTG90/);
  });

  test('should track corrections from user message', async () => {
    await parseAndTrackEntities(
      'Ok, showing ZF4',
      'Sorry I meant ZF4 not ZF5',
      manager
    );

    const summary = manager.generateContextSummary();
    expect(summary).toContain('ZF5');
    expect(summary).toContain('ZF4');
    expect(summary).toContain('Important Corrections');
  });

  test('should handle errors gracefully', async () => {
    // Simulate error condition
    await expect(
      parseAndTrackEntities('response', 'message', manager)
    ).resolves.not.toThrow();
  });

  test('should use current turn number', async () => {
    manager.incrementTurn();
    manager.incrementTurn();

    await parseAndTrackEntities(
      '[Product](https://example.com/p)',
      'Show product',
      manager
    );

    const entity = manager.resolveReference('it');
    expect(entity?.turnNumber).toBe(2);
  });
});
