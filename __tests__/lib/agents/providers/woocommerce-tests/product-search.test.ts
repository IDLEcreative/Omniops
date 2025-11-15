/**
 * WooCommerceProvider - Product Search Tests
 * Tests product search and stock checking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

describe('WooCommerceProvider - Product Search', () => {
  let provider: WooCommerceProvider;
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = {
      getProducts: jest.fn(),
    } as jest.Mocked<Partial<WooCommerceAPI>>;

    provider = new WooCommerceProvider(mockClient as WooCommerceAPI);
    jest.clearAllMocks();
  });

  it('should search products by query', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Test Product 1',
        price: '29.99',
        status: 'publish'
      },
      {
        id: 2,
        name: 'Test Product 2',
        price: '39.99',
        status: 'publish'
      }
    ];

    (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

    const result = await provider.searchProducts('test', 10);

    expect(mockClient.getProducts).toHaveBeenCalledWith({
      search: 'test',
      per_page: 10,
      status: 'publish',
    });
    expect(result).toEqual(mockProducts);
  });

  it('should use default limit of 10', async () => {
    (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

    await provider.searchProducts('query');

    expect(mockClient.getProducts).toHaveBeenCalledWith({
      search: 'query',
      per_page: 10,
      status: 'publish',
    });
  });

  it('should respect custom limit', async () => {
    (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

    await provider.searchProducts('query', 25);

    expect(mockClient.getProducts).toHaveBeenCalledWith({
      search: 'query',
      per_page: 25,
      status: 'publish',
    });
  });

  it('should handle search errors gracefully', async () => {
    (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await provider.searchProducts('test');

    expect(result).toEqual([]);
  });

  it('should only search published products', async () => {
    (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

    await provider.searchProducts('test');

    expect(mockClient.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'publish',
      })
    );
  });
});
