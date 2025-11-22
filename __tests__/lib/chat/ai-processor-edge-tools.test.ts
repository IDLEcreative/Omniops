/**
 * Edge Cases: AI Processor - Tools & API
 * Tests tool execution failures and OpenAI API edge cases
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams
} from './ai-processor-setup';

describe('AI Processor - Edge Cases: Tools & API', () => {
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

  describe('Tool Execution', () => {
    it('should handle all tools returning no results', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'search_website_content',
                  arguments: JSON.stringify({ query: 'nonexistent product XYZ999' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "I couldn't find any information about that product.",
              tool_calls: null
            }
          }]
        });

      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'nonexistent product XYZ999' },
          result: {
            success: true,
            results: [], // No results
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'No results found' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.allSearchResults).toHaveLength(0);
      expect(result.finalResponse).toContain("couldn't find");
    });

    it('should handle all tools failing simultaneously', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } },
        { type: 'function', function: { name: 'search_by_category', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_website_content',
                    arguments: JSON.stringify({ query: 'test' })
                  }
                },
                {
                  id: 'call_2',
                  type: 'function',
                  function: {
                    name: 'search_by_category',
                    arguments: JSON.stringify({ category: 'products' })
                  }
                }
              ]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: 'I encountered errors with my searches. Please try again.',
              tool_calls: null
            }
          }]
        });

      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test' },
          result: { success: false, results: [], source: 'error' },
          executionTime: 100
        },
        {
          toolCall: { id: 'call_2' },
          toolName: 'search_by_category',
          toolArgs: { category: 'products' },
          result: { success: false, results: [], source: 'error' },
          executionTime: 100
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: '⚠️ ERROR: Search failed' },
        { tool_call_id: 'call_2', content: '⚠️ ERROR: Search failed' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.iteration).toBe(2);
      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle malformed tool results', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Processed the results.',
              tool_calls: null
            }
          }]
        });

      // Mock tool returning result without required fields
      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test' },
          result: {
            success: true,
            results: [
              { url: 'url1' } as any, // Missing title, content
              { title: 'Title only' } as any // Missing url, content
            ],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Partial results' }
      ]);

      await expect(processAIConversation(baseParams)).resolves.toBeDefined();
    });
  });

  describe('OpenAI API', () => {
    it('should handle no choices returned', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: []
      });

      await expect(async () => {
        await processAIConversation(baseParams);
      }).rejects.toThrow();
    });

    it('should handle null message', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: null
        }]
      });

      await expect(async () => {
        await processAIConversation(baseParams);
      }).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).code = 'rate_limit_exceeded';
      (rateLimitError as any).status = 429;

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockRejectedValue(rateLimitError);

      await expect(processAIConversation(baseParams)).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).code = 'invalid_api_key';
      (authError as any).status = 401;

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockRejectedValue(authError);

      await expect(processAIConversation(baseParams)).rejects.toThrow('Invalid API key');
    });
  });
});
