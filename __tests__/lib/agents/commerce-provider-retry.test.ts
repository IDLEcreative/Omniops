/**
 * Tests for Commerce Provider Retry Logic
 * CRITICAL: Tests exponential backoff retry mechanism for provider resolution
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock modules before importing
const mockCreateServiceRoleClient = jest.fn();
const mockGetDynamicShopifyClient = jest.fn();
const mockGetDynamicWooCommerceClient = jest.fn();
const mockShopifyProvider = jest.fn();
const mockWooCommerceProvider = jest.fn();

// Mock cart session manager to avoid Redis warnings
jest.mock('@/lib/cart-session-manager', () => ({
  CartSessionManager: jest.fn().mockImplementation(() => ({
    trackAddToCart: jest.fn(),
    getSessionData: jest.fn().mockResolvedValue(null),
  })),
}));

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

import { getCommerceProvider, clearCommerceProviderCache } from '@/lib/agents/commerce-provider';

describe('resolveProviderWithRetry', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    clearCommerceProviderCache();

    // Use fake timers for precise timing control
    jest.useFakeTimers();

    // Spy on console methods (keep real implementations for debugging)
    consoleLogSpy = jest.spyOn(console, 'log');
    consoleErrorSpy = jest.spyOn(console, 'error');

    // Setup default mocks
    mockCreateServiceRoleClient.mockResolvedValue(mockSupabaseClient as any);
    mockGetDynamicShopifyClient.mockResolvedValue(null);
    mockGetDynamicWooCommerceClient.mockResolvedValue(null);

    // Reset environment variables for each test
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

  it('should succeed on first attempt without retries', async () => {
    // Mock successful WooCommerce configuration
    mockSupabaseClient.single.mockResolvedValue({
      data: { woocommerce_url: 'https://example.com', shopify_shop: null },
      error: null,
    });

    const mockWooClient = { api: 'woocommerce' };
    const mockWooProviderInstance = { platform: 'woocommerce' };

    mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient as any);
    mockWooCommerceProvider.mockReturnValue(mockWooProviderInstance as any);

    const promise = getCommerceProvider('example.com');

    // No timers should be needed - should resolve immediately
    await jest.runAllTimersAsync();
    const provider = await promise;

    // Debug: Check what was actually called
    console.log('mockGetDynamicWooCommerceClient called:', mockGetDynamicWooCommerceClient.mock.calls.length);
    console.log('mockWooCommerceProvider called:', mockWooCommerceProvider.mock.calls.length);
    console.log('Provider result:', provider);

    expect(provider).toBe(mockWooProviderInstance);
    expect(mockGetDynamicWooCommerceClient).toHaveBeenCalled();

    // Verify only 1 attempt was logged
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs).toHaveLength(1);
    expect(attemptLogs[0][1]).toMatchObject({
      domain: 'example.com',
      attempt: 1,
      maxAttempts: 3,
    });

    // Verify completion log shows totalAttempts: 1
    const completionLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution completed')
    );
    expect(completionLogs).toHaveLength(1);
    expect(completionLogs[0][1]).toMatchObject({
      domain: 'example.com',
      hasProvider: true,
      platform: 'woocommerce',
      totalAttempts: 1,
    });

    // Verify no retry logs
    const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt')
    );
    expect(retryLogs).toHaveLength(0);
  });

  it('should retry on transient failure and succeed on second attempt', async () => {
    // First attempt: config load fails
    // Second attempt: succeeds
    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      .mockResolvedValueOnce({
        data: { woocommerce_url: 'https://example.com', shopify_shop: null },
        error: null,
      });

    const mockWooClient = { api: 'woocommerce' };
    const mockWooProviderInstance = { platform: 'woocommerce' };

    mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient as any);
    mockWooCommerceProvider.mockReturnValue(mockWooProviderInstance as any);

    const promise = getCommerceProvider('example.com');

    // Advance through first attempt
    await jest.advanceTimersByTimeAsync(0);

    // Should see retry log with 100ms backoff
    const firstRetryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt 2/3')
    );
    expect(firstRetryLogs).toHaveLength(1);
    expect(firstRetryLogs[0][1]).toMatchObject({
      domain: 'example.com',
      backoffMs: 100,
    });

    // Advance through 100ms backoff
    await jest.advanceTimersByTimeAsync(100);

    // Complete the promise
    await jest.runAllTimersAsync();
    const provider = await promise;

    expect(provider).toBe(mockWooProviderInstance);

    // Verify 2 attempts were made
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs).toHaveLength(2);
    expect(attemptLogs[0][1]).toMatchObject({ attempt: 1 });
    expect(attemptLogs[1][1]).toMatchObject({ attempt: 2 });

    // Verify completion shows totalAttempts: 2
    const completionLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution completed')
    );
    expect(completionLogs[completionLogs.length - 1][1]).toMatchObject({
      totalAttempts: 2,
      hasProvider: true,
    });
  });

  it('should retry with exponential backoff delays (100ms, 200ms)', async () => {
    // All attempts fail
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const promise = getCommerceProvider('example.com');

    // First attempt
    await jest.advanceTimersByTimeAsync(0);

    // Should see first retry with 100ms backoff
    let retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt 2/3')
    );
    expect(retryLogs).toHaveLength(1);
    expect(retryLogs[0][1]).toMatchObject({ backoffMs: 100 });

    // Advance through 100ms
    await jest.advanceTimersByTimeAsync(100);

    // Second attempt completes
    await jest.advanceTimersByTimeAsync(0);

    // Should see second retry with 200ms backoff
    retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt 3/3')
    );
    expect(retryLogs).toHaveLength(1);
    expect(retryLogs[0][1]).toMatchObject({ backoffMs: 200 });

    // Advance through 200ms
    await jest.advanceTimersByTimeAsync(200);

    // Complete all remaining timers
    await jest.runAllTimersAsync();
    const provider = await promise;

    expect(provider).toBeNull();

    // Verify exponential backoff pattern in logs
    const allRetryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt')
    );
    expect(allRetryLogs).toHaveLength(2);
    expect(allRetryLogs[0][1].backoffMs).toBe(100); // First retry
    expect(allRetryLogs[1][1].backoffMs).toBe(200); // Second retry
  });

  it('should exhaust all retries and return null on persistent failure', async () => {
    // All attempts fail
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const promise = getCommerceProvider('example.com');

    // Run through all timers
    await jest.runAllTimersAsync();
    const provider = await promise;

    expect(provider).toBeNull();

    // Verify 3 attempts were made (1 initial + 2 retries)
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs).toHaveLength(3);
    expect(attemptLogs[0][1]).toMatchObject({ attempt: 1, maxAttempts: 3 });
    expect(attemptLogs[1][1]).toMatchObject({ attempt: 2, maxAttempts: 3 });
    expect(attemptLogs[2][1]).toMatchObject({ attempt: 3, maxAttempts: 3 });

    // Verify final completion log shows all attempts exhausted
    const completionLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution completed')
    );
    expect(completionLogs[completionLogs.length - 1][1]).toMatchObject({
      domain: 'example.com',
      hasProvider: false,
      platform: null,
      totalAttempts: 3,
    });

    // Verify 2 retry logs (between 3 attempts)
    const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt')
    );
    expect(retryLogs).toHaveLength(2);
  });

  it('should log all retry attempts with proper metadata', async () => {
    // First two attempts fail, third succeeds
    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })
      .mockResolvedValueOnce({
        data: { woocommerce_url: 'https://example.com', shopify_shop: null },
        error: null,
      });

    const mockWooClient = { api: 'woocommerce' };
    const mockWooProviderInstance = { platform: 'woocommerce' };

    mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooClient as any);
    mockWooCommerceProvider.mockReturnValue(mockWooProviderInstance as any);

    const promise = getCommerceProvider('example.com');

    // Run through all timers
    await jest.runAllTimersAsync();
    await promise;

    // Verify attempt logs have correct metadata
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs).toHaveLength(3);

    attemptLogs.forEach((log, index) => {
      expect(log[1]).toMatchObject({
        domain: 'example.com',
        attempt: index + 1,
        maxAttempts: 3,
      });
      expect(log[1].timestamp).toBeDefined();
      expect(typeof log[1].timestamp).toBe('number');
    });

    // Verify retry logs have correct metadata
    const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt')
    );
    expect(retryLogs).toHaveLength(2);

    expect(retryLogs[0][1]).toMatchObject({
      domain: 'example.com',
      backoffMs: 100,
    });
    expect(retryLogs[0][1].timestamp).toBeDefined();

    expect(retryLogs[1][1]).toMatchObject({
      domain: 'example.com',
      backoffMs: 200,
    });
    expect(retryLogs[1][1].timestamp).toBeDefined();

    // Verify detector attempt logs
    const detectorLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Trying detector')
    );
    expect(detectorLogs.length).toBeGreaterThan(0);

    // Each detector log should have domain and attempt number
    detectorLogs.forEach((log) => {
      expect(log[1]).toHaveProperty('domain', 'example.com');
      expect(log[1]).toHaveProperty('attempt');
    });
  });

  it('should not retry if first attempt succeeds', async () => {
    // Mock successful Shopify configuration
    mockSupabaseClient.single.mockResolvedValue({
      data: { woocommerce_url: null, shopify_shop: 'example.myshopify.com' },
      error: null,
    });

    const mockShopifyClient = { api: 'shopify' };
    const mockShopifyProviderInstance = { platform: 'shopify' };

    mockGetDynamicShopifyClient.mockResolvedValue(mockShopifyClient as any);
    mockShopifyProvider.mockReturnValue(mockShopifyProviderInstance as any);

    const startTime = Date.now();
    const promise = getCommerceProvider('example.com');

    // Advance timers
    await jest.runAllTimersAsync();
    const provider = await promise;

    expect(provider).toBe(mockShopifyProviderInstance);

    // Verify no setTimeout was called (no retries)
    const retryLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Retry attempt')
    );
    expect(retryLogs).toHaveLength(0);

    // Verify only 1 attempt
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs).toHaveLength(1);
  });

  it('should handle detector errors with retry logging', async () => {
    // Mock WooCommerce enabled
    mockSupabaseClient.single.mockResolvedValue({
      data: { woocommerce_url: 'https://example.com', shopify_shop: null },
      error: null,
    });

    // First attempt: detector throws error
    // Second attempt: detector succeeds
    const mockWooClient = { api: 'woocommerce' };
    const mockWooProviderInstance = { platform: 'woocommerce' };

    mockGetDynamicWooCommerceClient
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce(mockWooClient as any);

    mockWooCommerceProvider.mockReturnValue(mockWooProviderInstance as any);

    const promise = getCommerceProvider('example.com');

    // Run through all timers
    await jest.runAllTimersAsync();
    const provider = await promise;

    expect(provider).toBe(mockWooProviderInstance);

    // Verify error was logged with willRetry: true
    const errorLogs = consoleErrorSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Detector failed')
    );
    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0][1]).toMatchObject({
      domain: 'example.com',
      error: 'Network timeout',
      attempt: 1,
      willRetry: true,
    });

    // Verify retry happened
    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Provider] Resolution attempt')
    );
    expect(attemptLogs.length).toBeGreaterThanOrEqual(2);
  });

  it('should verify timing of backoff delays within tolerance', async () => {
    // All attempts fail to test all backoff delays
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    const timingRecords: number[] = [];
    const originalSetTimeout = global.setTimeout;

    // Track setTimeout calls to verify delays
    (global.setTimeout as any) = jest.fn((callback: any, delay: number) => {
      timingRecords.push(delay);
      return originalSetTimeout(callback, delay);
    });

    const promise = getCommerceProvider('example.com');

    // Run through all timers
    await jest.runAllTimersAsync();
    await promise;

    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;

    // Verify delay timings (100ms, 200ms)
    expect(timingRecords).toContain(100);
    expect(timingRecords).toContain(200);

    // Verify delays are in exponential backoff pattern
    const backoffDelays = timingRecords.filter((delay) => delay >= 100 && delay <= 200);
    expect(backoffDelays.length).toBeGreaterThanOrEqual(2);

    // First delay should be ~100ms (within 10ms tolerance)
    const firstDelay = backoffDelays[0];
    expect(firstDelay).toBeGreaterThanOrEqual(90);
    expect(firstDelay).toBeLessThanOrEqual(110);

    // Second delay should be ~200ms (within 10ms tolerance)
    const secondDelay = backoffDelays[1];
    expect(secondDelay).toBeGreaterThanOrEqual(190);
    expect(secondDelay).toBeLessThanOrEqual(210);
  });
});
