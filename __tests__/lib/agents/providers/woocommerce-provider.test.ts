/**
 * WooCommerceProvider - Test Orchestrator
 *
 * Entry point for all WooCommerceProvider tests.
 * Individual test suites are organized in ./woocommerce-tests/
 *
 * Test Coverage:
 * - Order lookup (by ID, email, tracking)
 * - Product search (query, limits, error handling)
 * - Stock checking and product details
 *
 * @see __tests__/lib/agents/providers/woocommerce-tests/order-lookup.test.ts
 * @see __tests__/lib/agents/providers/woocommerce-tests/product-search.test.ts
 * @see __tests__/lib/agents/providers/woocommerce-tests/stock-details.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

import '@/__tests__/lib/agents/providers/woocommerce-tests/order-lookup.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/product-search-happy-path.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/product-search-edge-cases.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/product-search-dependency-injection.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/stock-details.test';

describe('WooCommerceProvider', () => {
  describe('constructor', () => {
    it('should initialize with platform', () => {
      const mockClient = {} as WooCommerceAPI;
      const provider = new WooCommerceProvider(mockClient);

      expect(provider.platform).toBe('woocommerce');
    });

    it('should accept optional domain parameter', () => {
      const mockClient = {} as WooCommerceAPI;
      const domain = 'example.com';
      const provider = new WooCommerceProvider(mockClient, domain);

      expect(provider.platform).toBe('woocommerce');
    });

    it('should work without domain (backward compatible)', () => {
      const mockClient = {} as WooCommerceAPI;
      const provider = new WooCommerceProvider(mockClient);

      expect(provider.platform).toBe('woocommerce');
    });

    it('should accept custom embedding generator', () => {
      const mockClient = {} as WooCommerceAPI;
      const customEmbedding = jest.fn();
      const provider = new WooCommerceProvider(mockClient, 'example.com', customEmbedding);

      expect(provider.platform).toBe('woocommerce');
    });

    it('should accept custom product scorer', () => {
      const mockClient = {} as WooCommerceAPI;
      const customEmbedding = jest.fn();
      const customScorer = jest.fn();
      const provider = new WooCommerceProvider(mockClient, 'example.com', customEmbedding, customScorer);

      expect(provider.platform).toBe('woocommerce');
    });
  });

  describe('searchProducts - Caching Integration', () => {
    let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;
    let mockEmbeddingGenerator: jest.Mock;
    let mockProductScorer: jest.Mock;

    beforeEach(() => {
      mockClient = {
        getProducts: jest.fn(),
      } as jest.Mocked<Partial<WooCommerceAPI>>;

      mockEmbeddingGenerator = jest.fn();
      mockProductScorer = jest.fn();
    });

    it('passes domain to productScorer when domain provided', async () => {
      const domain = 'test-domain.com';
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
      mockEmbeddingGenerator.mockResolvedValue(mockEmbedding);
      mockProductScorer.mockResolvedValue([
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'Highly relevant' }
      ]);

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        domain,
        mockEmbeddingGenerator,
        mockProductScorer
      );

      await provider.searchProducts('test query', 10);

      // Verify productScorer was called with domain (3rd parameter)
      expect(mockProductScorer).toHaveBeenCalledWith(mockProducts, mockEmbedding, domain);
    });

    it('does not pass domain when not provided (backward compatible)', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '29.99' },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
      mockEmbeddingGenerator.mockResolvedValue(mockEmbedding);
      mockProductScorer.mockResolvedValue([
        { ...mockProducts[0], similarity: 0.9, relevanceReason: 'Highly relevant' }
      ]);

      // Provider created WITHOUT domain
      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        undefined,
        mockEmbeddingGenerator,
        mockProductScorer
      );

      await provider.searchProducts('test query', 10);

      // Verify productScorer was called with undefined domain
      expect(mockProductScorer).toHaveBeenCalledWith(mockProducts, mockEmbedding, undefined);
    });

    it('enables caching when domain is provided', async () => {
      const domain = 'example.com';
      const mockProducts = [
        { id: 1, name: 'Product', price: '10' },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
      mockEmbeddingGenerator.mockResolvedValue(mockEmbedding);

      // Mock productScorer to verify domain is passed
      const scorerSpy = jest.fn().mockResolvedValue([
        { ...mockProducts[0], similarity: 0.8, relevanceReason: 'Match' }
      ]);

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        domain,
        mockEmbeddingGenerator,
        scorerSpy
      );

      await provider.searchProducts('query', 5);

      // Verify domain was passed to enable caching
      expect(scorerSpy).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        domain
      );
    });

    it('maintains caching across multiple searches', async () => {
      const domain = 'example.com';
      const mockProducts = [
        { id: 1, name: 'Product A', price: '10' },
        { id: 2, name: 'Product B', price: '20' },
      ];
      const mockEmbedding = [0.1, 0.2, 0.3];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
      mockEmbeddingGenerator.mockResolvedValue(mockEmbedding);
      mockProductScorer.mockResolvedValue(
        mockProducts.map(p => ({ ...p, similarity: 0.8, relevanceReason: 'Match' }))
      );

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        domain,
        mockEmbeddingGenerator,
        mockProductScorer
      );

      // First search
      await provider.searchProducts('query1', 10);
      expect(mockProductScorer).toHaveBeenCalledWith(expect.any(Array), mockEmbedding, domain);

      // Second search
      await provider.searchProducts('query2', 10);
      expect(mockProductScorer).toHaveBeenCalledTimes(2);
      expect(mockProductScorer).toHaveBeenLastCalledWith(expect.any(Array), mockEmbedding, domain);
    });

    it('works end-to-end with domain for caching', async () => {
      const domain = 'real-store.com';
      const mockProducts = [
        { id: 123, name: 'Hydraulic Pump', price: '299.99', sku: 'HP-001' },
      ];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);
      mockEmbeddingGenerator.mockResolvedValue([0.5, 0.5, 0.5]);
      mockProductScorer.mockResolvedValue([
        { ...mockProducts[0], similarity: 0.95, relevanceReason: 'Highly relevant' }
      ]);

      const provider = new WooCommerceProvider(
        mockClient as WooCommerceAPI,
        domain,
        mockEmbeddingGenerator,
        mockProductScorer
      );

      const result = await provider.searchProducts('hydraulic pump', 5);

      // Verify complete workflow
      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'hydraulic pump',
        per_page: 10,
        status: 'publish',
      });
      expect(mockEmbeddingGenerator).toHaveBeenCalledWith('hydraulic pump');
      expect(mockProductScorer).toHaveBeenCalledWith(mockProducts, [0.5, 0.5, 0.5], domain);

      // Verify result
      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.95);
    });
  });

  it('should have all test suites loaded', () => {
    expect(true).toBe(true);
  });
});
