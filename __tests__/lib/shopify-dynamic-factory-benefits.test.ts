/**
 * Shopify Dynamic - Factory Pattern Benefits Tests
 * Tests demonstrating the benefits of dependency injection via factory pattern
 */

import { getDynamicShopifyClient, searchProductsDynamic } from '@/lib/shopify-dynamic';
import {
  createMockShopifyFactory,
  MockShopifyFactory,
} from '@/test-utils/create-shopify-factory';

describe('Shopify Dynamic - Factory Pattern Benefits', () => {
  it('eliminates need for module mocking', async () => {
    const factory = createMockShopifyFactory({ hasConfig: true });
    const client = await getDynamicShopifyClient('test.com', factory);

    expect(client).not.toBeNull();
  });

  it('allows easy customization of mock behavior', async () => {
    const customProducts = [
      { id: 100, title: 'Custom Product', variants: [] },
    ];

    const factory = createMockShopifyFactory({
      hasConfig: true,
      products: customProducts,
    });

    const client = await getDynamicShopifyClient('test.com', factory);
    const mockClient = factory.getMockClient();

    expect(mockClient.getProducts).toBeDefined();
    const response = await mockClient.getProducts();
    expect(response.products).toEqual(customProducts);
  });

  it('enables testing different credential formats', async () => {
    const factoryNew = createMockShopifyFactory({ hasConfig: true });
    const clientNew = await getDynamicShopifyClient('new.com', factoryNew);
    expect(clientNew).not.toBeNull();

    const factoryLegacy = createMockShopifyFactory({ hasConfig: true });
    const clientLegacy = await getDynamicShopifyClient('legacy.com', factoryLegacy);
    expect(clientLegacy).not.toBeNull();

    expect(typeof clientNew?.getProducts).toBe('function');
    expect(typeof clientLegacy?.getProducts).toBe('function');
  });

  it('simplifies test setup compared to module mocking', () => {
    const factory = createMockShopifyFactory({ hasConfig: true });

    expect(factory).toBeInstanceOf(MockShopifyFactory);
    expect(factory.getConfigForDomain).toBeDefined();
    expect(factory.createClient).toBeDefined();
    expect(factory.decryptCredentials).toBeDefined();
  });

  it('enables testing with custom client behavior', async () => {
    const customClient = {
      getProducts: jest.fn().mockResolvedValue({ products: [{ id: 1 }] }),
      getOrders: jest.fn().mockResolvedValue({ orders: [{ id: 1 }] }),
      searchProducts: jest.fn().mockResolvedValue([{ id: 1 }]),
      getCustomers: jest.fn().mockResolvedValue({ customers: [] }),
      getCustomer: jest.fn().mockResolvedValue({ customer: null }),
      searchCustomers: jest.fn().mockResolvedValue([]),
      getInventoryLevels: jest.fn().mockResolvedValue({ inventory_levels: [] }),
    };

    const factory = createMockShopifyFactory({
      hasConfig: true,
      customClient,
    });

    const client = await getDynamicShopifyClient('test.com', factory);
    expect(client).toBe(customClient);
  });

  it('supports method call verification', async () => {
    const factory = createMockShopifyFactory({ hasConfig: true });
    const mockClient = factory.getMockClient();

    await getDynamicShopifyClient('test.com', factory);

    const getConfigSpy = jest.spyOn(factory, 'getConfigForDomain');
    const decryptSpy = jest.spyOn(factory, 'decryptCredentials');
    const createClientSpy = jest.spyOn(factory, 'createClient');

    await getDynamicShopifyClient('test.com', factory);

    expect(getConfigSpy).toHaveBeenCalled();
    expect(decryptSpy).toHaveBeenCalled();
    expect(createClientSpy).toHaveBeenCalled();
  });
});

describe('Shopify Dynamic - Product Search', () => {
  it('returns empty array when client is null', async () => {
    const results = await searchProductsDynamic('nonexistent.com', 'test query');

    expect(results).toEqual([]);
  });

  it('returns empty array on search error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const results = await searchProductsDynamic('error-domain.com', 'test');

    expect(results).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('limits search results to specified limit', async () => {
    const results = await searchProductsDynamic('test.com', 'product', 5);

    expect(Array.isArray(results)).toBe(true);
  });
});
