/**
 * AI Processor Tests: Core Functionality
 *
 * Tests basic message processing and ReAct loop orchestration.
 * Coverage: Message processing, tool execution, max iterations.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';

jest.mock('@/lib/chat/shopping-message-transformer');

import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams,
  mockSearchTool,
  mockCategorySearchTool,
  createToolCallResponse,
  createTextResponse
} from './ai-processor-setup';

describe('AI Processor - Core Functionality', () => {
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

  describe('Basic Message Processing', () => {
    it('should process a simple conversation without tools', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Hello! How can I help you today?')
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBe('Hello! How can I help you today?');
      expect(result.iteration).toBe(1);
      expect(result.allSearchResults).toEqual([]);
      expect(result.searchLog).toEqual([]);
      expect(mockTelemetry.trackIteration).toHaveBeenCalledWith(1, 0);
    });

    it('should handle empty AI response gracefully', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBe('I apologize, but I was unable to generate a response.');
    });

    it('should add tool availability instructions to system message', async () => {
      const toolInstructions = '⚠️ E-commerce operations are NOT available.';
      (mockDependencies.getToolInstructions as jest.Mock).mockReturnValue(toolInstructions);

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Response')
        }]
      });

      await processAIConversation(baseParams);

      expect(baseParams.conversationMessages[0].content).toContain(toolInstructions);
    });
  });

  describe('ReAct Loop - Tool Execution', () => {
    it('should execute tools and iterate until AI responds', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'test product' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('I found some information about the test product.')
          }]
        });

      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test product' },
          result: {
            success: true,
            results: [{
              url: 'https://example.com/product',
              title: 'Test Product',
              content: 'Product description',
              similarity: 0.9
            }],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Found: Test Product' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.iteration).toBe(2);
      expect(result.finalResponse).toBe('I found some information about the test product.');
      expect(result.allSearchResults).toHaveLength(1);
      expect(result.searchLog).toHaveLength(1);
      expect(mockDependencies.executeToolCallsParallel).toHaveBeenCalledWith(
        expect.any(Array),
        'example.com',
        10000,
        mockTelemetry,
        mockDependencies
      );
    });

    it('should execute multiple tools in parallel', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool, mockCategorySearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                createToolCallResponse('search_website_content', { query: 'product' }),
                createToolCallResponse('search_by_category', { category: 'parts' })
              ]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Found results from both searches.')
          }]
        });

      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'product' },
          result: { success: true, results: [{ url: 'url1', title: 'Result 1', content: '', similarity: 0.9 }], source: 'embeddings' },
          executionTime: 100
        },
        {
          toolCall: { id: 'call_2' },
          toolName: 'search_by_category',
          toolArgs: { category: 'parts' },
          result: { success: true, results: [{ url: 'url2', title: 'Result 2', content: '', similarity: 0.8 }], source: 'embeddings' },
          executionTime: 150
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Result 1' },
        { tool_call_id: 'call_2', content: 'Result 2' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.allSearchResults).toHaveLength(2);
      expect(result.searchLog).toHaveLength(2);
    });

    it('should respect max iterations limit', async () => {
      (mockDependencies.getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: null, // Null content triggers fallback message
            tool_calls: [createToolCallResponse('search_website_content', { query: 'test' })]
          }
        }]
      });

      (mockDependencies.executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test' },
          result: { success: true, results: [], source: 'embeddings' },
          executionTime: 100
        }
      ]);

      (mockDependencies.formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'No results' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.iteration).toBe(3);
      expect(result.finalResponse).toContain("I'm having trouble finding complete information");
    });
  });
});
