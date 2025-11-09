/**
 * WooCommerce E2E Integration Tests: Product Search
 *
 * Tests product search functionality through the chat agent + WooCommerce integration.
 * Validates search_products and get_product_details tool calls.
 */

import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { POST } from '@/app/api/chat/route';
import OpenAI from 'openai';
import { mockCommerceProvider, createMockProduct } from '@/test-utils/api-test-helpers';
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  createFreshSupabaseMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup';
import {
  createChatRequest,
  createProductSearchToolCall,
  createTextResponse,
  createProductDetailsToolCall,
  setupTwoCallAIMock,
  createRouteContext,
} from '@/__tests__/utils/woocommerce/e2e-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

// Mock dependencies
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

describe('WooCommerce E2E: Product Search', () => {
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

    // Use helper to set mock Supabase client
    const mockSupabase = createFreshSupabaseMock();
    __setMockSupabaseClient(mockSupabase);

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
    setupTwoCallAIMock(
      mockOpenAIInstance,
      createProductSearchToolCall('widgets', 100),
      createTextResponse(
        'Yes! We have 2 widgets available:\n\n1. Premium Widget Pro - $49.99\n2. Standard Widget - $29.99'
      )
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider)
    );

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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createProductDetailsToolCall('Ultra Widget XL', true),
      createTextResponse(
        'The Ultra Widget XL is our premium product priced at $99.99. It features extra-large size with premium materials. We currently have 15 units in stock.'
      )
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider)
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(provider.getProductDetails).toHaveBeenCalledWith('Ultra Widget XL');
    expect(data.message).toContain('Ultra Widget XL');
    expect(data.message).toContain('99.99');
  });
});
