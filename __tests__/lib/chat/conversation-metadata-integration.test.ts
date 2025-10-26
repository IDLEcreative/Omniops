/**
 * Integration Test for Conversation Metadata System
 * Tests the full flow of parsing, tracking, and serializing conversation metadata
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ConversationMetadataManager
} from '../../../lib/chat/conversation-metadata';
import { ResponseParser, parseAndTrackEntities } from '../../../lib/chat/response-parser';

describe('Conversation Metadata Integration Test', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  test('Full conversation flow: create, track, resolve, serialize, deserialize', async () => {
    // Turn 1: AI shows product list
    const turn1AI = `
Here are your options:
1. [ZF4 Hydraulic Pump](https://example.com/products/zf4)
2. [ZF5 Hydraulic Pump](https://example.com/products/zf5)
3. [ZF6 Hydraulic Pump](https://example.com/products/zf6)
    `;
    const turn1User = 'Show me pumps';

    await parseAndTrackEntities(turn1AI, turn1User, manager);
    manager.incrementTurn();

    // Verify list was tracked
    const item2 = manager.resolveListItem(2);
    expect(item2).toBeTruthy();
    expect(item2?.name).toBe('ZF5 Hydraulic Pump');

    // Turn 2: User references "item 2"
    const turn2User = 'Tell me more about item 2';
    const turn2AI = 'The ZF5 Hydraulic Pump is a great choice...';

    await parseAndTrackEntities(turn2AI, turn2User, manager);
    manager.incrementTurn();

    // Should be able to resolve "item 2"
    const resolvedItem = manager.resolveReference('item 2');
    expect(resolvedItem).toBeTruthy();
    expect(resolvedItem?.value).toBe('ZF5 Hydraulic Pump');

    // Turn 3: User corrects themselves
    const turn3User = 'Sorry I meant ZF4 not ZF5';
    const turn3AI = 'No problem, looking at ZF4 now...';

    await parseAndTrackEntities(turn3AI, turn3User, manager);
    manager.incrementTurn();

    // Verify correction was tracked
    const summary = manager.generateContextSummary();
    expect(summary).toContain('ZF5');
    expect(summary).toContain('ZF4');
    expect(summary).toContain('Important Corrections');

    // Turn 4: User references "it" (should resolve to most recent product)
    const turn4User = 'What is the price of it?';
    const turn4AI = 'Looking up the price...';

    await parseAndTrackEntities(turn4AI, turn4User, manager);

    // Serialize the entire conversation state
    const serialized = manager.serialize();
    expect(serialized).toBeTruthy();
    expect(serialized.length).toBeGreaterThan(0);

    // Deserialize and verify data integrity
    const restored = ConversationMetadataManager.deserialize(serialized);

    // Verify turn count
    expect(restored.getCurrentTurn()).toBe(manager.getCurrentTurn());

    // Verify list items still resolvable
    const restoredItem = restored.resolveListItem(2);
    expect(restoredItem?.name).toBe('ZF5 Hydraulic Pump');

    // Verify corrections preserved
    const restoredSummary = restored.generateContextSummary();
    expect(restoredSummary).toContain('ZF4');
    expect(restoredSummary).toContain('ZF5');

    // Verify context summary generation
    const finalSummary = manager.generateContextSummary();
    expect(finalSummary).toContain('Recently Mentioned');
    expect(finalSummary).toContain('Active Numbered List');
    expect(finalSummary).toContain('Important Corrections');
  });

  test('Order tracking integration', async () => {
    const aiResponse = 'Your order #12345 has been processed. Order #67890 is pending.';
    const userMessage = 'Check my order status';

    await parseAndTrackEntities(aiResponse, userMessage, manager);

    const summary = manager.generateContextSummary();
    expect(summary).toContain('order');
  });

  test('Complex correction patterns', async () => {
    const scenarios = [
      {
        user: 'Sorry I meant ZF4 not ZF5',
        ai: 'Ok, ZF4',
        expectedOriginal: 'ZF5',
        expectedCorrected: 'ZF4'
      },
      {
        user: 'I said blue not red',
        ai: 'Ok, blue',
        expectedOriginal: 'red',
        expectedCorrected: 'blue'
      },
      {
        user: "it's small not large",
        ai: 'Ok, small',
        expectedOriginal: 'large',
        expectedCorrected: 'small'
      }
    ];

    for (const scenario of scenarios) {
      const testManager = new ConversationMetadataManager();
      await parseAndTrackEntities(scenario.ai, scenario.user, testManager);

      const summary = testManager.generateContextSummary();
      expect(summary).toContain(scenario.expectedOriginal);
      expect(summary).toContain(scenario.expectedCorrected);
    }
  });

  test('Edge case: Empty conversation', async () => {
    const serialized = manager.serialize();
    const restored = ConversationMetadataManager.deserialize(serialized);

    expect(restored.getCurrentTurn()).toBe(0);
    expect(restored.generateContextSummary()).toBe('');
  });

  test('Edge case: Corrupted data recovery', () => {
    // Should return fresh instance without crashing
    const restored = ConversationMetadataManager.deserialize('corrupted-data');

    expect(restored).toBeInstanceOf(ConversationMetadataManager);
    expect(restored.getCurrentTurn()).toBe(0);
  });

  test('Multi-turn reference resolution', async () => {
    // Turn 1: Show products
    await parseAndTrackEntities(
      '[ZF4](https://example.com/zf4)',
      'Show products',
      manager
    );
    manager.incrementTurn();

    // Turn 2: Reference "it"
    const turn1Resolved = manager.resolveReference('it');
    expect(turn1Resolved?.value).toBe('ZF4');

    // Turn 3: Add another product
    await parseAndTrackEntities(
      '[ZF5](https://example.com/zf5)',
      'Show another',
      manager
    );
    manager.incrementTurn();

    // "it" should now resolve to ZF5 (most recent)
    const turn2Resolved = manager.resolveReference('it');
    expect(turn2Resolved?.value).toBe('ZF5');
  });

  test('Performance: Handle large conversation', async () => {
    // Simulate 50 turns
    for (let i = 0; i < 50; i++) {
      await parseAndTrackEntities(
        `[Product ${i}](https://example.com/p${i})`,
        `Show product ${i}`,
        manager
      );
      manager.incrementTurn();
    }

    // Should still generate summary efficiently
    const summary = manager.generateContextSummary();
    expect(summary).toBeTruthy();

    // Should serialize efficiently
    const serialized = manager.serialize();
    expect(serialized).toBeTruthy();

    // Should deserialize efficiently
    const restored = ConversationMetadataManager.deserialize(serialized);
    expect(restored.getCurrentTurn()).toBe(50);
  });
});
