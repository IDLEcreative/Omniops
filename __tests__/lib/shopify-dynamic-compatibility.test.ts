/**
 * Shopify Dynamic - Backward Compatibility & Multi-Domain Tests
 * Tests for backward compatibility and multi-domain support
 */

import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';
import { createMockShopifyFactory } from '@/test-utils/create-shopify-factory';

describe('Shopify Dynamic - Backward Compatibility', () => {
  it('works without factory parameter (uses default)', async () => {
    const client = await getDynamicShopifyClient('nonexistent-domain.com');

    expect(client).toBeNull();
  });

  it('maintains same function signature for existing callers', () => {
    const domain = 'test.com';
    const factory = createMockShopifyFactory({ hasConfig: true });

    const promise1 = getDynamicShopifyClient(domain);
    expect(promise1).toBeInstanceOf(Promise);

    const promise2 = getDynamicShopifyClient(domain, factory);
    expect(promise2).toBeInstanceOf(Promise);
  });

  it('returns same client type regardless of credential format', async () => {
    const factoryNewFormat = createMockShopifyFactory({ hasConfig: true });
    const clientNew = await getDynamicShopifyClient('test.com', factoryNewFormat);

    const factoryLegacyFormat = createMockShopifyFactory({ hasConfig: true });
    const clientLegacy = await getDynamicShopifyClient('legacy.com', factoryLegacyFormat);

    expect(clientNew).not.toBeNull();
    expect(clientLegacy).not.toBeNull();
    expect(typeof clientNew?.getProducts).toBe('function');
    expect(typeof clientLegacy?.getProducts).toBe('function');
  });
});

describe('Shopify Dynamic - Multiple Domains', () => {
  it('fetches correct config for different domains', async () => {
    const factory1 = createMockShopifyFactory({ hasConfig: true, domain: 'domain1.com' });
    const factory2 = createMockShopifyFactory({ hasConfig: true, domain: 'domain2.com' });

    const spy1 = jest.spyOn(factory1, 'getConfigForDomain');
    const spy2 = jest.spyOn(factory2, 'getConfigForDomain');

    await getDynamicShopifyClient('domain1.com', factory1);
    await getDynamicShopifyClient('domain2.com', factory2);

    expect(spy1).toHaveBeenCalledWith('domain1.com');
    expect(spy2).toHaveBeenCalledWith('domain2.com');
  });

  it('creates separate clients for different domains', async () => {
    const factory1 = createMockShopifyFactory({ hasConfig: true, domain: 'shop1.com' });
    const factory2 = createMockShopifyFactory({ hasConfig: true, domain: 'shop2.com' });

    const client1 = await getDynamicShopifyClient('shop1.com', factory1);
    const client2 = await getDynamicShopifyClient('shop2.com', factory2);

    expect(client1).not.toBeNull();
    expect(client2).not.toBeNull();
    expect(client1).not.toBe(client2);
  });
});

describe('Shopify Dynamic - Credential Formats', () => {
  it('handles new encrypted_credentials format', async () => {
    const factory = createMockShopifyFactory({ hasConfig: true });
    const mockClient = factory.getMockClient();

    const client = await getDynamicShopifyClient('test.com', factory);

    expect(client).not.toBeNull();
    expect(client).toBe(mockClient);
  });

  it('handles legacy shopify_access_token format', async () => {
    const factory = createMockShopifyFactory({ hasConfig: true });
    const mockConfig = {
      id: 'test-config-id',
      domain: 'test.com',
      customer_id: 'test-customer-id',
      business_name: 'Test',
      business_description: 'Test',
      welcome_message: 'Welcome',
      primary_color: '#000000',
      suggested_questions: null,
      shopify_shop: 'legacy-shop.myshopify.com',
      shopify_access_token: 'encrypted_legacy_token',
      encrypted_credentials: null,
      active: true,
      rate_limit: 100,
      allowed_origins: ['*'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    factory.setConfig(mockConfig as any);
    const client = await getDynamicShopifyClient('test.com', factory);

    expect(client).not.toBeNull();
  });
});
