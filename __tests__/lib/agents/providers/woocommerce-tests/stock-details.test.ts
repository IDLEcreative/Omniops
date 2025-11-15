/**
 * WooCommerceProvider - Stock & Product Details Tests
 * Tests stock checking and detailed product retrieval
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

describe('WooCommerceProvider - Stock & Details', () => {
  let provider: WooCommerceProvider;
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = {
      getProducts: jest.fn(),
    } as jest.Mocked<Partial<WooCommerceAPI>>;

    provider = new WooCommerceProvider(mockClient as WooCommerceAPI);
    jest.clearAllMocks();
  });

  describe('checkStock', () => {
    it('should retrieve product stock information by SKU', async () => {
      const mockProduct = {
        id: 123,
        name: 'Test Product',
        sku: 'SKU123',
        stock_status: 'instock',
        stock_quantity: 50,
        manage_stock: true,
        backorders: 'no'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.checkStock('SKU123');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'SKU123',
        per_page: 1
      });
      expect(result).toEqual({
        productName: 'Test Product',
        sku: 'SKU123',
        stockStatus: 'instock',
        stockQuantity: 50,
        manageStock: true,
        backorders: 'no'
      });
    });

    it('should return null if product not found', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.checkStock('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });
  });

  describe('getProductDetails', () => {
    it('should retrieve product details by SKU when SKU match found', async () => {
      const mockProduct = {
        id: 456,
        name: 'Detailed Product',
        sku: 'DETAIL-SKU',
        price: '99.99',
        description: 'Product description'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.getProductDetails('DETAIL-SKU');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'DETAIL-SKU',
        per_page: 1
      });
      expect(mockClient.getProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProduct);
    });

    it('should fallback to name search when SKU search returns no results', async () => {
      const mockProduct = {
        id: 789,
        name: '10mtr extension cables for all TS Camera systems',
        sku: 'CABLE-10M',
        price: '45.00',
        description: 'Extension cable'
      };

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockProduct]);

      const result = await provider.getProductDetails('10mtr extension cables for all TS Camera systems');

      expect(mockClient.getProducts).toHaveBeenNthCalledWith(1, {
        sku: '10mtr extension cables for all TS Camera systems',
        per_page: 1
      });
      expect(mockClient.getProducts).toHaveBeenNthCalledWith(2, {
        search: '10mtr extension cables for all TS Camera systems',
        per_page: 1,
        status: 'publish'
      });
      expect(result).toEqual(mockProduct);
    });

    it('should return null if both SKU and name search fail', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.getProductDetails('NONEXISTENT');

      expect(mockClient.getProducts).toHaveBeenCalledTimes(3);
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.getProductDetails('DETAIL-SKU');

      expect(result).toBeNull();
    });

    it('should prioritize SKU match over name match for ambiguous queries', async () => {
      const skuProduct = {
        id: 111,
        name: 'Different Product',
        sku: 'PUMP-123',
        price: '100.00'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([skuProduct]);

      const result = await provider.getProductDetails('PUMP-123');

      expect(mockClient.getProducts).toHaveBeenCalledTimes(1);
      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'PUMP-123',
        per_page: 1
      });
      expect(result).toEqual(skuProduct);
    });
  });
});
