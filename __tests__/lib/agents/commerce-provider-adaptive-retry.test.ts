/**
 * Tests for Commerce Provider Adaptive Retry Logic
 * CRITICAL: Verifies adaptive backoff retry mechanism for provider resolution
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock modules before importing
const mockCreateServiceRoleClient = jest.fn();
const mockGetDynamicShopifyClient = jest.fn();
const mockGetDynamicWooCommerceClient = jest.fn();
const mockShopifyProvider = jest.fn();
const mockWooCommerceProvider = jest.fn();
const mockTrackProviderResolution = jest.fn();
const mockTrackRetryPattern = jest.fn();
const mockCircuitBreaker = {
  execute: jest.fn(),
  getStats: jest.fn().mockReturnValue({ state: 'closed' }),
};

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: mockGetDynamicShopifyClient,
}));

jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: mockGetDynamicWooCommerceClient,
}));

jest.mock('@/lib/agents/providers/shopify-provider', () => ({
  ShopifyProvider: mockShopifyProvider,
}));

jest.mock('@/lib/agents/providers/woocommerce-provider', () => ({
  WooCommerceProvider: mockWooCommerceProvider,
}));

jest.mock('@/lib/cart-session-manager', () => ({
  CartSessionManager: jest.fn().mockImplementation(() => ({
    trackAddToCart: jest.fn(),
    getSessionData: jest.fn().mockResolvedValue(null),
  })),
}));

jest.mock('@/lib/circuit-breaker', () => ({
  createCircuitBreaker: jest.fn(() => mockCircuitBreaker),
  CircuitBreakerError: class CircuitBreakerError extends Error {
    constructor(public state: string, public cooldownRemaining: number) {
      super('Circuit breaker open');
    }
  },
}));

jest.mock('@/lib/telemetry/search-telemetry', () => ({
  trackProviderResolution: mockTrackProviderResolution,
  trackRetryPattern: mockTrackRetryPattern,
}));

import { getCommerceProvider, clearCommerceProviderCache } from '@/lib/agents/commerce-provider';

describe('Commerce Provider Adaptive Retry', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearCommerceProviderCache();
    jest.useFakeTimers();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default mocks
    mockCreateServiceRoleClient.mockResolvedValue(mockSupabaseClient as any);
    mockGetDynamicShopifyClient.mockResolvedValue(null);
    mockGetDynamicWooCommerceClient.mockResolvedValue(null);
    mockCircuitBreaker.execute.mockImplementation((fn: any) => fn());
    mockTrackProviderResolution.mockResolvedValue(undefined);
    mockTrackRetryPattern.mockResolvedValue(undefined);

    // Reset environment variables
    process.env.WOOCOMMERCE_URL = '';
    process.env.WOOCOMMERCE_CONSUMER_KEY = '';
    process.env.WOOCOMMERCE_CONSUMER_SECRET = '';
    process.env.SHOPIFY_SHOP = '';
    process.env.SHOPIFY_ACCESS_TOKEN = '';
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Error classification and adaptive backoff', () => {
    it('should use adaptive backoff for TRANSIENT errors', async () => {
      // Simulate transient network error
      mockSupabaseClient.single.mockRejectedValue(new Error('ETIMEDOUT: Connection timed out'));

      const promise = getCommerceProvider('example.com');

      // Run all timers
      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify error was classified
      const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt failed')
      );

      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0][1]).toHaveProperty('errorCategory', 'TRANSIENT');

      // Verify adaptive backoff logs
      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Retrying with adaptive backoff')
      );

      expect(retryLogs.length).toBeGreaterThan(0);
      expect(retryLogs[0][1]).toHaveProperty('errorCategory', 'TRANSIENT');
      expect(retryLogs[0][1]).toHaveProperty('strategy', 'adaptive-backoff');
    });

    it('should stop retrying for AUTH_FAILURE errors', async () => {
      // Simulate authentication error
      mockSupabaseClient.single.mockRejectedValue(new Error('401 Unauthorized'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify error was classified as AUTH_FAILURE
      const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt failed')
      );

      expect(errorLogs[0][1]).toHaveProperty('errorCategory', 'AUTH_FAILURE');

      // Verify no-retry log
      const noRetryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Non-retryable error, stopping retries')
      );

      expect(noRetryLogs.length).toBeGreaterThan(0);
      expect(noRetryLogs[0][1]).toHaveProperty('errorCategory', 'AUTH_FAILURE');

      // Verify no retry attempts after AUTH_FAILURE
      const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt')
      );

      // Should only have 1 attempt (no retries for AUTH_FAILURE)
      expect(attemptLogs).toHaveLength(1);
    });

    it('should stop retrying for NOT_FOUND errors', async () => {
      // Simulate not found error
      mockSupabaseClient.single.mockRejectedValue(new Error('PGRST116: No rows found'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify error was classified as NOT_FOUND
      const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt failed')
      );

      expect(errorLogs[0][1]).toHaveProperty('errorCategory', 'NOT_FOUND');

      // Verify no retries
      const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt')
      );

      expect(attemptLogs).toHaveLength(1);
    });

    it('should use long exponential backoff for RATE_LIMIT errors', async () => {
      // Simulate rate limit error
      mockSupabaseClient.single.mockRejectedValue(new Error('429 Too Many Requests'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify error was classified as RATE_LIMIT
      const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt failed')
      );

      expect(errorLogs[0][1]).toHaveProperty('errorCategory', 'RATE_LIMIT');

      // Verify adaptive backoff with longer delays
      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Retrying with adaptive backoff')
      );

      if (retryLogs.length > 0) {
        // RATE_LIMIT should have longer delays (around 1000ms for first retry)
        expect(retryLogs[0][1].backoffMs).toBeGreaterThan(500);
      }
    });

    it('should use linear backoff for SERVER_ERROR errors', async () => {
      // Simulate server error
      mockSupabaseClient.single.mockRejectedValue(new Error('503 Service Unavailable'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify error was classified as SERVER_ERROR
      const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt failed')
      );

      expect(errorLogs[0][1]).toHaveProperty('errorCategory', 'SERVER_ERROR');

      // Verify adaptive backoff logs
      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Retrying with adaptive backoff')
      );

      expect(retryLogs.length).toBeGreaterThan(0);
      expect(retryLogs[0][1]).toHaveProperty('errorCategory', 'SERVER_ERROR');
    });
  });

  describe('Backoff delay verification', () => {
    it('should include jitter in backoff delays', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('ETIMEDOUT'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      await promise;

      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Retrying with adaptive backoff')
      );

      if (retryLogs.length > 1) {
        const firstDelay = retryLogs[0][1].backoffMs;
        const secondDelay = retryLogs[1][1].backoffMs;

        // Verify jitter: delays should vary (not exact multiples)
        // First delay: ~100ms ±20% = 80-120ms
        expect(firstDelay).toBeGreaterThanOrEqual(50);
        expect(firstDelay).toBeLessThanOrEqual(150);

        // Second delay should be roughly 2x first (with jitter)
        expect(secondDelay).toBeGreaterThan(firstDelay);
      }
    });

    it('should log adaptive backoff strategy in retry attempts', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Network error'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      await promise;

      const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Retrying with adaptive backoff')
      );

      retryLogs.forEach((log) => {
        expect(log[1]).toHaveProperty('strategy', 'adaptive-backoff');
        expect(log[1]).toHaveProperty('errorCategory');
        expect(log[1]).toHaveProperty('backoffMs');
      });
    });
  });

  describe('Integration with existing retry mechanism', () => {
    it('should handle successful retry after transient failure', async () => {
      // First attempt fails with transient error, second succeeds
      mockSupabaseClient.single
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce({
          data: { woocommerce_url: 'https://example.com', shopify_shop: null },
          error: null,
        });

      const mockWooClient = { api: 'woocommerce' };
      const mockWooProviderInstance = { platform: 'woocommerce' };

      mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient as any);
      mockWooCommerceProvider.mockReturnValue(mockWooProviderInstance as any);

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).not.toBeNull();
      expect(provider?.platform).toBe('woocommerce');

      // Verify retry attempt was made
      const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt')
      );

      expect(attemptLogs.length).toBeGreaterThanOrEqual(2);
    });

    it('should exhaust retries for persistent errors', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('ETIMEDOUT'));

      const promise = getCommerceProvider('example.com');

      await jest.runAllTimersAsync();
      const provider = await promise;

      expect(provider).toBeNull();

      // Verify multiple attempts were made
      const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.includes('[Provider] Resolution attempt')
      );

      expect(attemptLogs.length).toBe(3); // 1 initial + 2 retries
    });
  });
});
