/**
 * Integration Tests for System Prompts
 * Base Prompt and Enhanced Prompt Basics
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  getCustomerServicePrompt,
  getEnhancedCustomerServicePrompt,
  buildConversationMessages
} from '@/lib/chat/system-prompts';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';

describe('System Prompts - Basic Features', () => {
  let manager: ConversationMetadataManager;

  beforeEach(() => {
    manager = new ConversationMetadataManager();
  });

  describe('Base Customer Service Prompt', () => {
    test('should contain core instructions', () => {
      const prompt = getCustomerServicePrompt();

      expect(prompt).toContain('customer service representative');
      expect(prompt).toContain('SEARCH BEHAVIOR');
      expect(prompt).toContain('CONTEXT & MEMORY');
      expect(prompt).toContain('ANTI-HALLUCINATION RULES');
      expect(prompt).toContain('ALTERNATIVE PRODUCTS');
      expect(prompt).toContain('RESPONSE QUALITY');
    });

    test('should include search-first behavior', () => {
      const prompt = getCustomerServicePrompt();

      expect(prompt).toContain('ALWAYS search first');
      expect(prompt).toContain('before asking clarifying questions');
    });

    test('should include context awareness rules', () => {
      const prompt = getCustomerServicePrompt();

      expect(prompt).toContain('tell me about item 2');
      expect(prompt).toContain('the second one');
      expect(prompt).toContain('it');
      expect(prompt).toContain('that');
      expect(prompt).toContain('this product');
    });

    test('should include anti-hallucination safeguards', () => {
      const prompt = getCustomerServicePrompt();

      expect(prompt).toContain('NEVER state facts you don\'t have data for');
      expect(prompt).toContain('I don\'t have that information');
      expect(prompt).toContain('compatibility');
      expect(prompt).toContain('technical specifications');
    });
  });

  describe('Enhanced Prompt with Metadata', () => {
    test('should return base prompt when no metadata provided', () => {
      const enhanced = getEnhancedCustomerServicePrompt();
      const base = getCustomerServicePrompt();

      expect(enhanced).toBe(base);
    });

    test('should return base prompt when metadata is empty', () => {
      const enhanced = getEnhancedCustomerServicePrompt(manager);
      const base = getCustomerServicePrompt();

      // With empty metadata, should return exactly the base prompt
      expect(enhanced).toBe(base);
      expect(enhanced).toContain('customer service representative');
      expect(enhanced).not.toContain('CRITICAL: Conversation Context Awareness');
    });

    test('should include corrections in enhanced prompt', () => {
      manager.incrementTurn();
      manager.trackCorrection('ZF5', 'ZF4', 'Sorry I meant ZF4 not ZF5');

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Conversation Context');
      expect(enhanced).toContain('Important Corrections');
      expect(enhanced).toContain('ZF5');
      expect(enhanced).toContain('ZF4');
      expect(enhanced).toContain('Turn 1');
    });

    test('should include recently mentioned entities', () => {
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'A4VTG90 Pump',
        aliases: ['it', 'that'],
        turnNumber: 1,
        metadata: { url: 'https://example.com/pump' }
      });

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Recently Mentioned');
      expect(enhanced).toContain('A4VTG90 Pump');
      expect(enhanced).toContain('product');
      expect(enhanced).toContain('it, that');
    });

    test('should include active numbered list', () => {
      manager.incrementTurn();
      manager.trackList([
        { name: 'Item 1', url: 'https://example.com/1' },
        { name: 'Item 2', url: 'https://example.com/2' },
        { name: 'Item 3', url: 'https://example.com/3' }
      ]);

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Active Numbered List');
      expect(enhanced).toContain('Item 1');
      expect(enhanced).toContain('Item 2');
      expect(enhanced).toContain('Item 3');
    });

    test('should include reference resolution rules', () => {
      manager.incrementTurn();
      manager.trackEntity({
        id: 'product_1',
        type: 'product',
        value: 'Test Product',
        aliases: ['it'],
        turnNumber: 1
      });

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Key Rules');
      expect(enhanced).toContain('Pronouns');
      expect(enhanced).toContain('Use natural language');
      expect(enhanced).toContain('clear context');
    });

    test('should include correction acknowledgment rules', () => {
      manager.incrementTurn();
      manager.trackCorrection('wrong', 'right', 'context');

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Corrections');
      expect(enhanced).toContain('When user corrects themselves');
      expect(enhanced).toContain('Got it - X, not Y');
    });

    test('should include numbered item reference rules', () => {
      manager.incrementTurn();
      manager.trackList([
        { name: 'Product A', url: 'https://example.com/a' },
        { name: 'Product B', url: 'https://example.com/b' }
      ]);

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Numbered Lists');
      expect(enhanced).toContain('item 2');
      expect(enhanced).toContain('For item 2 (Product Name)');
    });

    test('should include topic management rules when metadata exists', () => {
      // Need actual metadata to trigger enhancements
      manager.incrementTurn();
      manager.trackCorrection('old', 'new', 'context');

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Topic Switching');
      expect(enhanced).toContain('When user changes topics');
      expect(enhanced).toContain('Focus on new topic');
    });

    test('should include conversation quality standards', () => {
      manager.incrementTurn();
      manager.trackCorrection('old', 'new', 'context');

      const enhanced = getEnhancedCustomerServicePrompt(manager);

      expect(enhanced).toContain('Key Rules');
      expect(enhanced).toContain('Corrections');
      expect(enhanced).toContain('acknowledge explicitly');
      expect(enhanced).toContain('Multi-Item References');
    });
  });

  describe('buildConversationMessages', () => {
    test('should build messages array with system prompt', () => {
      const systemPrompt = 'Test system prompt';
      const historyMessages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there' }
      ];
      const currentMessage = 'New message';

      const messages = buildConversationMessages(
        systemPrompt,
        historyMessages,
        currentMessage
      );

      expect(messages).toHaveLength(4);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toBe('Test system prompt');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Hello');
      expect(messages[2].role).toBe('assistant');
      expect(messages[2].content).toBe('Hi there');
      expect(messages[3].role).toBe('user');
      expect(messages[3].content).toBe('New message');
    });

    test('should work with empty history', () => {
      const messages = buildConversationMessages(
        'System prompt',
        [],
        'User message'
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    test('should preserve message order', () => {
      const history = [
        { role: 'user' as const, content: 'Message 1' },
        { role: 'assistant' as const, content: 'Response 1' },
        { role: 'user' as const, content: 'Message 2' },
        { role: 'assistant' as const, content: 'Response 2' }
      ];

      const messages = buildConversationMessages('System', history, 'Message 3');

      expect(messages[1].content).toBe('Message 1');
      expect(messages[2].content).toBe('Response 1');
      expect(messages[3].content).toBe('Message 2');
      expect(messages[4].content).toBe('Response 2');
      expect(messages[5].content).toBe('Message 3');
    });

    test('should work with enhanced prompt', () => {
      manager.incrementTurn();
      manager.trackCorrection('old', 'new', 'context');

      const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
      const messages = buildConversationMessages(
        enhancedPrompt,
        [],
        'User message'
      );

      expect(messages[0].content).toContain('Important Corrections');
      expect(messages[0].content).toContain('old');
      expect(messages[0].content).toContain('new');
    });
  });
});
