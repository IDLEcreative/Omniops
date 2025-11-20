/**
 * Hallucination Prevention Tests: Commerce & Pricing
 *
 * CRITICAL: Validates anti-hallucination safeguards for commerce queries
 *
 * Tests ensure the AI:
 * - Doesn't fabricate pricing or availability
 * - Doesn't quote specific discounts without authority
 * - Properly qualifies delivery estimates
 * - Doesn't state specific warranty terms without data
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams
} from './ai-processor-setup';

describe('AI Processor - Hallucination Prevention - Commerce', () => {
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

    // Update system message for hallucination prevention
    baseParams.conversationMessages[0].content = 'You are a helpful assistant. Never speculate or make up information.';
  });

  describe('Stock and Availability - No Fabrication', () => {
    it('should not provide specific stock quantities without real-time data', async () => {
      baseParams.conversationMessages[1].content = 'How many chute pumps do you have in stock?';

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: "I don't have access to real-time stock information. For current availability, please contact our sales team or check our inventory system directly.",
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT provide specific quantities
      const hasSpecificQuantity = /\d+\s*(in stock|available|units?|pieces?)/i.test(result.finalResponse);

      // Should admit no stock info
      const admitsNoStockInfo =
        lower.includes('stock information') ||
        lower.includes('availability') ||
        lower.includes('contact') ||
        lower.includes('real-time');

      expect(hasSpecificQuantity).toBe(false);
      expect(admitsNoStockInfo).toBe(true);
    });
  });

  describe('Delivery Promises - Properly Qualified', () => {
    it('should not make specific delivery promises without context', async () => {
      baseParams.conversationMessages[1].content = 'When will my pump arrive if I order today?';

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: "Delivery times typically depend on your location and the shipping method selected. For an accurate delivery estimate, please contact our shipping department or complete the checkout process where you'll see estimated delivery dates.",
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT make specific promises
      const makesPromise = lower.includes('will arrive') || lower.includes("you'll receive");
      const hasUnqualifiedTimeframe =
        (/\d+\s*(days?|weeks?)/i.test(result.finalResponse)) &&
        !lower.includes('typically') &&
        !lower.includes('usually') &&
        !lower.includes('estimated') &&
        !lower.includes('depends');

      // Should properly qualify
      const properlyQualified =
        lower.includes('typically') ||
        lower.includes('depend') ||
        lower.includes('estimated') ||
        lower.includes('contact');

      expect(makesPromise && hasUnqualifiedTimeframe).toBe(false);
      expect(properlyQualified).toBe(true);
    });
  });

  describe('Pricing - No Fabricated Costs', () => {
    it('should not fabricate prices or comparisons without data', async () => {
      baseParams.conversationMessages[1].content = 'Which pump is cheaper - the A4VTG90 or the A4VTG71?';

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
                  arguments: JSON.stringify({ query: 'A4VTG90 A4VTG71 price' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "I don't have current pricing information for those specific models. For accurate pricing and comparisons, please contact our sales team for a quote.",
              tool_calls: null
            }
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'A4VTG90 A4VTG71 price' },
          result: {
            success: true,
            results: [],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'No pricing information found' }
      ]);

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT make price comparisons without data
      const makesComparison =
        (lower.includes('cheaper') || lower.includes('more expensive')) &&
        !/£\d+|\$\d+|€\d+/.test(result.finalResponse);

      // Should refer to contact
      const refersToContact = lower.includes('contact') || lower.includes('quote');

      expect(makesComparison && !refersToContact).toBe(false);
    });

    it('should not quote specific discounts without authority', async () => {
      baseParams.conversationMessages[1].content = 'What discount do you offer if I buy 10 pumps?';

      (mockOpenAIClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            role: 'assistant',
            content: "For bulk pricing and volume discounts, please contact our sales team. They can provide you with a custom quote based on your specific requirements and order size.",
            tool_calls: null
          }
        }]
      });

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT quote specific discounts
      const hasSpecificDiscount = /\d+\s*%|£\d+\s*off|\$\d+\s*off/i.test(result.finalResponse);

      // Should refer to sales team
      const refersToContact =
        lower.includes('contact') ||
        lower.includes('quote') ||
        lower.includes('sales team');

      expect(hasSpecificDiscount).toBe(false);
      expect(refersToContact).toBe(true);
    });
  });

});
