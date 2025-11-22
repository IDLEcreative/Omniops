/**
 * Shopify Provider - Product Operations Tests
 *
 * Tests for searchProducts, checkStock, and getProductDetails methods
 */

import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';

describe('ShopifyProvider - Operations', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<ShopifyAPI>;

  beforeEach(() => {
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
    } as any;

    provider = new ShopifyProvider(mockClient);
  });

  describe('searchProducts()', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        { id: 1, title: 'Test Product 1' },
        { id: 2, title: 'Test Product 2' },
      ];

      mockClient.searchProducts.mockResolvedValueOnce(mockProducts as any);

      const result = await provider.searchProducts('test');

      expect(mockClient.searchProducts).toHaveBeenCalledWith('test', 10);
      expect(result).toEqual(mockProducts);
    });

    it('should use custom limit', async () => {
      mockClient.searchProducts.mockResolvedValueOnce([]);

      await provider.searchProducts('test', 25);

      expect(mockClient.searchProducts).toHaveBeenCalledWith('test', 25);
    });

    it('should return empty array on error', async () => {
      mockClient.searchProducts.mockRejectedValueOnce(new Error('API Error'));

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should handle empty results', async () => {
      mockClient.searchProducts.mockResolvedValueOnce([]);

      const result = await provider.searchProducts('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('checkStock()', () => {
    const mockProduct = {
      id: 123,
      title: 'Test Product',
      variants: [
        {
          id: 456,
          sku: 'TEST-SKU',
          inventory_quantity: 50,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
        },
      ],
    };

    describe('By Numeric ID', () => {
      it('should check stock by product ID', async () => {
        mockClient.getProduct.mockResolvedValueOnce(mockProduct as any);

        const result = await provider.checkStock('123');

        expect(mockClient.getProduct).toHaveBeenCalledWith(123);
        expect(result).toMatchObject({
          productName: 'Test Product',
          sku: 'TEST-SKU',
          stockStatus: 'instock',
          stockQuantity: 50,
          manageStock: true,
          backorders: 'no',
        });
      });
    });

    describe('By SKU', () => {
      it('should check stock by SKU', async () => {
        mockClient.getProduct.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getProducts.mockResolvedValueOnce([mockProduct] as any);

        const result = await provider.checkStock('TEST-SKU');

        expect(mockClient.getProducts).toHaveBeenCalled();
        expect(result?.sku).toBe('TEST-SKU');
      });

      it('should find correct variant by SKU', async () => {
        const productWithMultipleVariants = {
          ...mockProduct,
          variants: [
            { ...mockProduct.variants[0], sku: 'SKU-1' },
            { ...mockProduct.variants[0], sku: 'SKU-2', inventory_quantity: 100 },
          ],
        };

        mockClient.getProduct.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getProducts.mockResolvedValueOnce([
          productWithMultipleVariants,
        ] as any);

        const result = await provider.checkStock('SKU-2');

        expect(result?.stockQuantity).toBe(100);
      });
    });

    describe('Stock Status', () => {
      it('should return "instock" when quantity > 0', async () => {
        mockClient.getProduct.mockResolvedValueOnce(mockProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.stockStatus).toBe('instock');
      });

      it('should return "outofstock" when quantity is 0', async () => {
        const outOfStockProduct = {
          ...mockProduct,
          variants: [{ ...mockProduct.variants[0], inventory_quantity: 0 }],
        };

        mockClient.getProduct.mockResolvedValueOnce(outOfStockProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.stockStatus).toBe('outofstock');
      });

      it('should handle negative inventory quantity', async () => {
        const negativeInventory = {
          ...mockProduct,
          variants: [{ ...mockProduct.variants[0], inventory_quantity: -5 }],
        };

        mockClient.getProduct.mockResolvedValueOnce(negativeInventory as any);

        const result = await provider.checkStock('123');

        expect(result?.stockStatus).toBe('outofstock');
      });
    });

    describe('Inventory Management', () => {
      it('should detect when inventory is managed', async () => {
        mockClient.getProduct.mockResolvedValueOnce(mockProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.manageStock).toBe(true);
      });

      it('should detect when inventory is not managed', async () => {
        const unmanagedProduct = {
          ...mockProduct,
          variants: [{ ...mockProduct.variants[0], inventory_management: null }],
        };

        mockClient.getProduct.mockResolvedValueOnce(unmanagedProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.manageStock).toBe(false);
      });
    });

    describe('Backorder Settings', () => {
      it('should detect backorders allowed', async () => {
        const backorderProduct = {
          ...mockProduct,
          variants: [{ ...mockProduct.variants[0], inventory_policy: 'continue' }],
        };

        mockClient.getProduct.mockResolvedValueOnce(backorderProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.backorders).toBe('yes');
      });

      it('should detect backorders not allowed', async () => {
        mockClient.getProduct.mockResolvedValueOnce(mockProduct as any);

        const result = await provider.checkStock('123');

        expect(result?.backorders).toBe('no');
      });
    });

    describe('Error Handling', () => {
      it('should return null when product not found', async () => {
        mockClient.getProduct.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getProducts.mockResolvedValueOnce([]);

        const result = await provider.checkStock('999');

        expect(result).toBeNull();
      });

      it('should return null when variant not found', async () => {
        const productWithoutVariants = { ...mockProduct, variants: [] };

        mockClient.getProduct.mockResolvedValueOnce(productWithoutVariants as any);

        const result = await provider.checkStock('123');

        expect(result).toBeNull();
      });

      it('should return null on API errors', async () => {
        mockClient.getProduct.mockRejectedValueOnce(new Error('API Error'));
        mockClient.getProducts.mockRejectedValueOnce(new Error('API Error'));

        const result = await provider.checkStock('123');

        expect(result).toBeNull();
      });
    });
  });

  describe('getProductDetails()', () => {
    const mockProduct = {
      id: 123,
      title: 'Test Product',
      description: 'Product description',
      variants: [{ id: 1, sku: 'TEST-SKU' }],
    };

    it('should get product details by numeric ID', async () => {
      mockClient.getProduct.mockResolvedValueOnce(mockProduct as any);

      const result = await provider.getProductDetails('123');

      expect(mockClient.getProduct).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockProduct);
    });

    it('should get product details by SKU', async () => {
      mockClient.getProducts.mockResolvedValueOnce([mockProduct] as any);

      const result = await provider.getProductDetails('TEST-SKU');

      expect(mockClient.getProducts).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should return null when product not found', async () => {
      mockClient.getProducts.mockResolvedValueOnce([]);

      const result = await provider.getProductDetails('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null on API errors', async () => {
      mockClient.getProducts.mockRejectedValueOnce(new Error('API Error'));

      const result = await provider.getProductDetails('TEST-SKU');

      expect(result).toBeNull();
    });
  });
});
