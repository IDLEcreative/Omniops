import { lookupOrder } from '../../lookupOrder';
import { baseContext, mockGetCommerceProvider, mockNormalizeDomain, resetMocks, buildProvider } from './helpers/mocks';
import { mockWooCommerceOrder } from './helpers/orders';

describe('lookupOrder – Context Validation', () => {
  beforeEach(() => {
    resetMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
      })
    );
  });

  it('rejects missing domain', async () => {
    const result = await lookupOrder({ orderId: '12345' }, { ...baseContext, domain: '' });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Missing required context: domain');
  });

  it('rejects invalid localhost domain', async () => {
    mockNormalizeDomain.mockReturnValue('');
    const result = await lookupOrder({ orderId: '12345' }, { ...baseContext, domain: 'localhost' });

    expect(result.success).toBe(false);
    expect(result.data?.source).toBe('invalid-domain');
    expect(result.error?.code).toBe('INVALID_DOMAIN');
  });

  it('handles missing customerId gracefully', async () => {
    const result = await lookupOrder({ orderId: '12345' }, { ...baseContext, customerId: '' });
    expect(result.success).toBe(true);
    expect(result.data?.order).toEqual(mockWooCommerceOrder);
  });
});
