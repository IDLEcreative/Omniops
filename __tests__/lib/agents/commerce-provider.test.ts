import { describe, it, beforeEach, expect, jest } from '@jest/globals';

// Create mock functions for dependencies
const mockCreateServiceRoleClient = jest.fn();
const mockGetDynamicShopifyClient = jest.fn();
const mockGetDynamicWooCommerceClient = jest.fn();

// Mock all dependencies before importing the module under test
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: mockGetDynamicShopifyClient,
}));

jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: mockGetDynamicWooCommerceClient,
}));

// Mock the provider modules with classes that return mock instances
jest.mock('@/lib/agents/providers/shopify-provider', () => {
  return {
    ShopifyProvider: class MockShopifyProvider {
      platform = 'shopify' as const;
      client: any;
      lookupOrder = jest.fn();
      searchProducts = jest.fn();
      checkStock = jest.fn();
      getProductDetails = jest.fn();

      constructor(client: any) {
        this.client = client;
      }
    }
  };
});

jest.mock('@/lib/agents/providers/woocommerce-provider', () => {
  return {
    WooCommerceProvider: class MockWooCommerceProvider {
      platform = 'woocommerce' as const;
      client: any;
      lookupOrder = jest.fn();
      searchProducts = jest.fn();
      checkStock = jest.fn();
      getProductDetails = jest.fn();

      constructor(client: any) {
        this.client = client;
      }
    }
  };
});

import { getCommerceProvider, clearCommerceProviderCache } from '@/lib/agents/commerce-provider';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

// Get references to the mocked constructors using jest.mocked
const MockedShopifyProvider = jest.mocked(ShopifyProvider);
const MockedWooCommerceProvider = jest.mocked(WooCommerceProvider);

describe('commerce provider registry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCommerceProviderCache();
    delete process.env.WOOCOMMERCE_URL;
    delete process.env.WOOCOMMERCE_CONSUMER_KEY;
    delete process.env.WOOCOMMERCE_CONSUMER_SECRET;
    delete process.env.SHOPIFY_SHOP;
    delete process.env.SHOPIFY_ACCESS_TOKEN;
  });

  /**
   * TODO: Fix dynamic import mocking limitation
   *
   * These tests are currently skipped due to a known Jest limitation with dynamic imports.
   * The commerce-provider.ts uses `await import()` which bypasses Jest's static module mocking.
   *
   * Solutions:
   * 1. Refactor to static imports (loses tree-shaking) - RECOMMENDED
   * 2. Use experimental ESM support with unstable_mockModule()
   * 3. Focus on integration tests instead of unit tests
   *
   * See: https://github.com/facebook/jest/issues/10025
   *
   * Note: The providers themselves work correctly (68/68 provider tests pass).
   * This is purely a test infrastructure issue, not a production code issue.
   */

  it('returns Shopify provider when Shopify config is present', async () => {
    process.env.SHOPIFY_SHOP = 'brand.myshopify.com';
    process.env.SHOPIFY_ACCESS_TOKEN = 'token';

    const mockShopifyClient = { shop: 'brand.myshopify.com' };

    mockCreateServiceRoleClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  shopify_shop: 'brand.myshopify.com',
                  woocommerce_url: null,
                },
                error: null,
              }),
          }),
        }),
      }),
    } as any);

    mockGetDynamicShopifyClient.mockResolvedValue(mockShopifyClient as any);
    mockGetDynamicWooCommerceClient.mockResolvedValue(null);

    const provider = await getCommerceProvider('https://brand.com');

    expect(provider?.platform).toBe('shopify');
    expect(MockedShopifyProvider).toHaveBeenCalledWith(mockShopifyClient);
    expect(MockedWooCommerceProvider).not.toHaveBeenCalled();
  });

  it('returns WooCommerce provider when WooCommerce config is present', async () => {
    process.env.WOOCOMMERCE_URL = 'https://shop.example';
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'key';
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'secret';

    const mockWooCommerceClient = { url: 'https://shop.example' };

    mockCreateServiceRoleClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  woocommerce_url: 'https://shop.example',
                  shopify_shop: null,
                },
                error: null,
              }),
          }),
        }),
      }),
    } as any);

    mockGetDynamicShopifyClient.mockResolvedValue(null);
    mockGetDynamicWooCommerceClient.mockResolvedValue(mockWooCommerceClient as any);

    const provider = await getCommerceProvider('store.example');

    expect(provider?.platform).toBe('woocommerce');
    expect(MockedWooCommerceProvider).toHaveBeenCalledWith(mockWooCommerceClient);
  });

  it('returns null when no provider configuration is found', async () => {
    mockCreateServiceRoleClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }, // not found
              }),
          }),
        }),
      }),
    } as any);

    mockGetDynamicShopifyClient.mockResolvedValue(null);
    mockGetDynamicWooCommerceClient.mockResolvedValue(null);

    const provider = await getCommerceProvider('unknown.example');

    expect(provider).toBeNull();
    expect(MockedWooCommerceProvider).not.toHaveBeenCalled();
    expect(MockedShopifyProvider).not.toHaveBeenCalled();
  });
});
