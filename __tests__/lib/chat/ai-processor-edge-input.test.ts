import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams
} from './ai-processor-setup';

describe('AI Processor - Edge Cases: Input', () => {
  let mockOpenAIClient: ReturnType<typeof createMockOpenAIClient>;
  let mockTelemetry: ReturnType<typeof createMockTelemetry>;
  let mockDependencies: ReturnType<typeof createMockDependencies>;
  let baseParams: ReturnType<typeof createBaseParams>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenAIClient = createMockOpenAIClient();
    mockTelemetry = createMockTelemetry();
    mockDependencies = createMockDependencies();
    baseParams = createBaseParams(mockOpenAIClient, mockTelemetry, mockDependencies);
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
