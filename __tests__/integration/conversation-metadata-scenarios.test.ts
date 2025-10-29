/**
 * E2E Integration Tests for Conversation Metadata System (Scenarios A & B)
 *
 * Tests the complete flow from chat API through metadata tracking to database persistence.
 * Validates Wave 1 (infrastructure) + Wave 2 (integration) implementation.
 *
 * Focus: Correction tracking and numbered list reference scenarios
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';
import { getEnhancedCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('E2E: Conversation Metadata Scenarios A & B', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Scenario A: Correction Tracking Flow', () => {
    test('should track and acknowledge product correction', async () => {
      // Turn 1: User asks about ZF5
      manager.incrementTurn();
      const turn1Response = `
Here's information about the [ZF5 Pump](https://example.com/products/zf5):
- Model: ZF5
- Price: $1,299
      `.trim();

      await parseAndTrackEntities(
        turn1Response,
        'Tell me about the ZF5 pump',
        manager
      );

      // Turn 2: User corrects to ZF4
      manager.incrementTurn();
      const turn2UserMessage = 'Sorry, I meant ZF4 not ZF5';
      const turn2Response = `Got it! Looking at the ZF4 instead.

Here's the [ZF4 Pump](https://example.com/products/zf4):
- Model: ZF4
- Price: $999
      `.trim();

      await parseAndTrackEntities(
        turn2Response,
        turn2UserMessage,
        manager
      );

      // Verify correction was tracked
      const contextSummary = manager.generateContextSummary();
      expect(contextSummary).toContain('Important Corrections');
      expect(contextSummary).toContain('ZF5');
      expect(contextSummary).toContain('ZF4');
      expect(contextSummary).toContain('Turn 2');

      // Verify AI would see this in system prompt
      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
      expect(enhancedPrompt).toContain('ZF4');
      expect(enhancedPrompt).toContain('corrected');
    });

    test('should handle multiple corrections in conversation', async () => {
      // Correction 1
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Ok, looking at ZF4',
        'Sorry I meant ZF4 not ZF5',
        manager
      );

      // Correction 2 - using "not X but Y" pattern
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Ok, changing to red',
        'not blue but red',
        manager
      );

      const contextSummary = manager.generateContextSummary();
      expect(contextSummary).toContain('ZF4');
      expect(contextSummary).toContain('red');

      // Both corrections should be present
      const correctionMatches = contextSummary.match(/corrected/gi);
      expect(correctionMatches?.length).toBeGreaterThanOrEqual(2);
    });

    test('should persist correction through serialization', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Ok, showing ZF4',
        'Sorry I meant ZF4 not ZF5',
        manager
      );

      // Simulate database save/load
      const serialized = manager.serialize();
      const reloadedManager = ConversationMetadataManager.deserialize(serialized);

      const contextSummary = reloadedManager.generateContextSummary();
      expect(contextSummary).toContain('ZF4');
      expect(contextSummary).toContain('ZF5');
    });
  });

  describe('Scenario B: Numbered List Reference Flow', () => {
    test('should track list and resolve "item 2" reference', async () => {
      // Turn 1: AI returns numbered list
      manager.incrementTurn();
      const listResponse = `
Here are the available pumps:

1. [Cifa K35L Mixer Pump](https://example.com/products/k35l)
2. [Cifa K45L Mixer Pump](https://example.com/products/k45l)
3. [ZF5 Hydraulic Pump](https://example.com/products/zf5)
      `.trim();

      await parseAndTrackEntities(
        listResponse,
        'Show me pumps',
        manager
      );

      // Verify list was tracked
      const item1 = manager.resolveListItem(1);
      expect(item1?.name).toBe('Cifa K35L Mixer Pump');
      expect(item1?.url).toBe('https://example.com/products/k35l');

      const item2 = manager.resolveListItem(2);
      expect(item2?.name).toBe('Cifa K45L Mixer Pump');

      // Turn 2: User asks about "item 2"
      manager.incrementTurn();
      const resolved = manager.resolveReference('item 2');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Cifa K45L Mixer Pump');
      expect(resolved?.metadata?.position).toBe(2);

      // Verify context summary shows the list
      const contextSummary = manager.generateContextSummary();
      expect(contextSummary).toContain('Active Numbered List');
      expect(contextSummary).toContain('Item 1: Cifa K35L Mixer Pump');
      expect(contextSummary).toContain('Item 2: Cifa K45L Mixer Pump');
    });

    test('should resolve "the second one" reference', async () => {
      manager.incrementTurn();
      const listResponse = `
Options:
1. [Product A](https://example.com/a)
2. [Product B](https://example.com/b)
3. [Product C](https://example.com/c)
      `.trim();

      await parseAndTrackEntities(listResponse, 'Show options', manager);

      manager.incrementTurn();
      const resolved = manager.resolveReference('the second one');
      expect(resolved?.value).toBe('Product B');
      expect(resolved?.metadata?.position).toBe(2);
    });

    test('should prioritize most recent list', async () => {
      // Old list
      manager.incrementTurn();
      await parseAndTrackEntities(
        '1. [Old Item 1](https://example.com/old1)\n2. [Old Item 2](https://example.com/old2)',
        'Show old',
        manager
      );

      // New list
      manager.incrementTurn();
      await parseAndTrackEntities(
        '1. [New Item 1](https://example.com/new1)\n2. [New Item 2](https://example.com/new2)',
        'Show new',
        manager
      );

      // Should resolve from new list
      const item1 = manager.resolveListItem(1);
      expect(item1?.name).toBe('New Item 1');
    });

    test('should provide list context in system prompt', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '1. [Item A](https://example.com/a)\n2. [Item B](https://example.com/b)',
        'Show items',
        manager
      );

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
      expect(enhancedPrompt).toContain('Active Numbered List');
      expect(enhancedPrompt).toContain('Item A');
      expect(enhancedPrompt).toContain('item 2');
    });
  });
});
