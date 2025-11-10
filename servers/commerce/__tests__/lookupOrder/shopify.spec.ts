import { lookupOrder } from '../../lookupOrder';
import { mockShopifyOrder } from './helpers/orders';
import {
  baseContext,
  mockGetCommerceProvider,
  mockNormalizeDomain,
  resetMocks,
  buildProvider,
} from './helpers/mocks';

describe('lookupOrder – Shopify integration', () => {
  beforeEach(() => {
    resetMocks();
    mockNormalizeDomain.mockReturnValue('shop.example.com');
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'shopify',
        lookupOrder: jest.fn().mockResolvedValue(mockShopifyOrder),
      })
    );
  });

  it('retrieves Shopify order by number', async () => {
    const result = await lookupOrder({ orderId: 'SP-67890' }, { ...baseContext, domain: 'shop.example.com' });

    expect(result.success).toBe(true);
    expect(result.data?.order).toEqual(mockShopifyOrder);
    expect(result.data?.source).toBe('shopify');
    expect(result.data?.formattedResult?.title).toBe('Order #SP-67890');
  });

  it('validates customer email when provided', async () => {
    const result = await lookupOrder(
      { orderId: 'SP-67890', email: 'jane.smith@example.com' },
      { ...baseContext, domain: 'shop.example.com' }
    );

    expect(result.success).toBe(true);
    expect(result.data?.order?.billing?.email).toBe('jane.smith@example.com');
  });

  it('reports shopify not-found scenarios', async () => {
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'shopify',
        lookupOrder: jest.fn().mockResolvedValue(null),
      })
    );

    const result = await lookupOrder({ orderId: 'SP-99999' }, { ...baseContext, domain: 'shop.example.com' });

    expect(result.success).toBe(true);
    expect(result.data?.success).toBe(false);
    expect(result.data?.order).toBeNull();
    expect(result.data?.source).toBe('not-found');
  });

  it('handles Shopify provider errors', async () => {
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'shopify',
        lookupOrder: jest.fn().mockRejectedValue(new Error('Shopify rate limit exceeded')),
      })
    );

    const result = await lookupOrder({ orderId: 'SP-67890' }, { ...baseContext, domain: 'shop.example.com' });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Shopify rate limit exceeded');
  });
});
