/**
 * Entity Parsing Tests
 * Tests entity extraction and tracking from AI responses.
 */

import { describe, test, expect } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';

describe('Chat Route Metadata - Entity Parsing', () => {
  test('should parse and track entities after AI response', async () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    const userMessage = 'Show me products';
    const aiResponse = `
Here are the available products:
1. [Product A](https://example.com/product-a)
2. [Product B](https://example.com/product-b)
    `.trim();

    await parseAndTrackEntities(aiResponse, userMessage, manager);

    const listItem = manager.resolveListItem(1);
    expect(listItem?.name).toBe('Product A');

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

    await expect(
      parseAndTrackEntities('[Broken](incomplete', 'user message', manager)
    ).resolves.not.toThrow();
  });
});
