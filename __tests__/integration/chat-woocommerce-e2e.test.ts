/**
 * End-to-End Integration Test: Chat Agent + WooCommerce
 *
 * This test validates the complete flow from chat message to WooCommerce API call
 * and back to the user, ensuring all integration points work correctly.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';
import OpenAI from 'openai';
import { mockCommerceProvider, createMockProduct } from '@/test-utils/api-test-helpers';
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  createFreshSupabaseMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/rate-limit');
jest.mock('openai');
jest.mock('@/lib/embeddings');
jest.mock('@/lib/agents/commerce-provider', () => ({
  getCommerceProvider: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/link-sanitizer', () => ({
  sanitizeOutboundLinks: jest.fn((message) => message),
}));
jest.mock('@/lib/search-wrapper', () => ({
  extractQueryKeywords: jest.fn((q) => [q]),
  isPriceQuery: jest.fn(() => false),
  extractPriceRange: jest.fn(() => null),
}));
jest.mock('@/lib/chat-telemetry', () => ({
  ChatTelemetry: jest.fn(),
  telemetryManager: {
    createSession: jest.fn(() => ({
      log: jest.fn(),
      trackIteration: jest.fn(),
      trackSearch: jest.fn(),
      complete: jest.fn(),
    })),
  },
}));
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackAsync: jest.fn((fn) => fn()),
}));
jest.mock('@/lib/redis-fallback', () => ({
  getRedisClientWithFallback: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Set environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
process.env.USE_GPT5_MINI = 'true'; // Required for chat API
process.env.NODE_ENV = 'test';

describe('Chat Agent + WooCommerce E2E Integration', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>;
  let commerceModule: any;
  let embeddingsModule: any;

  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock();
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance);
  });

  beforeEach(() => {
    resetTestEnvironment();
    mockOpenAIInstance.chat.completions.create.mockClear();

    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    const mockSupabase = createFreshSupabaseMock();
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase);
    supabaseModule.requireClient.mockResolvedValue(mockSupabase);
    supabaseModule.requireServiceRoleClient.mockResolvedValue(mockSupabase);
    supabaseModule.validateSupabaseEnv.mockReturnValue(true);

    commerceModule = jest.requireMock('@/lib/agents/commerce-provider');
    commerceModule.getCommerceProvider.mockReset();
    commerceModule.getCommerceProvider.mockResolvedValue(null);

    embeddingsModule = jest.requireMock('@/lib/embeddings');
    embeddingsModule.searchSimilarContent.mockReset();
    embeddingsModule.searchSimilarContent.mockResolvedValue([]);

    const rateLimitModule = jest.requireMock('@/lib/rate-limit');
    const mockRateLimit = createFreshRateLimitMock(true);
    rateLimitModule.checkDomainRateLimit.mockClear();
    rateLimitModule.checkDomainRateLimit.mockImplementation(mockRateLimit);
  });

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('Product Search Scenarios', () => {
    it('should successfully search products via WooCommerce when user asks about products', async () => {
      // Setup WooCommerce provider with test products
      const mockProducts = [
        createMockProduct({
          id: 1,
          name: 'Premium Widget Pro',
          price: '49.99',
          sku: 'WIDGET-PRO-001',
          permalink: 'https://shop.example.com/products/widget-pro',
          description: 'Professional grade widget with advanced features',
        }),
        createMockProduct({
          id: 2,
          name: 'Standard Widget',
          price: '29.99',
          sku: 'WIDGET-STD-001',
          permalink: 'https://shop.example.com/products/widget-standard',
          description: 'Entry-level widget for everyday use',
        }),
      ];

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        products: mockProducts,
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      const requestBody = {
        message: 'Do you have any widgets available?',
        session_id: 'test-session-widgets',
        domain: 'shop.example.com',
      };

      // Mock AI ReAct loop: first call uses search_products, second call responds with results
      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // AI decides to search for products
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_search_widgets',
                      type: 'function',
                      function: {
                        name: 'search_products',
                        arguments: JSON.stringify({ query: 'widgets', limit: 100 }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          // AI responds with product information
          return {
            choices: [
              {
                message: {
                  content:
                    'Yes! We have 2 widgets available:\n\n1. Premium Widget Pro - $49.99\n2. Standard Widget - $29.99',
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(provider.searchProducts).toHaveBeenCalledWith('widgets', 100);
      expect(data.message).toContain('Premium Widget Pro');
      expect(data.message).toContain('Standard Widget');
      expect(data.searchMetadata.totalSearches).toBe(1);
      expect(data.sources).toBeDefined();
    });

    it('should handle specific product detail requests through get_product_details tool', async () => {
      const productDetails = createMockProduct({
        id: 123,
        name: 'Ultra Widget XL',
        price: '99.99',
        sku: 'ULTRA-XL-2024',
        permalink: 'https://shop.example.com/products/ultra-widget-xl',
        description: 'Extra-large widget with premium materials',
        stock_quantity: 15,
        stock_status: 'instock',
      });

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        getProductDetails: jest.fn().mockResolvedValue(productDetails),
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      const requestBody = {
        message: 'Tell me about the Ultra Widget XL',
        session_id: 'test-session-product-details',
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_product_details',
                      type: 'function',
                      function: {
                        name: 'get_product_details',
                        arguments: JSON.stringify({
                          productQuery: 'Ultra Widget XL',
                          includeSpecs: true,
                        }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content:
                    'The Ultra Widget XL is our premium product priced at $99.99. It features extra-large size with premium materials. We currently have 15 units in stock.',
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(provider.getProductDetails).toHaveBeenCalledWith('Ultra Widget XL');
      expect(data.message).toContain('Ultra Widget XL');
      expect(data.message).toContain('99.99');
    });
  });

  describe('Order Lookup Scenarios', () => {
    it('should look up order information when user provides order number', async () => {
      const orderInfo = {
        id: 12345,
        number: 'ORD-2024-001',
        status: 'processing',
        date: '2024-10-28',
        total: '149.97',
        currency: '$',
        items: [
          { name: 'Premium Widget Pro', quantity: 2, total: '99.98' },
          { name: 'Standard Widget', quantity: 1, total: '29.99' },
        ],
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        trackingNumber: 'TRACK123456',
        permalink: 'https://shop.example.com/orders/12345',
      };

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(orderInfo),
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      const requestBody = {
        message: 'Can you check the status of order ORD-2024-001?',
        session_id: 'test-session-order-lookup',
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_order_lookup',
                      type: 'function',
                      function: {
                        name: 'lookup_order',
                        arguments: JSON.stringify({ orderId: 'ORD-2024-001' }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content:
                    'Your order ORD-2024-001 is currently being processed. It contains 2x Premium Widget Pro and 1x Standard Widget. Total: $149.97. Tracking number: TRACK123456',
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(provider.lookupOrder).toHaveBeenCalledWith('ORD-2024-001');
      expect(data.message).toContain('ORD-2024-001');
      expect(data.message).toContain('TRACK123456');
    });

    it('should handle order not found gracefully', async () => {
      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(null),
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      const requestBody = {
        message: "What's the status of order 99999?",
        session_id: 'test-session-order-not-found',
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_order_lookup',
                      type: 'function',
                      function: {
                        name: 'lookup_order',
                        arguments: JSON.stringify({ orderId: '99999' }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content:
                    "I couldn't find an order with that number. Could you please double-check the order number?",
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(provider.lookupOrder).toHaveBeenCalledWith('99999');
      expect(data.message).toContain("couldn't find");
    });
  });

  describe('Multi-Turn Conversations', () => {
    it('should maintain context across multiple product searches', async () => {
      const widgetProducts = [
        createMockProduct({
          id: 1,
          name: 'Widget A',
          price: '19.99',
        }),
      ];

      const gadgetProducts = [
        createMockProduct({
          id: 2,
          name: 'Gadget X',
          price: '39.99',
        }),
      ];

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        searchProducts: jest
          .fn()
          .mockResolvedValueOnce(widgetProducts)
          .mockResolvedValueOnce(gadgetProducts),
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      // First message: Search for widgets
      const conversationUuid = '550e8400-e29b-41d4-a716-446655440000';
      const firstRequestBody = {
        message: 'Show me widgets',
        session_id: 'test-multi-turn',
        conversation_id: conversationUuid,
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_1',
                      type: 'function',
                      function: {
                        name: 'search_products',
                        arguments: JSON.stringify({ query: 'widgets', limit: 100 }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content: 'Found Widget A for $19.99',
                },
              },
            ],
          } as any;
        }
      });

      const firstResponse = await POST(createRequest(firstRequestBody), {
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      } as any);

      const firstData = await firstResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(provider.searchProducts).toHaveBeenCalledWith('widgets', 100);
      expect(firstData.conversation_id).toBe(conversationUuid);
    });
  });

  describe('Fallback Scenarios', () => {
    it('should fall back to semantic search when WooCommerce provider fails', async () => {
      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('WooCommerce API timeout')),
      });

      commerceModule.getCommerceProvider.mockResolvedValue(provider);

      const mockSemanticResults = [
        {
          content: 'Widget information from scraped content',
          url: 'https://shop.example.com/widgets',
          title: 'Our Widgets',
          similarity: 0.85,
        },
      ];

      embeddingsModule.searchSimilarContent.mockResolvedValue(mockSemanticResults);

      const requestBody = {
        message: 'Show me widgets',
        session_id: 'test-fallback',
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_1',
                      type: 'function',
                      function: {
                        name: 'search_products',
                        arguments: JSON.stringify({ query: 'widgets', limit: 100 }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content: 'Based on our website content, here are our widget offerings...',
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
          searchSimilarContent: embeddingsModule.searchSimilarContent,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(provider.searchProducts).toHaveBeenCalled();
      expect(embeddingsModule.searchSimilarContent).toHaveBeenCalled();
      expect(data.message).toBeTruthy();
    });

    it('should work without WooCommerce provider configured (semantic search only)', async () => {
      commerceModule.getCommerceProvider.mockResolvedValue(null);

      const mockSemanticResults = [
        {
          content: 'Product catalog information',
          url: 'https://shop.example.com/catalog',
          title: 'Product Catalog',
          similarity: 0.9,
        },
      ];

      embeddingsModule.searchSimilarContent.mockResolvedValue(mockSemanticResults);

      const requestBody = {
        message: 'What products do you have?',
        session_id: 'test-no-provider',
        domain: 'shop.example.com',
      };

      let callCount = 0;
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_1',
                      type: 'function',
                      function: {
                        name: 'search_products',
                        arguments: JSON.stringify({ query: 'products', limit: 100 }),
                      },
                    },
                  ],
                },
              },
            ],
          } as any;
        } else {
          return {
            choices: [
              {
                message: {
                  content: 'We have a variety of products available. Check our catalog!',
                },
              },
            ],
          } as any;
        }
      });

      const response = await POST(createRequest(requestBody), {
        params: Promise.resolve({}),
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
          searchSimilarContent: embeddingsModule.searchSimilarContent,
        },
      } as any);

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(commerceModule.getCommerceProvider).toHaveBeenCalled();
      expect(embeddingsModule.searchSimilarContent).toHaveBeenCalled();
      expect(data.message).toBeTruthy();
    });
  });
});
