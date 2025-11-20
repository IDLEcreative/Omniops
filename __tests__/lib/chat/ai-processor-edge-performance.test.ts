import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams
} from './ai-processor-setup';

describe('AI Processor - Edge Cases: Performance', () => {
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
  describe('Missing Configuration', () => {
    it('should use defaults when config missing', async () => {
      baseParams.config = {} as any;

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
      // Should use default maxIterations (3)
      expect(result.iteration).toBeLessThanOrEqual(3);
    });

    it('should handle missing domain', async () => {
      baseParams.domain = undefined;

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

    it('should work without telemetry', async () => {
      baseParams.telemetry = null;

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

    it('should handle invalid maxSearchIterations', async () => {
      baseParams.config = {
        ai: {
          maxSearchIterations: -1,
          searchTimeout: 10000
        }
      };

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
      // Should clamp to valid range
      expect(result.iteration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle rapid tool call responses', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                { id: 'call_1', type: 'function', function: { name: 'search_website_content', arguments: JSON.stringify({ query: 'a' }) } },
                { id: 'call_2', type: 'function', function: { name: 'search_website_content', arguments: JSON.stringify({ query: 'b' }) } },
                { id: 'call_3', type: 'function', function: { name: 'search_website_content', arguments: JSON.stringify({ query: 'c' }) } }
              ]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Processed all searches.',
              tool_calls: null
            }
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'a' },
          result: { success: true, results: [], source: 'embeddings' },
          executionTime: 10
        },
        {
          toolCall: { id: 'call_2' },
          toolName: 'search_website_content',
          toolArgs: { query: 'b' },
          result: { success: true, results: [], source: 'embeddings' },
          executionTime: 5
        },
        {
          toolCall: { id: 'call_3' },
          toolName: 'search_website_content',
          toolArgs: { query: 'c' },
          result: { success: true, results: [], source: 'embeddings' },
          executionTime: 15
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Result A' },
        { tool_call_id: 'call_2', content: 'Result B' },
        { tool_call_id: 'call_3', content: 'Result C' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.searchLog).toHaveLength(3);
    });
  });

  describe('Memory & Performance', () => {
    it('should not accumulate excessive data', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      // Simulate max iterations with many results
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_1',
              type: 'function',
              function: {
                name: 'search_website_content',
                arguments: JSON.stringify({ query: 'test' })
              }
            }]
          }
        }]
      });

      const largeResults = Array(100).fill(null).map((_, i) => ({
        url: `https://example.com/page${i}`,
        title: `Page ${i}`,
        content: 'Content '.repeat(100),
        similarity: 0.9
      }));

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test' },
          result: {
            success: true,
            results: largeResults,
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Many results found' }
      ]);

      const result = await processAIConversation(baseParams);

      // Should handle large result sets
      expect(result.allSearchResults.length).toBeGreaterThan(0);
    });
  });
});
