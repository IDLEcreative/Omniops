import { lookupOrder } from '../../lookupOrder';
import { baseContext, mockGetCommerceProvider, mockNormalizeDomain, resetMocks, buildProvider } from './helpers/mocks';
import { mockWooCommerceOrder } from './helpers/orders';

describe('lookupOrder – Input Validation', () => {
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

  it('rejects empty orderId', async () => {
    const result = await lookupOrder({ orderId: '' }, baseContext);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Validation failed');
  });

  it('rejects invalid email format', async () => {
    const result = await lookupOrder({ orderId: '12345', email: 'not-an-email' }, baseContext);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('email');
  });

  it('accepts valid orderId without email', async () => {
    const result = await lookupOrder({ orderId: '12345' }, baseContext);
    expect(result.success).toBe(true);
  });

  it('rejects orderId exceeding max length', async () => {
    const result = await lookupOrder({ orderId: 'A'.repeat(101) }, baseContext);
    expect(result.success).toBe(false);
  });
});
