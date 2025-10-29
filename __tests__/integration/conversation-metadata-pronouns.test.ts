/**
 * E2E Integration Tests for Conversation Metadata System (Pronoun Resolution)
 *
 * Focus: Pronoun resolution across multiple turns
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { parseAndTrackEntities } from '@/lib/chat/response-parser';

describe('E2E: Conversation Metadata Pronoun Resolution', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
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
});
