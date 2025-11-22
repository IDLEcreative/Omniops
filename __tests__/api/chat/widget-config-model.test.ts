/**
 * Widget Configuration - Model Settings Tests
 *
 * Tests for response length, temperature, and model configuration
 */

import { describe, test, expect } from '@jest/globals';
import { getModelConfig } from '@/lib/chat/ai-processor-formatter';
import { getCustomerServicePrompt } from '@/lib/chat/system-prompts';
import type { WidgetConfig } from '@/lib/chat/conversation-manager';

describe('Widget Config - Model Settings', () => {
  describe('Response Length Control', () => {
    test('should set 1000 tokens for short responses', () => {
      const config: WidgetConfig = {
        ai_settings: { responseLength: 'short' }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.max_completion_tokens).toBe(1000);
    });

    test('should set 2500 tokens for balanced responses (default)', () => {
      const config: WidgetConfig = {
        ai_settings: { responseLength: 'balanced' }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.max_completion_tokens).toBe(2500);
    });

    test('should set 4000 tokens for detailed responses', () => {
      const config: WidgetConfig = {
        ai_settings: { responseLength: 'detailed' }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.max_completion_tokens).toBe(4000);
    });

    test('should use maxTokens setting when explicitly provided', () => {
      const config: WidgetConfig = {
        ai_settings: {
          responseLength: 'short',
          maxTokens: 3000  // Explicit override
        }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.max_completion_tokens).toBe(3000);
    });

    test('should default to 2500 tokens when no settings provided', () => {
      const modelConfig = getModelConfig(true, false, null);

      expect(modelConfig.max_completion_tokens).toBe(2500);
    });
  });

  // NOTE: Temperature tests skipped because GPT-5 mini does not support temperature parameter
  // The model uses a fixed temperature value and ignores any custom temperature settings
  // See lib/chat/ai-processor-formatter.ts lines 75-77 for details
  describe.skip('Temperature Settings (Not supported by GPT-5 mini)', () => {
    test('should use custom temperature when provided', () => {
      const config: WidgetConfig = {
        ai_settings: { temperature: 0.3 }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.temperature).toBe(0.3);
    });

    test('should default to 0.7 when no temperature provided', () => {
      const config: WidgetConfig = {
        ai_settings: {}
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.temperature).toBe(0.7);
    });

    test('should handle temperature of 0 (deterministic)', () => {
      const config: WidgetConfig = {
        ai_settings: { temperature: 0 }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.temperature).toBe(0);
    });

    test('should handle temperature of 1 (maximum creativity)', () => {
      const config: WidgetConfig = {
        ai_settings: { temperature: 1 }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.temperature).toBe(1);
    });
  });

  describe('Model Configuration', () => {
    test('should always use gpt-5-mini model', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'professional' }
      };

      const modelConfig = getModelConfig(true, false, config);

      expect(modelConfig.model).toBe('gpt-5-mini');
      expect(modelConfig.reasoning_effort).toBe('low');
    });

    test('should throw error if GPT-5 mini is not enabled', () => {
      const config: WidgetConfig = {
        ai_settings: { personality: 'professional' }
      };

      expect(() => {
        getModelConfig(false, false, config);
      }).toThrow('USE_GPT5_MINI must be set to true');
    });
  });

  describe('Full Configuration Integration', () => {
    test('should combine all settings correctly', () => {
      const config: WidgetConfig = {
        ai_settings: {
          personality: 'friendly',
          language: 'French',
          responseLength: 'detailed',
          temperature: 0.8,
          enableSmartSuggestions: true
        },
        integration_settings: {
          enableWebSearch: true,
          enableKnowledgeBase: true,
          dataSourcePriority: ['woocommerce', 'knowledge_base', 'web']
        }
      };

      // Test system prompt
      const prompt = getCustomerServicePrompt(config);
      expect(prompt).toContain('friendly and approachable');
      expect(prompt).toContain('Respond in French');

      // Test model config
      const modelConfig = getModelConfig(true, false, config);
      expect(modelConfig.max_completion_tokens).toBe(4000); // detailed
      // temperature not checked - GPT-5 mini doesn't support temperature parameter
      expect(modelConfig.model).toBe('gpt-5-mini');
    });

    test('should handle null/undefined config gracefully', () => {
      const prompt = getCustomerServicePrompt(null);
      expect(prompt).toContain('professional customer service representative');

      const modelConfig = getModelConfig(true, false, null);
      expect(modelConfig.max_completion_tokens).toBe(2500); // default balanced
      // temperature not checked - GPT-5 mini doesn't support temperature parameter
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty ai_settings object', () => {
      const config: WidgetConfig = {
        ai_settings: {}
      };

      const prompt = getCustomerServicePrompt(config);
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);

      const modelConfig = getModelConfig(true, false, config);
      expect(modelConfig.max_completion_tokens).toBe(2500);
      // temperature not checked - GPT-5 mini doesn't support temperature parameter
    });

    test('should handle missing ai_settings', () => {
      const config: WidgetConfig = {};

      const prompt = getCustomerServicePrompt(config);
      expect(prompt).toBeDefined();

      const modelConfig = getModelConfig(true, false, config);
      expect(modelConfig).toBeDefined();
    });
  });
});
