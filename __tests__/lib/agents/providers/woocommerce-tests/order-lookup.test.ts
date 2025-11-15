/**
 * WooCommerceProvider - Order Lookup Tests
 * Tests order lookup by ID, email, and tracking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

describe('WooCommerceProvider - Order Lookup', () => {
  let provider: WooCommerceProvider;
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
    } as jest.Mocked<Partial<WooCommerceAPI>>;

    provider = new WooCommerceProvider(mockClient as WooCommerceAPI);
    jest.clearAllMocks();
  });

  it('should lookup order by numeric ID', async () => {
    const mockOrder = {
      id: 123,
      number: '123',
      status: 'completed',
      date_created: '2025-01-01T00:00:00',
      total: '99.99',
      currency: 'USD',
      line_items: [
        {
          name: 'Test Product',
          quantity: 2,
          total: '99.99'
        }
      ],
      billing: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      },
      shipping: {
        address_1: '123 Main St'
      }
    };

    (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

    const result = await provider.lookupOrder('123');

    expect(result).toEqual({
      id: 123,
      number: '123',
      status: 'completed',
      date: '2025-01-01T00:00:00',
      total: '99.99',
      currency: 'USD',
      items: [
        {
          name: 'Test Product',
          quantity: 2,
          total: '99.99'
        }
      ],
      billing: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      },
      shipping: {
        address_1: '123 Main St'
      },
      trackingNumber: null,
      permalink: null
    });
  });

  it('should search for order by email if ID lookup fails', async () => {
    const mockOrder = {
      id: 456,
      number: '456',
      status: 'processing',
      date_created: '2025-01-02T00:00:00',
      total: '49.99',
      currency: 'USD',
      line_items: [],
      billing: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com'
      }
    };

    (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('Not found'));
    (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

    const result = await provider.lookupOrder('999', 'jane@example.com');

    expect(mockClient.getOrders).toHaveBeenCalledWith({
      search: 'jane@example.com',
      per_page: 1,
    });
    expect(result?.id).toBe(456);
  });

  it('should search by order ID if not numeric', async () => {
    const mockOrder = {
      id: 789,
      number: 'ORD-789',
      status: 'completed',
      date_created: '2025-01-03T00:00:00',
      total: '199.99',
      currency: 'USD',
      line_items: []
    };

    (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

    const result = await provider.lookupOrder('ORD-789');

    expect(mockClient.getOrders).toHaveBeenCalledWith({
      search: 'ORD-789',
      per_page: 1,
    });
    expect(result?.number).toBe('ORD-789');
  });

  it('should return null if order not found', async () => {
    (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('Not found'));
    (mockClient.getOrders as jest.Mock).mockResolvedValue([]);

    const result = await provider.lookupOrder('999');

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('API Error'));
    (mockClient.getOrders as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await provider.lookupOrder('123');

    expect(result).toBeNull();
  });

  it('should include tracking number if available', async () => {
    const mockOrder = {
      id: 111,
      number: '111',
      status: 'shipped',
      date_created: '2025-01-04T00:00:00',
      total: '79.99',
      currency: 'USD',
      line_items: [],
      shipping: {
        tracking_number: 'TRACK123456'
      }
    };

    (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

    const result = await provider.lookupOrder('111');

    expect(result?.trackingNumber).toBe('TRACK123456');
  });
});
