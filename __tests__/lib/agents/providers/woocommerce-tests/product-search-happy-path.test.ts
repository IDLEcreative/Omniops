/**
 * WooCommerceProvider - Product Search Happy Path Tests
 * Tests product search with semantic scoring functionality - Success cases
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import { createMockWooCommerceClient } from './test-helpers';

describe('WooCommerceProvider - Product Search Happy Path', () => {
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = createMockWooCommerceClient();
    jest.clearAllMocks();
  });

  describe('API Interaction', () => {
    it('should fetch 2x requested products from WooCommerce API', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
        { id: 2, name: 'Product 2', price: '39.99' },
        { id: 3, name: 'Product 3', price: '49.99' },
        { id: 4, name: 'Product 4', price: '59.99' },
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('test', 2);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'test',
        per_page: 4, // 2 * 2
        status: 'publish',
      });
    });

    it('should cap fetched products at 50 even for large limits', async () => {
      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('test', 100);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'test',
        per_page: 50,
        status: 'publish',
      });
    });

    it('should only search published products', async () => {
      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('test', 5);

      expect(mockClient.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'publish',
        })
      );
    });
  });

  describe('Semantic Search Processing', () => {
    it('should generate query embedding for semantic search', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', price: '29.99' }];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'Highly relevant' }
      ]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('hydraulic pump', 10);

      expect(mockEmbeddingGenerator).toHaveBeenCalledWith('hydraulic pump');
    });

    it('should score all fetched products by semantic similarity', async () => {
      const mockProducts = [
        { id: 1, name: 'Hydraulic Pump', price: '299.99' },
        { id: 2, name: 'Water Pump', price: '199.99' },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue(mockEmbedding);
      const mockScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'Highly relevant' },
        { ...mockProducts[1], similarity: 0.7, relevanceReason: 'Moderately relevant' },
      ]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('hydraulic pump', 10);

      expect(mockScorer).toHaveBeenCalledWith(mockProducts, mockEmbedding, 'test-domain');
    });
  });

  describe('Result Ordering and Limiting', () => {
    it('should return products sorted by similarity score', async () => {
      const mockProducts = [
        { id: 1, name: 'Low Match', price: '29.99' },
        { id: 2, name: 'High Match', price: '39.99' },
        { id: 3, name: 'Medium Match', price: '49.99' },
      ];

      const scoredProducts = [
        { ...mockProducts[1], similarity: 0.9, relevanceReason: 'Highly relevant' },
        { ...mockProducts[2], similarity: 0.7, relevanceReason: 'Moderately relevant' },
        { ...mockProducts[0], similarity: 0.5, relevanceReason: 'Loosely related' },
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result[0].similarity).toBe(0.9);
      expect(result[1].similarity).toBe(0.7);
      expect(result[2].similarity).toBe(0.5);
    });

    it('should return only requested limit of products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
        { id: 2, name: 'Product 2', price: '39.99' },
        { id: 3, name: 'Product 3', price: '49.99' },
        { id: 4, name: 'Product 4', price: '59.99' },
        { id: 5, name: 'Product 5', price: '69.99' },
        { id: 6, name: 'Product 6', price: '79.99' },
      ];

      const scoredProducts = mockProducts.map((p, i) => ({
        ...p,
        similarity: 0.9 - (i * 0.1),
        relevanceReason: 'Highly relevant'
      }));

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 3);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });
  });

  describe('Result Enrichment', () => {
    it('should include similarity scores and relevanceReason in results', async () => {
      const mockProducts = [{ id: 1, name: 'Test Product', price: '29.99' }];

      const scoredProducts = [
        {
          ...mockProducts[0],
          similarity: 0.85,
          relevanceReason: 'Highly relevant'
        }
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result[0]).toHaveProperty('similarity', 0.85);
      expect(result[0]).toHaveProperty('relevanceReason', 'Highly relevant');
    });

    it('should preserve all original product fields', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product',
          price: '29.99',
          sku: 'TEST-001',
          stock_status: 'instock',
          description: 'Test description',
          permalink: 'https://example.com/product',
        },
      ];

      const scoredProducts = [
        {
          ...mockProducts[0],
          similarity: 0.9,
          relevanceReason: 'Highly relevant'
        }
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].price).toBe('29.99');
      expect(result[0].sku).toBe('TEST-001');
      expect(result[0].stock_status).toBe('instock');
      expect(result[0].description).toBe('Test description');
      expect(result[0].permalink).toBe('https://example.com/product');
    });
  });
});
