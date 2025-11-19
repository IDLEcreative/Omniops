/**
 * Edge Cases: AI Processor - Input Handling
 * Tests empty/malformed input, very long messages, and special characters
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import OpenAI from 'openai';
import { processAIConversation } from '@/lib/chat/ai-processor';
import type { AIProcessorParams } from '@/lib/chat/ai-processor-types';
import { ChatTelemetry } from '@/lib/chat-telemetry';

jest.mock('@/lib/chat/get-available-tools');
jest.mock('@/lib/chat/ai-processor-tool-executor');

import { getAvailableTools, checkToolAvailability, getToolInstructions } from '@/lib/chat/get-available-tools';
import { executeToolCallsParallel, formatToolResultsForAI } from '@/lib/chat/ai-processor-tool-executor';

describe('AI Processor - Edge Cases: Input', () => {
  let mockOpenAIClient: jest.Mocked<OpenAI>;
  let mockTelemetry: jest.Mocked<ChatTelemetry>;
  let mockDependencies: any;
  let baseParams: AIProcessorParams;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    mockTelemetry = {
      log: jest.fn(),
      trackIteration: jest.fn(),
      trackSearch: jest.fn()
    } as any;

    mockDependencies = {
      getCommerceProvider: jest.fn(),
      searchSimilarContent: jest.fn(),
      sanitizeOutboundLinks: jest.fn((text: string) => text)
    };

    baseParams = {
      conversationMessages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Test' }
      ],
      domain: 'example.com',
      config: {
        ai: {
          maxSearchIterations: 3,
          searchTimeout: 10000
        }
      },
      widgetConfig: null,
      telemetry: mockTelemetry,
      openaiClient: mockOpenAIClient,
      useGPT5Mini: true,
      dependencies: mockDependencies,
      isMobile: false
    };

    (getAvailableTools as jest.Mock).mockResolvedValue([]);
    (checkToolAvailability as jest.Mock).mockResolvedValue({
      hasWooCommerce: false,
      hasShopify: false
    });
    (getToolInstructions as jest.Mock).mockReturnValue('');
  });

  describe('Empty & Malformed Input', () => {
    it('should handle empty message content', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: '' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'How can I help you?',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
      expect(result.iteration).toBeGreaterThan(0);
    });

    it('should handle whitespace-only messages', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: '   \n\t   ' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'I\'m here to help!',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle missing conversation messages', async () => {
      baseParams.conversationMessages = [];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Response',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle malformed message objects', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        { role: 'user' } as any // Missing content
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Response',
            tool_calls: null
          }
        }]
      });

      await expect(processAIConversation(baseParams)).resolves.toBeDefined();
    });
  });

  describe('Very Long Messages', () => {
    it('should handle very long user messages', async () => {
      const longMessage = 'word '.repeat(5000); // ~5000 tokens
      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: longMessage }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'I understand your detailed question.',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle long conversation history', async () => {
      const longHistory = [];
      for (let i = 0; i < 100; i++) {
        longHistory.push({ role: 'user', content: `Message ${i}` });
        longHistory.push({ role: 'assistant', content: `Response ${i}` });
      }

      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        ...longHistory,
        { role: 'user', content: 'Current question' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Based on our conversation history...',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });
  });

  describe('Special Characters', () => {
    it('should handle special characters', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'Product: "Pump™" with £500 price & 20% off! <script>alert("xss")</script>' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'I found the product you\'re looking for.',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle unicode and emojis', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: '🔧 Hydraulic pump 💪 with 日本語 characters' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: '✅ Found it!',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle markdown and code blocks', async () => {
      baseParams.conversationMessages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'Search for ```javascript\nconst pump = "A4VTG90";\n```' }
      ];

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: 'I understand you\'re looking for the A4VTG90.',
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBeTruthy();
    });
  });
});
