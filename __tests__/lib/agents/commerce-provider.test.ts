import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { getCommerceProvider, clearCommerceProviderCache } from '@/lib/agents/commerce-provider';

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock('@/lib/agents/providers/shopify-provider', () => ({
  ShopifyProvider: jest.fn().mockImplementation((domain: string) => ({
    platform: 'shopify',
    domain,
  })),
}));

jest.mock('@/lib/agents/providers/woocommerce-provider', () => ({
  WooCommerceProvider: jest.fn().mockImplementation((domain: string) => ({
    platform: 'woocommerce',
    domain,
  })),
}));

const createServiceRoleClient = jest.requireMock('@/lib/supabase-server')
  .createServiceRoleClient as jest.Mock;

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

  it('returns Shopify provider when Shopify config is present', async () => {
    process.env.SHOPIFY_SHOP = 'brand.myshopify.com';
    process.env.SHOPIFY_ACCESS_TOKEN = 'token';

    createServiceRoleClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  shopify_enabled: true,
                  shopify_shop: 'brand.myshopify.com',
                  woocommerce_enabled: false,
                  woocommerce_url: null,
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const provider = await getCommerceProvider('https://brand.com');

    expect(provider?.platform).toBe('shopify');
    const { ShopifyProvider } = jest.requireMock('@/lib/agents/providers/shopify-provider');
    expect(ShopifyProvider).toHaveBeenCalledWith('brand.com');
    const { WooCommerceProvider } = jest.requireMock('@/lib/agents/providers/woocommerce-provider');
    expect(WooCommerceProvider).not.toHaveBeenCalled();
  });

  it('returns WooCommerce provider when WooCommerce config is present', async () => {
    process.env.WOOCOMMERCE_URL = 'https://shop.example';
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'key';
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'secret';

    createServiceRoleClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  woocommerce_enabled: true,
                  woocommerce_url: 'https://shop.example',
                  shopify_enabled: false,
                  shopify_shop: null,
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const provider = await getCommerceProvider('store.example');

    expect(provider?.platform).toBe('woocommerce');
    const { WooCommerceProvider } = jest.requireMock('@/lib/agents/providers/woocommerce-provider');
    expect(WooCommerceProvider).toHaveBeenCalledWith('store.example');
  });

  it('returns null when no provider configuration is found', async () => {
    createServiceRoleClient.mockResolvedValue({
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
    });

    const provider = await getCommerceProvider('unknown.example');

    expect(provider).toBeNull();
    const { WooCommerceProvider } = jest.requireMock('@/lib/agents/providers/woocommerce-provider');
    const { ShopifyProvider } = jest.requireMock('@/lib/agents/providers/shopify-provider');
    expect(WooCommerceProvider).not.toHaveBeenCalled();
    expect(ShopifyProvider).not.toHaveBeenCalled();
  });
});
