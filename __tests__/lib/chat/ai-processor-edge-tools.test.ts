/**
 * Edge Cases: AI Processor - Tools & API
 * Tests tool execution failures and OpenAI API edge cases
 *
 * NOTE: These tests are blocked by Jest ESM mocking limitations.
 * See JEST_MOCKING_INVESTIGATION.md for full analysis.
 *
 * RECOMMENDED SOLUTION: Refactor ai-processor.ts to use dependency injection
 * instead of direct imports. See investigation doc for details.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

import OpenAI from 'openai';
import { processAIConversation } from '@/lib/chat/ai-processor';
import type { AIProcessorParams } from '@/lib/chat/ai-processor-types';
import { ChatTelemetry } from '@/lib/chat-telemetry';

// Import the modules to spy on
import * as getAvailableToolsModule from '@/lib/chat/get-available-tools';
import * as toolExecutorModule from '@/lib/chat/ai-processor-tool-executor';

// Jest ESM mocking issue - tests skipped pending refactor to dependency injection
describe.skip('AI Processor - Edge Cases: Tools & API', () => {
  let mockOpenAIClient: jest.Mocked<OpenAI>;
  let mockTelemetry: jest.Mocked<ChatTelemetry>;
  let mockDependencies: any;
  let baseParams: AIProcessorParams;

  // Spies - created in beforeEach
  let mockedGetAvailableTools: jest.SpyInstance;
  let mockedCheckToolAvailability: jest.SpyInstance;
  let mockedGetToolInstructions: jest.SpyInstance;
  let mockedExecuteToolCallsParallel: jest.SpyInstance;
  let mockedFormatToolResultsForAI: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh spies for each test
    mockedGetAvailableTools = jest.spyOn(getAvailableToolsModule, 'getAvailableTools').mockResolvedValue([]);
    mockedCheckToolAvailability = jest.spyOn(getAvailableToolsModule, 'checkToolAvailability').mockResolvedValue({ hasWooCommerce: false, hasShopify: false });
    mockedGetToolInstructions = jest.spyOn(getAvailableToolsModule, 'getToolInstructions').mockReturnValue('');
    mockedExecuteToolCallsParallel = jest.spyOn(toolExecutorModule, 'executeToolCallsParallel').mockResolvedValue([]);
    mockedFormatToolResultsForAI = jest.spyOn(toolExecutorModule, 'formatToolResultsForAI').mockReturnValue([]);

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

    mockedGetAvailableTools.mockResolvedValue([]);
    mockedCheckToolAvailability.mockResolvedValue({
      hasWooCommerce: false,
      hasShopify: false
    });
    mockedGetToolInstructions.mockReturnValue('');
  });

  describe('Tool Execution', () => {
    it('should handle all tools returning no results', async () => {
      mockedGetAvailableTools.mockResolvedValue([
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

      mockedExecuteToolCallsParallel.mockResolvedValue([
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

      mockedFormatToolResultsForAI.mockReturnValue([
        { tool_call_id: 'call_1', content: 'No results found' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.allSearchResults).toHaveLength(0);
      expect(result.finalResponse).toContain("couldn't find");
    });

    it('should handle all tools failing simultaneously', async () => {
      mockedGetAvailableTools.mockResolvedValue([
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

      mockedExecuteToolCallsParallel.mockResolvedValue([
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

      mockedFormatToolResultsForAI.mockReturnValue([
        { tool_call_id: 'call_1', content: '⚠️ ERROR: Search failed' },
        { tool_call_id: 'call_2', content: '⚠️ ERROR: Search failed' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.iteration).toBe(2);
      expect(result.finalResponse).toBeTruthy();
    });

    it('should handle malformed tool results', async () => {
      mockedGetAvailableTools.mockResolvedValue([
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
      mockedExecuteToolCallsParallel.mockResolvedValue([
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

      mockedFormatToolResultsForAI.mockReturnValue([
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
