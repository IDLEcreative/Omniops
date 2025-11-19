/**
 * Shopify Products API Tests
 *
 * Tests for /api/shopify/products endpoint
 * Coverage: GET (all products, search, by ID, validation, error handling)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/shopify/products/route';

// Mock dependencies
jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: jest.fn(),
}));

describe.skip('/api/shopify/products', () => {
  let mockShopifyClient: any;
  let mockGetDynamicShopifyClient: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Shopify client
    mockShopifyClient = {
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProduct: jest.fn(),
    };

    const shopifyDynamic = jest.requireMock('@/lib/shopify-dynamic');
    mockGetDynamicShopifyClient = shopifyDynamic.getDynamicShopifyClient;
    mockGetDynamicShopifyClient.mockResolvedValue(mockShopifyClient);
  });

  describe('GET - All products', () => {
    it('should return all products with default limit', async () => {
      const mockProducts = [
        { id: 1, title: 'Product 1', price: '10.00' },
        { id: 2, title: 'Product 2', price: '20.00' },
      ];

      mockShopifyClient.getProducts.mockResolvedValue(mockProducts);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual(mockProducts);
      expect(data.count).toBe(2);
      expect(mockShopifyClient.getProducts).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should respect custom limit parameter', async () => {
      mockShopifyClient.getProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&limit=25');

      await GET(request);

      expect(mockShopifyClient.getProducts).toHaveBeenCalledWith({ limit: 25 });
    });
  });

  describe('GET - Search products', () => {
    it('should search products by query parameter', async () => {
      const mockSearchResults = [
        { id: 1, title: 'Blue Shirt', price: '29.99' },
        { id: 2, title: 'Blue Jeans', price: '49.99' },
      ];

      mockShopifyClient.searchProducts.mockResolvedValue(mockSearchResults);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&query=blue');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual(mockSearchResults);
      expect(data.count).toBe(2);
      expect(mockShopifyClient.searchProducts).toHaveBeenCalledWith('blue', 10);
    });

    it('should search products by search parameter', async () => {
      const mockSearchResults = [{ id: 3, title: 'Red Hat', price: '19.99' }];

      mockShopifyClient.searchProducts.mockResolvedValue(mockSearchResults);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&search=red');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockShopifyClient.searchProducts).toHaveBeenCalledWith('red', 10);
    });

    it('should use custom limit for search', async () => {
      mockShopifyClient.searchProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&query=test&limit=5');

      await GET(request);

      expect(mockShopifyClient.searchProducts).toHaveBeenCalledWith('test', 5);
    });
  });

  describe('GET - Product by ID', () => {
    it('should return specific product by ID', async () => {
      const mockProduct = { id: 123, title: 'Specific Product', price: '99.99' };

      mockShopifyClient.getProduct.mockResolvedValue(mockProduct);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&id=123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.product).toEqual(mockProduct);
      expect(mockShopifyClient.getProduct).toHaveBeenCalledWith(123);
    });

    it('should return 400 for invalid product ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&id=not-a-number');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid product ID');
      expect(mockShopifyClient.getProduct).not.toHaveBeenCalled();
    });

    it('should handle non-numeric ID gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&id=abc');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid product ID');
    });
  });

  describe('GET - Validation errors', () => {
    it('should return 400 when domain parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/products');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Domain parameter is required');
      expect(mockGetDynamicShopifyClient).not.toHaveBeenCalled();
    });

    it('should return 400 when domain is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Domain parameter is required');
    });
  });

  describe('GET - Shopify not configured', () => {
    it('should return 404 when Shopify is not configured for domain', async () => {
      mockGetDynamicShopifyClient.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=unconfigured.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not configured');
    });
  });

  describe('GET - Error handling', () => {
    it('should return 500 when getProducts throws error', async () => {
      mockShopifyClient.getProducts.mockRejectedValue(new Error('Shopify API error'));

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch products');
      expect(data.details).toBe('Shopify API error');
    });

    it('should return 500 when searchProducts throws error', async () => {
      mockShopifyClient.searchProducts.mockRejectedValue(new Error('Search failed'));

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&query=test');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch products');
      expect(data.details).toBe('Search failed');
    });

    it('should return 500 when getProduct throws error', async () => {
      mockShopifyClient.getProduct.mockRejectedValue(new Error('Product not found'));

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&id=999');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch products');
      expect(data.details).toBe('Product not found');
    });

    it('should handle network errors gracefully', async () => {
      mockShopifyClient.getProducts.mockRejectedValue(new Error('Network timeout'));

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toContain('Network timeout');
    });
  });

  describe('GET - Edge cases', () => {
    it('should handle empty product list', async () => {
      mockShopifyClient.getProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should handle empty search results', async () => {
      mockShopifyClient.searchProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&query=nonexistent');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.products).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should handle limit of 0', async () => {
      mockShopifyClient.getProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&limit=0');

      await GET(request);

      expect(mockShopifyClient.getProducts).toHaveBeenCalledWith({ limit: 0 });
    });

    it('should handle very large limit', async () => {
      mockShopifyClient.getProducts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/shopify/products?domain=example.com&limit=10000');

      await GET(request);

      expect(mockShopifyClient.getProducts).toHaveBeenCalledWith({ limit: 10000 });
    });
  });
});
