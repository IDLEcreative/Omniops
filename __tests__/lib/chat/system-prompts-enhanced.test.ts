/**
 * Integration Tests for System Prompts
 * Performance, Content Verification, and Real-World Scenarios
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  getCustomerServicePrompt,
  getEnhancedCustomerServicePrompt
} from '@/lib/chat/system-prompts';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';

describe('System Prompts - Enhanced Features', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Prompt Size and Performance', () => {
    test('base prompt should be reasonable size (<10KB)', () => {
      const prompt = getCustomerServicePrompt();
      const sizeInKB = new Blob([prompt]).size / 1024;

      expect(sizeInKB).toBeLessThan(10);
    });

    test('enhanced prompt with complex data should be <15KB', () => {
      // Add complex metadata
      for (let i = 0; i < 10; i++) {
        manager.incrementTurn();
        manager.trackEntity({
          id: `entity_${i}`,
          type: 'product',
          value: `Product ${i} with Long Name`,
          aliases: ['it', 'that', 'this'],
          turnNumber: i
        });
        manager.trackCorrection(`old${i}`, `new${i}`, `context${i}`);
      }
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' },
        { name: 'Item 3', url: 'https://example.com/3' },
        { name: 'Item 4', url: 'https://example.com/4' },
        { name: 'Item 5', url: 'https://example.com/5' }
      ]);

      const enhanced = getEnhancedCustomerServicePrompt(manager);
      const sizeInKB = new Blob([enhanced]).size / 1024;

      expect(sizeInKB).toBeLessThan(15);
    });

    test('prompt generation should be fast (<5ms)', () => {
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test Product',
        aliases: ['it'],
        turnNumber: 1
      });
      manager.trackCorrection('old', 'new', 'context');
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ]);

      const start = performance.now();
      getEnhancedCustomerServicePrompt(manager);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    });
  });

  describe('Prompt Content Verification', () => {
    test('should maintain base prompt content in enhanced version', () => {
      manager.incrementTurn();
      manager.trackCorrection('old', 'new', 'context');

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('customer service representative');
      expect(enhanced).toContain('SEARCH BEHAVIOR');
      expect(enhanced).toContain('ANTI-HALLUCINATION RULES');
    });

    test('should preserve all anti-hallucination rules', () => {
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test',
        aliases: ['it'],
        turnNumber: 1
      });

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('NEVER state facts you don\'t have data for');
      expect(enhanced).toContain('manufacturing location');
      expect(enhanced).toContain('compatibility');
      expect(enhanced).toContain('warranties');
      expect(enhanced).toContain('technical specs');
    });

    test('should preserve search behavior instructions', () => {
      manager.incrementTurn();
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' }
      ]);

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('ALWAYS search first');
      expect(enhanced).toContain('using available tools');
      expect(enhanced).toContain('before asking clarifying questions');
    });

    test('should preserve alternative products process', () => {
      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('ALTERNATIVE PRODUCTS');
      expect(enhanced).toContain('compatibility is critical');
      expect(enhanced).toContain('Equipment model, serial number');
      expect(enhanced).toContain('NEVER suggest specific alternatives');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should provide context for product correction scenario', () => {
      // Turn 1: User asks about wrong product
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1_ZF5',
        type: 'product',
        value: 'ZF5 Pump',
        aliases: ['it', 'that'],
        turnNumber: 1
      });

      // Turn 2: User corrects
      manager.incrementTurn();
      manager.trackCorrection('ZF5', 'ZF4', 'Sorry I meant ZF4 not ZF5');
      manager.trackEntity({
        id: 'product_2_ZF4',
        type: 'product',
        value: 'ZF4 Pump',
        aliases: ['it', 'that'],
        turnNumber: 2
      });

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('ZF5');
      expect(enhanced).toContain('ZF4');
      expect(enhanced).toContain('corrected');
      expect(enhanced).toContain('IMMEDIATELY acknowledge');
    });

    test('should provide context for list navigation scenario', () => {
      manager.incrementTurn();
      manager.trackList([
        { name: 'Cifa K35L', url: 'https://example.com/k35l' },
        { name: 'Cifa K45L', url: 'https://example.com/k45l' },
        { name: 'Cifa K50L', url: 'https://example.com/k50l' }
      ]);

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Active Numbered List');
      expect(enhanced).toContain('Item 1: Cifa K35L');
      expect(enhanced).toContain('Item 2: Cifa K45L');
      expect(enhanced).toContain('Item 3: Cifa K50L');
      expect(enhanced).toContain('When user says "item 2"');
    });

    test('should provide context for pronoun resolution scenario', () => {
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'A4VTG90 Hydraulic Pump',
        aliases: ['it', 'that', 'this', 'the product'],
        turnNumber: 1
      });

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Recently Mentioned');
      expect(enhanced).toContain('A4VTG90 Hydraulic Pump');
      expect(enhanced).toContain('Pronouns referring to this');
      expect(enhanced).toContain('it, that, this, the product');
    });
  });
});
