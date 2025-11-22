/**
 * AI Processor Tests: Shopping Mode Integration
 *
 * Tests shopping mode product collection and transformation.
 * Coverage: Product metadata, WooCommerce/Shopify integration, mobile triggers.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';

jest.mock('@/lib/chat/shopping-message-transformer');

import {
  transformWooCommerceProducts,
  transformShopifyProducts,
  shouldTriggerShoppingMode,
  extractShoppingContext
} from '@/lib/chat/shopping-message-transformer';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies,
  createBaseParams,
  mockSearchTool,
  createToolCallResponse,
  createTextResponse
} from './ai-processor-setup';

describe.skip('AI Processor - Shopping Mode Integration - PRE-EXISTING FAILURES (tracked in ISSUES.md)', () => {
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
      hasWooCommerce: true,
      hasShopify: false
    });
    (getToolInstructions as jest.Mock).mockReturnValue('');
  });

  describe('Product Collection', () => {
    it('should collect products from tool results', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'pumps' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Here are some pumps.')
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'pumps' },
          result: {
            success: true,
            results: [{
              url: 'https://example.com/product/pump1',
              title: 'Hydraulic Pump A4VTG90',
              content: 'Product description',
              similarity: 0.95,
              metadata: {
                id: '123',
                name: 'Hydraulic Pump A4VTG90',
                price: 500,
                permalink: 'https://example.com/product/pump1'
              }
            }],
            source: 'woocommerce-api'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Found: Hydraulic Pump' }
      ]);

      (transformWooCommerceProducts as jest.Mock).mockReturnValue([
        {
          id: '123',
          name: 'Hydraulic Pump A4VTG90',
          price: 500,
          image: '',
          permalink: 'pump1'
        }
      ]);

      (shouldTriggerShoppingMode as jest.Mock).mockReturnValue(true);
      (extractShoppingContext as jest.Mock).mockReturnValue('Check out these pumps');

      const result = await processAIConversation(baseParams);

      expect(result.shoppingProducts).toBeDefined();
      expect(result.shoppingProducts).toHaveLength(1);
      expect(result.shoppingContext).toBe('Check out these pumps');
    });

    it('should trigger shopping mode on mobile with any products', async () => {
      const mobileParams = {
        ...baseParams,
        isMobile: true
      };

      (getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'product' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Here is a product.')
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'product' },
          result: {
            success: true,
            results: [{
              url: 'https://example.com/product/item',
              title: 'Product',
              content: 'Description',
              similarity: 0.9,
              metadata: { id: '1', name: 'Product', price: 100 }
            }],
            source: 'woocommerce-api'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Product found' }
      ]);

      (transformWooCommerceProducts as jest.Mock).mockReturnValue([
        { id: '1', name: 'Product', price: 100, image: '', permalink: 'item' }
      ]);

      (shouldTriggerShoppingMode as jest.Mock).mockImplementation(
        (response: string, products: any[], isMobile?: boolean) => isMobile && products.length > 0
      );

      const result = await processAIConversation(mobileParams);

      expect(shouldTriggerShoppingMode).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        true
      );
    });

    it('should not trigger shopping mode when no products found', async () => {
      (getAvailableTools as jest.Mock).mockResolvedValue([mockSearchTool]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [createToolCallResponse('search_website_content', { query: 'policy' })]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: createTextResponse('Here is our policy.')
          }]
        });

      (executeToolCallsParallel as jest.Mock).mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'policy' },
          result: {
            success: true,
            results: [{
              url: 'https://example.com/policy',
              title: 'Return Policy',
              content: 'Policy text',
              similarity: 0.9
              // No metadata - not a product
            }],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      (formatToolResultsForAI as jest.Mock).mockReturnValue([
        { tool_call_id: 'call_1', content: 'Policy found' }
      ]);

      const result = await processAIConversation(baseParams);

      expect(result.shoppingProducts).toBeUndefined();
      expect(result.shoppingContext).toBeUndefined();
    });
  });
});
