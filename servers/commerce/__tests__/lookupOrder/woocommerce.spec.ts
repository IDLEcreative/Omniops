import { lookupOrder } from '../../lookupOrder';
import { mockWooCommerceOrder, orderWith } from './helpers/orders';
import {
  baseContext,
  mockGetCommerceProvider,
  mockNormalizeDomain,
  resetMocks,
  buildProvider,
} from './helpers/mocks';

describe('lookupOrder – WooCommerce integration', () => {
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

  it('looks up order by number', async () => {
    const result = await lookupOrder({ orderId: '12345' }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data?.order).toEqual(mockWooCommerceOrder);
    expect(result.data?.source).toBe('woocommerce');
    expect(result.data?.formattedResult?.title).toBe('Order #12345');
  });

  it('supports email validation', async () => {
    const result = await lookupOrder({ orderId: '12345', email: 'john.doe@example.com' }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data?.order?.billing?.email).toBe('john.doe@example.com');
    expect(mockGetCommerceProvider).toHaveBeenCalledWith('thompsonseparts.co.uk');
  });

  it('formats order details for responses', async () => {
    const result = await lookupOrder({ orderId: '12345' }, baseContext);
    const formatted = result.data?.formattedResult;

    expect(formatted?.content).toContain('Order #12345');
    expect(formatted?.content).toContain('Status: processing');
    expect(formatted?.content).toContain('Total: £149.99');
    expect(formatted?.content).toContain('Hydraulic Pump A4VTG90 (x1)');
    expect(formatted?.content).toContain('Seal Kit BP-001 (x2)');
    expect(formatted?.content).toContain('Customer: John Doe');
    expect(formatted?.content).toContain('Tracking: TRACK123456');
    expect(formatted?.similarity).toBe(1.0);
  });

  it('reports not-found orders', async () => {
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(null),
      })
    );

    const result = await lookupOrder({ orderId: '99999' }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data?.success).toBe(false);
    expect(result.data?.order).toBeNull();
    expect(result.data?.source).toBe('not-found');
  });

  it('handles WooCommerce API errors', async () => {
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockRejectedValue(new Error('WooCommerce API connection failed')),
      })
    );

    const result = await lookupOrder({ orderId: '12345' }, baseContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('LOOKUP_ORDER_ERROR');
    expect(result.error?.message).toContain('WooCommerce API connection failed');
  });

  describe('Edge cases', () => {
    it('handles orders with no items', async () => {
      mockGetCommerceProvider.mockResolvedValue(
        buildProvider({
          lookupOrder: jest.fn().mockResolvedValue(orderWith({ items: [] })),
        })
      );

      const result = await lookupOrder({ orderId: '12345' }, baseContext);
      expect(result.data?.formattedResult?.content).toContain('Items: No items');
    });

    it('handles missing billing info', async () => {
      mockGetCommerceProvider.mockResolvedValue(
        buildProvider({
          lookupOrder: jest.fn().mockResolvedValue(orderWith({ billing: undefined })),
        })
      );

      const result = await lookupOrder({ orderId: '12345' }, baseContext);
      expect(result.data?.formattedResult?.content).not.toContain('Customer:');
    });

    it('handles missing tracking number', async () => {
      mockGetCommerceProvider.mockResolvedValue(
        buildProvider({
          lookupOrder: jest.fn().mockResolvedValue(orderWith({ trackingNumber: null })),
        })
      );

      const result = await lookupOrder({ orderId: '12345' }, baseContext);
      expect(result.data?.formattedResult?.content).not.toContain('Tracking:');
    });

    it('handles missing permalink', async () => {
      mockGetCommerceProvider.mockResolvedValue(
        buildProvider({
          lookupOrder: jest.fn().mockResolvedValue(orderWith({ permalink: null })),
        })
      );

      const result = await lookupOrder({ orderId: '12345' }, baseContext);
      expect(result.data?.formattedResult?.url).toBe('');
    });
  });
});
