/**
 * Unit Tests for Conversation Metadata Manager
 * Correction Tracking and Pronoun Resolution
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';

describe('ConversationMetadataManager - Corrections and Pronouns', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Correction Tracking', () => {
    test('should track corrections', () => {
      manager.trackCorrection('ZF5', 'ZF4', 'Sorry I meant ZF4 not ZF5');

      const summary = manager.generateContextSummary();
      expect(summary).toContain('ZF5');
      expect(summary).toContain('ZF4');
      expect(summary).toContain('Important Corrections');
    });

    test('should track multiple corrections', () => {
      manager.trackCorrection('ZF5', 'ZF4', 'Sorry I meant ZF4 not ZF5');
      manager.incrementTurn();
      manager.trackCorrection('blue', 'red', 'Actually I want red not blue');

      const summary = manager.generateContextSummary();
      expect(summary).toContain('ZF4');
      expect(summary).toContain('red');
    });
  });

  describe('Pronoun Resolution', () => {
    test('should resolve "it" pronoun', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'ZF4 Pump',
        aliases: ['it', 'that'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('it');
      expect(resolved?.value).toBe('ZF4 Pump');
    });

    test('should resolve "that" pronoun', () => {
      manager.trackEntity({
        id: 'order_1',
        type: 'order',
        value: '12345',
        aliases: ['that', 'it'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('that');
      expect(resolved?.value).toBe('12345');
    });

    test('should resolve partial name match', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'ZF4 Hydraulic Pump',
        aliases: ['it'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('zf4');
      expect(resolved?.value).toBe('ZF4 Hydraulic Pump');
    });

    test('should return null for unknown reference', () => {
      const resolved = manager.resolveReference('unknown thing');
      expect(resolved).toBeNull();
    });

    test('should not resolve references older than 3 turns', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Old Product',
        aliases: ['it'],
        turnNumber: 1
      });

      // Advance 5 turns (to turn 5, making entity 4 turns old: 5-1=4 > 3)
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();

      const resolved = manager.resolveReference('it');
      expect(resolved).toBeNull();
    });

    test('should resolve generic "one" pronoun to most recent entity', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Product A',
        aliases: ['it'],
        turnNumber: 1
      });

      manager.incrementTurn();

      manager.trackEntity({
        id: 'product_2',
        type: 'product',
        value: 'Product B',
        aliases: ['it'],
        turnNumber: 2
      });

      const resolved = manager.resolveReference('one');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Product B'); // Most recent entity
    });

    test('should resolve "which one" to most recent entity', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Alternative A',
        aliases: ['it'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('which one');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Alternative A');
    });

    test('should resolve "this one" to most recent entity', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Product X',
        aliases: ['it'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('this one');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Product X');
    });

    test('should resolve "that one" to most recent entity', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Product Y',
        aliases: ['it'],
        turnNumber: 1
      });

      const resolved = manager.resolveReference('that one');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Product Y');
    });

    test('should return null for "one" when no recent entities exist', () => {
      const resolved = manager.resolveReference('one');
      expect(resolved).toBeNull();
    });

    test('should prioritize most recent entity when resolving "one"', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Older Product',
        aliases: ['it'],
        turnNumber: 1
      });

      manager.incrementTurn();
      manager.incrementTurn();

      manager.trackEntity({
        id: 'product_2',
        type: 'product',
        value: 'Newer Product',
        aliases: ['it'],
        turnNumber: 3
      });

      const resolved = manager.resolveReference('which one would you recommend');
      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('Newer Product');
    });
  });
});
