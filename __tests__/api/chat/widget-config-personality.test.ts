/**
 * Widget Configuration - Personality & Language Tests
 *
 * Tests for personality variations, language settings, and custom prompts
 */

import { describe, test, expect } from '@jest/globals';
import { getCustomerServicePrompt } from '@/lib/chat/system-prompts';
import type { WidgetConfig } from '@/lib/chat/conversation-manager';

describe('Widget Config - Personality & Language', () => {
  describe('Personality System Prompts', () => {
    test('should generate professional personality prompt (default)', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'professional' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('professional customer service representative');
      expect(prompt).toContain('accurate, helpful assistance');
      expect(prompt).toContain('building trust through honesty');
    });

    test('should generate friendly personality prompt', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'friendly' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('friendly and approachable');
      expect(prompt).toContain('warm, welcoming experience');
      expect(prompt).toContain('conversational tone');
      expect(prompt).toContain('empathy');
    });

    test('should generate concise personality prompt', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'concise' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('concise and efficient');
      expect(prompt).toContain('direct answers');
      expect(prompt).toContain('without unnecessary elaboration');
      expect(prompt).toContain('brief but helpful');
    });

    test('should generate technical personality prompt', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'technical' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('technical customer service');
      expect(prompt).toContain('precise, detailed technical information');
      expect(prompt).toContain('technical terminology');
      expect(prompt).toContain('specifications and technical accuracy');
    });

    test('should generate helpful personality prompt', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'helpful' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('helpful and supportive');
      expect(prompt).toContain('go above and beyond');
      expect(prompt).toContain('proactive suggestions');
      expect(prompt).toContain('comprehensive guidance');
    });

    test('should handle undefined personality (default to professional)', () => {
      const config: WidgetConfig = {
        ai_settings: {}
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('professional customer service representative');
    });
  });

  describe('Language Settings', () => {
    test('should add language instruction when language is specified', () => {
      const config: WidgetConfig = {
        ai_settings: {
          personality: 'professional',
          language: 'Spanish'
        }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain('🌐 LANGUAGE');
      expect(prompt).toContain('Respond in Spanish');
      expect(prompt).toContain('All your responses should be in this language');
    });

    test('should not add language instruction for auto-detect', () => {
      const config: WidgetConfig = {
        ai_settings: {
          personality: 'professional',
          language: 'auto'
        }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).not.toContain('🌐 LANGUAGE');
      expect(prompt).not.toContain('Respond in');
    });

    test('should not add language instruction when language is undefined', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'professional' }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).not.toContain('🌐 LANGUAGE');
    });
  });

  describe('Custom System Prompt Override', () => {
    test('should use custom system prompt for personality intro', () => {
      const customPrompt = 'You are a specialized technical support agent for hydraulic systems.';
      const config: WidgetConfig = {
        ai_settings: {
          customSystemPrompt: customPrompt
        }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain(customPrompt);
      expect(prompt).not.toContain('professional customer service representative');
      // Critical: Should still contain operational instructions
      expect(prompt).toContain('🔍 SEARCH BEHAVIOR');
      expect(prompt).toContain('🛒 WOOCOMMERCE OPERATIONS');
      expect(prompt).toContain('🚫 ANTI-HALLUCINATION RULES');
    });

    test('should prioritize custom prompt over personality setting but keep operations', () => {
      const customPrompt = 'You are a friendly hydraulic expert.';
      const config: WidgetConfig = {
        ai_settings: {
          personality: 'friendly',
          customSystemPrompt: customPrompt
        }
      };

      const prompt = getCustomerServicePrompt(config);

      expect(prompt).toContain(customPrompt);
      expect(prompt).not.toContain('friendly and approachable customer service');
      // Verify operational instructions are preserved
      expect(prompt).toContain('SEARCH BEHAVIOR');
      expect(prompt).toContain('WOOCOMMERCE OPERATIONS');
    });
  });

  describe('Operational Instructions Preservation', () => {
    test('should preserve all operational instructions with any config', () => {
      const configs = [
        { ai_settings: { personality: 'professional' } },
        { ai_settings: { personality: 'friendly' } },
        { ai_settings: { customSystemPrompt: 'You are a specialized expert.' } },
        { ai_settings: { language: 'Spanish' } },
        {}
      ];

      // All configs should contain critical operational sections
      const criticalSections = [
        '🔍 SEARCH BEHAVIOR',
        '🛒 WOOCOMMERCE OPERATIONS',
        '💬 CONTEXT & MEMORY',
        '🚫 ANTI-HALLUCINATION RULES',
        '📎 LINK FORMATTING'
      ];

      configs.forEach(config => {
        const prompt = getCustomerServicePrompt(config);
        criticalSections.forEach(section => {
          expect(prompt).toContain(section);
        });
      });
    });
  });
});
