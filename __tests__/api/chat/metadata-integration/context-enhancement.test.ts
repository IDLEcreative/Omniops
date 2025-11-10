/**
 * Context Enhancement Tests
 * Tests the generation of context for AI system prompts.
 */

import { describe, test, expect } from '@jest/globals';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { getEnhancedCustomerServicePrompt, getCustomerServicePrompt } from '@/lib/chat/system-prompts';

describe('Chat Route Metadata - Context Enhancement', () => {
  test('should generate context summary for system prompt', () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    manager.trackEntity({
      id: 'product_1',
      type: 'product',
      value: 'ZF4 Pump',
      aliases: ['it'],
      turnNumber: 1
    });

    manager.trackCorrection('ZF5', 'ZF4', 'user corrected');

    const enhancedContext = manager.generateContextSummary();

    expect(enhancedContext).toContain('Important Corrections');
    expect(enhancedContext).toContain('Recently Mentioned');
    expect(enhancedContext).toContain('ZF4 Pump');
  });

  test('should include context in enhanced system prompt', () => {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    manager.trackList([
      { name: 'Item 1', url: 'https://example.com/1' },
      { name: 'Item 2', url: 'https://example.com/2' }
    ]);

    const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);

    expect(enhancedPrompt).toContain('Active Numbered List');
    expect(enhancedPrompt).toContain('Item 1');
  });

  test('should handle empty metadata in context generation', () => {
    const manager = new ConversationMetadataManager();

    const enhancedContext = manager.generateContextSummary();
    expect(enhancedContext).toBe('');

    const enhancedPrompt = getEnhancedCustomerServicePrompt(manager);
    const basePrompt = getCustomerServicePrompt();

    expect(enhancedPrompt).toBe(basePrompt);
    expect(enhancedPrompt).toContain('customer service representative');
    expect(enhancedPrompt).not.toContain('CRITICAL: Conversation Context Awareness');
  });
});
