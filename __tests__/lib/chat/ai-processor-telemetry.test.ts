/**
 * AI Processor Tests: Telemetry & Configuration
 *
 * Tests logging, telemetry tracking, widget configuration, and response formatting.
 * Coverage: Telemetry, widget settings, sanitization, formatting.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';

jest.mock('@/lib/chat/get-available-tools');
jest.mock('@/lib/chat/ai-processor-tool-executor');
jest.mock('@/lib/chat/shopping-message-transformer');

import { getAvailableTools, checkToolAvailability, getToolInstructions } from '@/lib/chat/get-available-tools';
import { executeToolCallsParallel, formatToolResultsForAI } from '@/lib/chat/ai-processor-tool-executor';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams,
  mockSearchTool,
  createToolCallResponse,
  createTextResponse
} from './ai-processor-setup';

describe('AI Processor - Telemetry & Configuration', () => {
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

    (getAvailableTools as jest.Mock).mockResolvedValue([]);
    (checkToolAvailability as jest.Mock).mockResolvedValue({
      hasWooCommerce: false,
      hasShopify: false
    });
    (getToolInstructions as jest.Mock).mockReturnValue('');
  });

  describe('Response Formatting', () => {
    it('should sanitize outbound links in response', async () => {
      const mockSanitize = jest.fn((text: string) => text.replace(/https:\/\/external\.com/g, 'SANITIZED'));
      const paramsWithSanitizer = {
        ...baseParams,
        dependencies: {
          ...mockDependencies,
          sanitizeOutboundLinks: mockSanitize
        }
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Check out https://external.com for more info')
        }]
      });

      const result = await processAIConversation(paramsWithSanitizer);

      expect(mockSanitize).toHaveBeenCalled();
      expect(result.finalResponse).toBe('Check out SANITIZED for more info');
    });

    it('should not sanitize links for localhost/test domains', async () => {
      const mockSanitize = jest.fn();
      const localhostParams = {
        ...baseParams,
        domain: 'localhost',
        dependencies: {
          ...mockDependencies,
          sanitizeOutboundLinks: mockSanitize
        }
      };

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Response with link')
        }]
      });

      const result = await processAIConversation(localhostParams);

      expect(mockSanitize).not.toHaveBeenCalled();
    });

    it('should normalize whitespace in response', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Line 1\n\n\n\nLine 2')
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toBe('Line 1\n\nLine 2');
    });

    it('should convert numbered lists to bullet points', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('1. First item\n2. Second item\n3. Third item')
        }]
      });

      const result = await processAIConversation(baseParams);

      expect(result.finalResponse).toContain('- First item');
      expect(result.finalResponse).toContain('- Second item');
      expect(result.finalResponse).toContain('- Third item');
    });
  });

  describe('Telemetry and Logging', () => {
    it('should log initial completion request', async () => {
      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: createTextResponse('Response')
        }]
      });

      await processAIConversation(baseParams);

      expect(mockTelemetry.log).toHaveBeenCalledWith(
        'info',
        'ai',
        'Getting initial completion',
        expect.objectContaining({
          messageCount: 2,
          iteration: 0
        })
      );
    });

    it('should track each iteration', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'test' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Response')
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test' },
          result: { success: true, results: [], source: 'embeddings' },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Result' }
      ]);

      await processAIConversation(baseParams);

      expect(mockTelemetry.trackIteration).toHaveBeenCalledWith(1, 1);
      expect(mockTelemetry.trackIteration).toHaveBeenCalledWith(2, 0);
    });

    it('should track search executions', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'test query' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Response')
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'test query' },
          result: {
            success: true,
            results: [
              { url: 'url1', title: 'Result 1', content: '', similarity: 0.9 },
              { url: 'url2', title: 'Result 2', content: '', similarity: 0.8 }
            ],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Results found' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.searchLog).toEqual([
        {
          tool: 'search_website_content',
          query: 'test query',
          resultCount: 2,
          source: 'embeddings'
        }
      ]);
    });
  });

});
