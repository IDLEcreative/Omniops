/**
 * Unit Tests for Conversation Metadata Manager
 * Entity Tracking, Turn Management, and Context Summary
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ConversationMetadataManager,
  type ConversationEntity
} from '../../../lib/chat/conversation-metadata';

describe('ConversationMetadataManager - Entity Tracking', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Entity Tracking', () => {
    test('should track product entity', () => {
      const entity: ConversationEntity = {
        id: 'product_1_ZF4',
        type: 'product',
        value: 'ZF4 Pump',
        aliases: ['it', 'that', 'this'],
        turnNumber: 1,
        metadata: { url: 'https://example.com/zf4' }
      };

      manager.trackEntity(entity);
      const resolved = manager.resolveReference('it');

      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('ZF4 Pump');
      expect(resolved?.type).toBe('product');
    });

    test('should track order entity', () => {
      const entity: ConversationEntity = {
        id: 'order_2_12345',
        type: 'order',
        value: '12345',
        aliases: ['it', 'that', 'the order'],
        turnNumber: 2
      };

      manager.trackEntity(entity);
      const resolved = manager.resolveReference('the order');

      expect(resolved).toBeTruthy();
      expect(resolved?.value).toBe('12345');
      expect(resolved?.type).toBe('order');
    });

    test('should prioritize recent entities over older ones', () => {
      manager.trackEntity({
        id: 'product_1_old',
        type: 'product',
        value: 'Old Product',
        aliases: ['it'],
        turnNumber: 1
      });

      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();
      manager.incrementTurn();

      manager.trackEntity({
        id: 'product_5_new',
        type: 'product',
        value: 'New Product',
        aliases: ['it'],
        turnNumber: 5
      });

      const resolved = manager.resolveReference('it');
      expect(resolved?.value).toBe('New Product');
    });
  });

  describe('Turn Management', () => {
    test('should start at turn 0', () => {
      expect(manager.getCurrentTurn()).toBe(0);
    });

    test('should increment turn', () => {
      manager.incrementTurn();
      expect(manager.getCurrentTurn()).toBe(1);

      manager.incrementTurn();
      expect(manager.getCurrentTurn()).toBe(2);
    });
  });

  describe('Context Summary Generation', () => {
    test('should generate empty summary with no data', () => {
      const summary = manager.generateContextSummary();
      expect(summary).toBe('');
    });

    test('should include corrections in summary', () => {
      manager.trackCorrection('wrong', 'right', 'context');
      const summary = manager.generateContextSummary();

      expect(summary).toContain('Important Corrections');
      expect(summary).toContain('wrong');
      expect(summary).toContain('right');
    });

    test('should include recent entities in summary', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test Product',
        aliases: ['it'],
        turnNumber: 1
      });

      const summary = manager.generateContextSummary();
      expect(summary).toContain('Recently Mentioned');
      expect(summary).toContain('Test Product');
      expect(summary).toContain('product');
    });

    test('should exclude entities older than 5 turns from summary', () => {
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Old Product',
        aliases: ['it'],
        turnNumber: 1
      });

      // Advance 7 turns (to turn 7, making entity 6 turns old: 7-1=6 > 5)
      for (let i = 0; i < 7; i++) {
        manager.incrementTurn();
      }

      const summary = manager.generateContextSummary();
      expect(summary).not.toContain('Old Product');
    });
  });
});
