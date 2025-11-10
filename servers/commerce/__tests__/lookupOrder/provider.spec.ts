import { lookupOrder } from '../../lookupOrder';
import { baseContext, mockGetCommerceProvider, mockNormalizeDomain, resetMocks, buildProvider } from './helpers/mocks';
import { mockWooCommerceOrder } from './helpers/orders';

describe('lookupOrder – Provider Resolution', () => {
  beforeEach(() => {
    resetMocks();
    mockNormalizeDomain.mockReturnValue('example.com');
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
      })
    );
  });

  it('handles missing commerce provider', async () => {
    mockGetCommerceProvider.mockResolvedValue(null);

    const result = await lookupOrder({ orderId: '12345' }, { ...baseContext, domain: 'no-commerce.com' });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_PROVIDER');
    expect(result.data?.source).toBe('no-provider');
  });

  it('normalizes domain before requesting provider', async () => {
    await lookupOrder({ orderId: '12345' }, { ...baseContext, domain: 'https://www.example.com' });

    expect(mockNormalizeDomain).toHaveBeenCalledWith('https://www.example.com');
    expect(mockGetCommerceProvider).toHaveBeenCalledWith('example.com');
  });
});
