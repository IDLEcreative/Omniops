/**
 * WooCommerce E2E Integration Tests: Fallback Scenarios
 *
 * Tests fallback to semantic search when WooCommerce provider fails or is unavailable.
 * Validates graceful degradation and error handling.
 */

import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { POST } from '@/app/api/chat/route';
import OpenAI from 'openai';
import { mockCommerceProvider } from '@/test-utils/api-test-helpers';
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
// Create a shared mock for WooCommerce client that can be configured per test
const mockWooClientShared = {
  get: jest.fn(),
  getProducts: jest.fn(),
};

jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: jest.fn(async () => mockWooClientShared),
}));
jest.mock('@/lib/woocommerce-currency', () => ({
  getCurrency: jest.fn().mockResolvedValue({
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  }),
}));
jest.mock('@/lib/chat/woocommerce-metrics', () => ({
  trackOperationMetrics: jest.fn().mockResolvedValue(undefined),
  getCustomerConfigId: jest.fn().mockResolvedValue(null),
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

// TODO: Fix fallback scenarios - missing USE_GPT5_MINI env var
describe.skip('WooCommerce E2E: Fallback Scenarios', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>;
  let commerceModule: any;
  let embeddingsModule: any;
  let woocommerceDynamicModule: any;

  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock();
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance);
  });

  beforeEach(() => {
    resetTestEnvironment();
    mockOpenAIInstance.chat.completions.create.mockClear();

    // Use helper to set mock Supabase client with customer config
    const mockSupabase = createFreshSupabaseMock();

    // Mock customer_configs table to return WooCommerce configuration
    const originalFrom = mockSupabase.from;
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'customer_configs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-config-id',
              domain: 'shop.example.com',
              woocommerce_config: {
                url: 'https://shop.example.com',
                consumer_key: 'ck_test',
                consumer_secret: 'cs_test',
              },
            },
            error: null,
          }),
        };
      }
      return originalFrom(table);
    });

    __setMockSupabaseClient(mockSupabase);

    commerceModule = jest.requireMock('@/lib/agents/commerce-provider');
    commerceModule.getCommerceProvider.mockClear();
    commerceModule.getCommerceProvider.mockResolvedValue(null);

    woocommerceDynamicModule = jest.requireMock('@/lib/woocommerce-dynamic');
    woocommerceDynamicModule.getDynamicWooCommerceClient.mockClear();

    // Clear mock WooCommerce client call history
    mockWooClientShared.get.mockClear();
    mockWooClientShared.getProducts.mockClear();

    embeddingsModule = jest.requireMock('@/lib/embeddings');
    embeddingsModule.searchSimilarContent.mockReset();
    embeddingsModule.searchSimilarContent.mockResolvedValue([]);

    const rateLimitModule = jest.requireMock('@/lib/rate-limit');
    const mockRateLimit = createFreshRateLimitMock(true);
    rateLimitModule.checkDomainRateLimit.mockClear();
    rateLimitModule.checkDomainRateLimit.mockImplementation(mockRateLimit);
  });

  it('should fall back to semantic search when WooCommerce provider fails', async () => {
    // Configure WooCommerce mock to fail
    mockWooClientShared.get.mockRejectedValue(new Error('WooCommerce API timeout'));

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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createProductSearchToolCall('widgets', 100),
      createTextResponse('Based on our website content, here are our widget offerings...')
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider, {
        searchSimilarContent: embeddingsModule.searchSimilarContent,
      })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    // The fallback flow works correctly (endpoint doesn't crash when WooCommerce fails)
    expect(data).toBeDefined();
    expect(data.message).toBeTruthy();
  });

  it('should work without WooCommerce provider configured (semantic search only)', async () => {
    // Configure WooCommerce client to return null (not configured)
    woocommerceDynamicModule.getDynamicWooCommerceClient.mockResolvedValue(null);

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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createProductSearchToolCall('products', 100),
      createTextResponse('We have a variety of products available. Check our catalog!')
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider, {
        searchSimilarContent: embeddingsModule.searchSimilarContent,
      })
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    // The no-provider flow works correctly (endpoint doesn't crash without WooCommerce)
    expect(data).toBeDefined();
    expect(data.message).toBeTruthy();
  });
});
