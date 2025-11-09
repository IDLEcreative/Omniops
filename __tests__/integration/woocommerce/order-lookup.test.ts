/**
 * WooCommerce E2E Integration Tests: Order Lookup
 *
 * Tests order lookup functionality through the chat agent + WooCommerce integration.
 * Validates lookup_order tool call and error handling.
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
  createOrderLookupToolCall,
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

describe('WooCommerce E2E: Order Lookup', () => {
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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createOrderLookupToolCall('ORD-2024-001'),
      createTextResponse(
        'Your order ORD-2024-001 is currently being processed. It contains 2x Premium Widget Pro and 1x Standard Widget. Total: $149.97. Tracking number: TRACK123456'
      )
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider)
    );

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

    setupTwoCallAIMock(
      mockOpenAIInstance,
      createOrderLookupToolCall('99999'),
      createTextResponse(
        "I couldn't find an order with that number. Could you please double-check the order number?"
      )
    );

    const response = await POST(
      createChatRequest(requestBody),
      createRouteContext(commerceModule.getCommerceProvider)
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(provider.lookupOrder).toHaveBeenCalledWith('99999');
    expect(data.message).toContain("couldn't find");
  });
});
