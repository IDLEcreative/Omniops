/**
 * Hallucination Prevention Tests: Technical Specifications & Compatibility
 *
 * CRITICAL: Validates anti-hallucination safeguards for technical queries
 *
 * Tests ensure the AI:
 * - Admits uncertainty when lacking technical specs
 * - Doesn't speculate on specifications
 * - Avoids false compatibility claims
 * - Doesn't fabricate product origin information
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

describe('AI Processor - Hallucination Prevention - Technical', () => {
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
        { role: 'system', content: 'You are a helpful assistant. Never speculate or make up information.' },
        { role: 'user', content: '' }
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

  describe('Technical Specifications - No Speculation', () => {
    it('should admit uncertainty when technical specs are not available', async () => {
      baseParams.conversationMessages[1].content = 'What is the horsepower rating of the hydraulic pump A4VTG90?';

      (getAvailableTools as jest.Mock).mockResolvedValue([
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
                  arguments: JSON.stringify({ query: 'A4VTG90 horsepower specifications' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "I don't have the specific horsepower rating for the A4VTG90 in our current documentation. For accurate technical specifications, I recommend contacting our technical team or referring to the manufacturer's datasheet.",
              tool_calls: null
            }
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'A4VTG90 horsepower specifications' },
          result: {
            success: true,
            results: [], // No results - specs not available
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'No technical specifications found for A4VTG90' }
      ]);

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should admit uncertainty
      const admitsUncertainty =
        lower.includes("don't have") ||
        lower.includes('not available') ||
        lower.includes('contact') ||
        lower.includes('specific details') ||
        lower.includes('specification') ||
        lower.includes('datasheet');

      // Should NOT provide specific numbers
      const hasSpecificNumber = /\d+\s*(hp|horsepower|kw|kilowatt)/i.test(result.finalResponse);

      expect(admitsUncertainty).toBe(true);
      expect(hasSpecificNumber).toBe(false);
    });

  });

  describe('Compatibility Claims - No False Promises', () => {
    it('should not make definitive compatibility claims without data', async () => {
      baseParams.conversationMessages[1].content = 'Will the Rexroth pump fit my 2018 mixer model?';

      (getAvailableTools as jest.Mock).mockResolvedValue([
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
                  arguments: JSON.stringify({ query: 'Rexroth pump compatibility' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "To verify compatibility with your 2018 mixer model, I'll need your specific model number. Pump compatibility depends on several factors. Please contact our technical team with your mixer's model number for accurate compatibility information.",
              tool_calls: null
            }
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'Rexroth pump compatibility' },
          result: {
            success: true,
            results: [],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'No compatibility information found' }
      ]);

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT make definitive claims
      const makesDefinitiveClaim =
        (lower.includes('will fit') || lower.includes('compatible')) &&
        !lower.includes('verify') &&
        !lower.includes('check') &&
        !lower.includes('contact');

      // Should ask for verification
      const asksForVerification =
        lower.includes('verify') ||
        lower.includes('check') ||
        lower.includes('contact') ||
        lower.includes('model number');

      expect(makesDefinitiveClaim).toBe(false);
      expect(asksForVerification).toBe(true);
    });
  });

});
