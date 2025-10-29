/**
 * End-to-End Integration Tests for Conversation Metadata System
 *
 * Tests the complete flow from chat API through metadata tracking to database persistence.
 * Validates Wave 1 (infrastructure) + Wave 2 (integration) implementation.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { ResponseParser, parseAndTrackEntities } from '@/lib/chat/response-parser';
import { getEnhancedCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('E2E: Conversation Metadata Flow', () => {
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
Here are the available products:

1. [Product Model A](https://example.com/products/model-a)
2. [Product Model B](https://example.com/products/model-b)
3. [Product Model C](https://example.com/products/model-c)
      `.trim();

      await parseAndTrackEntities(
        listResponse,
        'Show me products',
        manager
      );

      // Verify list was tracked
      const item1 = manager.resolveListItem(1);
      expect(item1?.name).toBe('Product Model A');
      expect(item1?.url).toBe('https://example.com/products/model-a');

      const item2 = manager.resolveListItem(2);
      expect(item2?.name).toBe('Product Model B');

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

  describe('Scenario C: Pronoun Resolution Flow', () => {
    test('should resolve "it" across multiple turns', async () => {
      // Turn 1: AI mentions A4VTG90
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Yes, we have the [A4VTG90 Pump](https://example.com/products/a4vtg90) in stock.',
        'Do you have the A4VTG90 pump?',
        manager
      );

      // Turn 2: User asks "How much does it cost?"
      manager.incrementTurn();
      const resolved1 = manager.resolveReference('it');
      expect(resolved1?.value).toBe('A4VTG90 Pump');
      expect(resolved1?.type).toBe('product');

      // Turn 3: User asks "Do you have alternatives to it?"
      manager.incrementTurn();
      const resolved2 = manager.resolveReference('it');
      expect(resolved2?.value).toBe('A4VTG90 Pump');
    });

    test('should resolve "that" and "this" pronouns', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        'Here is the [ZF4 Pump](https://example.com/zf4)',
        'Show me pumps',
        manager
      );

      manager.incrementTurn();
      expect(manager.resolveReference('that')?.value).toBe('ZF4 Pump');
      expect(manager.resolveReference('this')?.value).toBe('ZF4 Pump');
    });

    test('should resolve partial name match', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[A4VTG90 Hydraulic Pump](https://example.com/pump)',
        'Show pump',
        manager
      );

      manager.incrementTurn();
      const resolved = manager.resolveReference('a4vtg90');
      expect(resolved?.value).toBe('A4VTG90 Hydraulic Pump');
    });

    test('should expire references after 3 turns', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[Old Product](https://example.com/old)',
        'Show old',
        manager
      );

      // Advance 4 turns
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();

      // Should no longer resolve
      const resolved = manager.resolveReference('it');
      expect(resolved).toBeNull();
    });

    test('should prioritize recent entities over old ones', async () => {
      manager.incrementTurn();
      await parseAndTrackEntities(
        '[Old Product](https://example.com/old)',
        'Show old',
        manager
      );

      manager.incrementTurn();
      manager.incrementTurn();

      manager.incrementTurn();
      await parseAndTrackEntities(
        '[New Product](https://example.com/new)',
        'Show new',
        manager
      );

      // "it" should resolve to New Product (more recent)
      const resolved = manager.resolveReference('it');
      expect(resolved?.value).toBe('New Product');
    });
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
        '[Test Product](https://example.com/test)',
        'Show test',
        manager
      );

      // Simulate what happens in chat route
      const metadataForDB = JSON.parse(manager.serialize());

      // Simulate database storage (would be JSON/JSONB column)
      const storedMetadata = JSON.stringify(metadataForDB);

      // Simulate loading from database
      const loadedManager = ConversationMetadataManager.deserialize(storedMetadata);

      const resolved = loadedManager.resolveReference('it');
      expect(resolved?.value).toBe('Test Product');
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

      expect(elapsed).toBeLessThan(10); // <10ms
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

      expect(elapsed).toBeLessThan(20); // <20ms
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

      expect(elapsed).toBeLessThan(15); // <15ms
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

      expect(elapsed).toBeLessThan(50); // <50ms total
    });
  });

  describe('System Prompt Enhancement', () => {
    test('enhanced prompt should include context summary', () => {
      manager.incrementTurn();
      manager.trackCorrection('wrong', 'right', 'context');

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);

      expect(enhancedPrompt).toContain('CRITICAL: Conversation Context Awareness');
      expect(enhancedPrompt).toContain('Important Corrections');
      expect(enhancedPrompt).toContain('wrong');
      expect(enhancedPrompt).toContain('right');
    });

    test('enhanced prompt should include reference resolution rules when metadata exists', () => {
      // Need actual metadata to trigger enhancements
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test Product',
        aliases: ['it'],
        turnNumber: 1
      });

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);

      expect(enhancedPrompt).toContain('Reference Resolution Rules');
      expect(enhancedPrompt).toContain('When user says "it"');
      expect(enhancedPrompt).toContain('numbered items');
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
