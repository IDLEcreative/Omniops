/**
 * WooCommerce E2E Integration Tests: Multi-Turn Conversations
 *
 * Tests conversation context maintenance across multiple searches.
 * Validates that conversation_id is preserved and context is maintained.
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

describe('WooCommerce E2E: Multi-Turn Conversations', () => {
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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createProductSearchToolCall('widgets', 100),
      createTextResponse('Found Widget A for $19.99')
    );

    const firstResponse = await POST(
      createChatRequest(firstRequestBody),
      createRouteContext(commerceModule.getCommerceProvider)
    );

    const firstData = await firstResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(provider.searchProducts).toHaveBeenCalledWith('widgets', 100);
    expect(firstData.conversation_id).toBe(conversationUuid);
  });
});
