/**
 * WooCommerceProvider - Product Search Edge Cases & Error Handling Tests
 * Tests edge cases, defaults, and error recovery
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import { createMockWooCommerceClient } from './test-helpers';

describe('WooCommerceProvider - Product Search Edge Cases', () => {
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = createMockWooCommerceClient();
    jest.clearAllMocks();
  });

  describe('Empty results and minimal cases', () => {
    it('should handle empty product results from WooCommerce', async () => {
      const mockEmbeddingGenerator = jest.fn();
      const mockScorer = jest.fn();

      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('nonexistent', 10);

      expect(result).toEqual([]);
      expect(mockEmbeddingGenerator).not.toHaveBeenCalled();
      expect(mockScorer).not.toHaveBeenCalled();
    });

    it('should handle limit=1 (fetch 2 products)', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
        { id: 2, name: 'Product 2', price: '39.99' },
      ];

      const scoredProducts = [
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'Highly relevant' },
        { ...mockProducts[1], similarity: 0.7, relevanceReason: 'Moderately relevant' },
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 1);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'test',
        per_page: 2,
        status: 'publish',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should use default limit of 10 when not specified', async () => {
      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      await provider.searchProducts('query');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'query',
        per_page: 20, // 10 * 2
        status: 'publish',
      });
    });

    it('should handle scoring fewer products than requested limit', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
        { id: 2, name: 'Product 2', price: '39.99' },
        { id: 3, name: 'Product 3', price: '49.99' },
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
      const result = await provider.searchProducts('test', 10);

      expect(result).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('should handle WooCommerce API errors gracefully', async () => {
      const mockEmbeddingGenerator = jest.fn();
      const mockScorer = jest.fn();

      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('WooCommerce API Error'));

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result).toEqual([]);
      expect(mockEmbeddingGenerator).not.toHaveBeenCalled();
      expect(mockScorer).not.toHaveBeenCalled();
    });

    it('should handle embedding generation errors gracefully', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', price: '29.99' }];

      const mockEmbeddingGenerator = jest.fn().mockRejectedValue(new Error('OpenAI API Error'));
      const mockScorer = jest.fn();

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result).toEqual([]);
    });

    it('should handle similarity scoring errors gracefully', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', price: '29.99' }];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockRejectedValue(new Error('Scoring Error'));

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result).toEqual([]);
    });

    it('should handle network timeout errors', async () => {
      const mockEmbeddingGenerator = jest.fn();
      const mockScorer = jest.fn();

      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('ETIMEDOUT'));

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(result).toEqual([]);
    });

    it('should handle malformed product data', async () => {
      const malformedProducts = [
        { id: 1, name: null, price: undefined },
        { id: 2, name: 'Valid Product', price: '29.99' },
      ] as any;

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([
        { ...malformedProducts[0], similarity: 0.5, relevanceReason: 'Loosely related' },
        { ...malformedProducts[1], similarity: 0.9, relevanceReason: 'Highly relevant' },
      ]);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(malformedProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('test', 10);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Integration verification', () => {
    it('should complete full semantic search workflow', async () => {
      const mockProducts = [
        { id: 1, name: 'Hydraulic Pump A', price: '299.99', sku: 'HP-001' },
        { id: 2, name: 'Water Pump', price: '199.99', sku: 'WP-001' },
        { id: 3, name: 'Hydraulic Pump B', price: '349.99', sku: 'HP-002' },
        { id: 4, name: 'Air Pump', price: '149.99', sku: 'AP-001' },
      ];

      const queryEmbedding = [0.1, 0.2, 0.3];

      const scoredProducts = [
        { ...mockProducts[0], similarity: 0.92, relevanceReason: 'Highly relevant' },
        { ...mockProducts[2], similarity: 0.88, relevanceReason: 'Highly relevant' },
        { ...mockProducts[1], similarity: 0.65, relevanceReason: 'Moderately relevant' },
        { ...mockProducts[3], similarity: 0.45, relevanceReason: 'Loosely related' },
      ];

      const mockEmbeddingGenerator = jest.fn().mockResolvedValue(queryEmbedding);
      const mockScorer = jest.fn().mockResolvedValue(scoredProducts);

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI, 'test-domain', mockEmbeddingGenerator, mockScorer);
      const result = await provider.searchProducts('hydraulic pump', 2);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'hydraulic pump',
        per_page: 4,
        status: 'publish',
      });
      expect(mockEmbeddingGenerator).toHaveBeenCalledWith('hydraulic pump');
      expect(mockScorer).toHaveBeenCalledWith(mockProducts, queryEmbedding, 'test-domain');

      expect(result).toHaveLength(2);
      expect(result[0].sku).toBe('HP-001');
      expect(result[1].sku).toBe('HP-002');
    });
  });
});
