/**
 * WooCommerceProvider - Dependency Injection Tests
 * Tests dependency injection patterns for easy testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import { createMockWooCommerceClient } from './test-helpers';

describe('WooCommerceProvider - Dependency Injection', () => {
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = createMockWooCommerceClient();
    jest.clearAllMocks();
  });

  describe('Testability with Simple Mock Functions', () => {
    it('should allow injecting custom embedding generator', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', price: '29.99' }];

      const customEmbeddingGenerator = jest.fn().mockResolvedValue([0.5, 0.5, 0.5]);
      const customProductScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.95, relevanceReason: 'Custom scoring' }
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        customEmbeddingGenerator,
        customProductScorer
      );

      const result = await provider.searchProducts('test query', 10);

      expect(customEmbeddingGenerator).toHaveBeenCalledWith('test query');
      expect(customProductScorer).toHaveBeenCalledWith(mockProducts, [0.5, 0.5, 0.5]);
      expect(result[0].similarity).toBe(0.95);
      expect(result[0].relevanceReason).toBe('Custom scoring');
    });

    it('should allow injecting custom product scorer', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', price: '100' },
        { id: 2, name: 'Product B', price: '200' },
      ];

      const customScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[1], similarity: 0.99, relevanceReason: 'Price-based priority' },
        { ...mockProducts[0], similarity: 0.50, relevanceReason: 'Lower price' },
      ]);

      const mockEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        mockEmbedding,
        customScorer
      );

      const result = await provider.searchProducts('expensive products', 10);

      expect(result[0].id).toBe(2);
      expect(result[0].similarity).toBe(0.99);
      expect(result[1].id).toBe(1);
    });

    it('should work with minimal mock setup (no module mocking)', async () => {
      const mockProducts = [{ id: 1, name: 'Test Product', price: '50' }];

      const mockEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.85, relevanceReason: 'Good match' }
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        mockEmbedding,
        mockScorer
      );

      const result = await provider.searchProducts('test', 1);

      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.85);
      expect(mockEmbedding).toHaveBeenCalledTimes(1);
      expect(mockScorer).toHaveBeenCalledTimes(1);
    });

    it('should test embedding failure without module mocks', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];

      const failingEmbedding = jest.fn().mockRejectedValue(new Error('OpenAI timeout'));
      const mockScorer = jest.fn();

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        failingEmbedding,
        mockScorer
      );

      const result = await provider.searchProducts('test', 5);

      expect(result).toEqual([]);
      expect(failingEmbedding).toHaveBeenCalled();
      expect(mockScorer).not.toHaveBeenCalled();
    });

    it('should test scoring failure without module mocks', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];

      const mockEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const failingScorer = jest.fn().mockRejectedValue(new Error('Scoring error'));

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        mockEmbedding,
        failingScorer
      );

      const result = await provider.searchProducts('test', 5);

      expect(result).toEqual([]);
      expect(mockEmbedding).toHaveBeenCalled();
      expect(failingScorer).toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    it('should use default dependencies when not provided', async () => {
      mockClient = {
        getProducts: jest.fn().mockResolvedValue([]),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(mockClient as WooCommerceAPI);

      const result = await provider.searchProducts('test', 10);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should allow partial dependency injection', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];

      const customEmbedding = jest.fn().mockResolvedValue([0.9, 0.8, 0.7]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        customEmbedding
      );

      await provider.searchProducts('test', 10);

      expect(customEmbedding).toHaveBeenCalledWith('test');
    });
  });

  describe('Dependency Contract Verification', () => {
    it('should call embeddingGenerator with correct signature', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];
      const embeddingGeneratorSpy = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const mockScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.8, relevanceReason: 'Match' }
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        embeddingGeneratorSpy,
        mockScorer
      );

      await provider.searchProducts('hydraulic pump', 10);

      expect(embeddingGeneratorSpy).toHaveBeenCalledTimes(1);
      expect(embeddingGeneratorSpy).toHaveBeenCalledWith('hydraulic pump');
      expect(embeddingGeneratorSpy.mock.results[0].value).resolves.toEqual([0.1, 0.2, 0.3]);
    });

    it('should call productScorer with correct signature', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', price: '10' },
        { id: 2, name: 'Product B', price: '20' },
      ];
      const mockEmbedding = [0.5, 0.6, 0.7];
      const productScorerSpy = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'High match' },
        { ...mockProducts[1], similarity: 0.7, relevanceReason: 'Medium match' },
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        jest.fn().mockResolvedValue(mockEmbedding),
        productScorerSpy
      );

      await provider.searchProducts('test', 10);

      expect(productScorerSpy).toHaveBeenCalledTimes(1);
      expect(productScorerSpy).toHaveBeenCalledWith(mockProducts, mockEmbedding);

      const result = await productScorerSpy.mock.results[0].value;
      expect(result[0]).toHaveProperty('similarity');
      expect(result[0]).toHaveProperty('relevanceReason');
    });

    it('should handle embeddingGenerator returning different vector sizes', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];

      const embedding1536 = new Array(1536).fill(0.1);
      const embedding3072 = new Array(3072).fill(0.2);

      const mockScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.8, relevanceReason: 'Match' }
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider1 = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        jest.fn().mockResolvedValue(embedding1536),
        mockScorer
      );

      await provider1.searchProducts('test', 5);
      expect(mockScorer).toHaveBeenCalledWith(mockProducts, embedding1536);

      jest.clearAllMocks();

      const provider2 = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        jest.fn().mockResolvedValue(embedding3072),
        mockScorer
      );

      await provider2.searchProducts('test', 5);
      expect(mockScorer).toHaveBeenCalledWith(mockProducts, embedding3072);
    });
  });

  describe('Performance Testing with DI', () => {
    it('should support fast mock implementations for performance testing', async () => {
      const mockProducts = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: `${(i + 1) * 10}`,
      }));

      const fastEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      const fastScorer = jest.fn().mockResolvedValue(
        mockProducts.map(p => ({
          ...p,
          similarity: Math.random(),
          relevanceReason: 'Mock'
        }))
      );

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        fastEmbedding,
        fastScorer
      );

      const startTime = Date.now();
      const result = await provider.searchProducts('test', 10);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result).toHaveLength(10);
    });

    it('should allow testing with slow dependencies', async () => {
      const mockProducts = [{ id: 1, name: 'Product', price: '10' }];

      const slowEmbedding = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return [0.1, 0.2, 0.3];
      });

      const fastScorer = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.8, relevanceReason: 'Match' }
      ]);

      mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        slowEmbedding,
        fastScorer
      );

      const startTime = Date.now();
      await provider.searchProducts('test', 5);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });
});
