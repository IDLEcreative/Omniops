/**
 * Product Recommender - Core Functionality Tests
 *
 * Validates findSimilarProducts() basic operations: filtering, sorting,
 * limits, exclusions, and similarity thresholds.
 */

import { findSimilarProducts } from '@/lib/recommendations/product-recommender';
import {
  createMockProduct,
  createMockEmbeddingProvider,
} from './helpers/recommender-test-helpers';

describe('Product Recommender - Core Functionality', () => {
  describe('findSimilarProducts', () => {
    describe('basic functionality', () => {
      it('should find similar products above threshold (0.7)', async () => {
        const currentProduct = createMockProduct({ id: 1, name: 'Pump A' });
        const currentEmbedding = [1.0, 0.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Pump B', price: '420.00' }),
          createMockProduct({ id: 3, name: 'Pump C', price: '380.00' }),
          createMockProduct({ id: 4, name: 'Work Gloves', price: '10.00' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Pump B': [0.95, 0.1, 0.0],
          'Pump C': [0.8, 0.3, 0.0],
          'Work Gloves': [0.3, 0.7, 0.0]
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, minSimilarity: 0.7 }
        );

        expect(recommendations).toHaveLength(2);
        expect(recommendations[0].similarity).toBeGreaterThanOrEqual(0.7);
        expect(recommendations[1].similarity).toBeGreaterThanOrEqual(0.7);
      });

      it('should sort by similarity (highest first)', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Low Similarity' }),
          createMockProduct({ id: 3, name: 'High Similarity' }),
          createMockProduct({ id: 4, name: 'Medium Similarity' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Low Similarity': [0.8, 0.2],
          'High Similarity': [0.98, 0.05],
          'Medium Similarity': [0.9, 0.15],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations[0].name).toBe('High Similarity');
        expect(recommendations[1].name).toBe('Medium Similarity');
        expect(recommendations[2].name).toBe('Low Similarity');
      });

      it('should limit results to max count (3 by default)', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = Array.from({ length: 10 }, (_, i) =>
          createMockProduct({ id: i + 2, name: `Product ${i + 2}` })
        );

        const embeddingProvider = createMockEmbeddingProvider(
          Object.fromEntries(
            availableProducts.map(p => [p.name, [0.9, 0.1]])
          )
        );

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(3);
      });

      it('should respect custom limit', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = Array.from({ length: 10 }, (_, i) =>
          createMockProduct({ id: i + 2, name: `Product ${i + 2}` })
        );

        const embeddingProvider = createMockEmbeddingProvider(
          Object.fromEntries(
            availableProducts.map(p => [p.name, [0.9, 0.1]])
          )
        );

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, limit: 5 }
        );

        expect(recommendations).toHaveLength(5);
      });
    });

    describe('exclusion logic', () => {
      it('should exclude current product from recommendations', async () => {
        const currentProduct = createMockProduct({ id: 1, name: 'Pump A' });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 1, name: 'Pump A' }),
          createMockProduct({ id: 2, name: 'Pump B' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Pump A': [1.0, 0.0],
          'Pump B': [0.9, 0.1],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].id).toBe(2);
      });

      it('should exclude already-shown products (excludeIds)', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Product 2' }),
          createMockProduct({ id: 3, name: 'Product 3' }),
          createMockProduct({ id: 4, name: 'Product 4' }),
        ];

        const excludeIds = new Set([2, 4]);

        const embeddingProvider = createMockEmbeddingProvider(
          Object.fromEntries(
            availableProducts.map(p => [p.name, [0.9, 0.1]])
          )
        );

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, excludeIds }
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].id).toBe(3);
      });

      it('should return empty array when all products excluded', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Product 2' }),
          createMockProduct({ id: 3, name: 'Product 3' }),
        ];

        const excludeIds = new Set([2, 3]);
        const embeddingProvider = jest.fn();

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, excludeIds }
        );

        expect(recommendations).toHaveLength(0);
        expect(embeddingProvider).not.toHaveBeenCalled();
      });
    });

    describe('similarity thresholds', () => {
      it('should filter products below minSimilarity threshold', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'High' }),
          createMockProduct({ id: 3, name: 'Medium' }),
          createMockProduct({ id: 4, name: 'Low' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'High': [0.95, 0.1, 0.0],
          'Medium': [0.85, 0.2, 0.0],
          'Low': [0.65, 0.4, 0.0],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, minSimilarity: 0.7 }
        );

        expect(recommendations.every(r => r.similarity >= 0.7)).toBe(true);
        expect(recommendations.length).toBeGreaterThanOrEqual(2);
      });

      it('should use custom minSimilarity value', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Product 2' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Product 2': [0.4, 0.6],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider, minSimilarity: 0.8 }
        );

        expect(recommendations).toHaveLength(0);
      });

      it('should return empty array when no similar products', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Very Different' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Very Different': [0.1, 0.9],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(0);
      });
    });

    describe('error handling', () => {
      it('should handle embedding generation failures gracefully', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Success' }),
          createMockProduct({ id: 3, name: 'Failure' }),
          createMockProduct({ id: 4, name: 'Success 2' }),
        ];

        const embeddingProvider = jest.fn()
          .mockResolvedValueOnce([0.9, 0.1])
          .mockRejectedValueOnce(new Error('Embedding failed'))
          .mockResolvedValueOnce([0.85, 0.15]);

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations.length).toBeGreaterThanOrEqual(2);
      });

      it('should return empty array when all embeddings fail', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2 }),
          createMockProduct({ id: 3 }),
        ];

        const embeddingProvider = jest.fn()
          .mockRejectedValue(new Error('Embedding service down'));

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty available products array', async () => {
        const currentProduct = createMockProduct({ id: 1 });
        const currentEmbedding = [1.0, 0.0];

        const embeddingProvider = jest.fn();

        const recommendations = await findSimilarProducts(
          currentProduct,
          [],
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(0);
        expect(embeddingProvider).not.toHaveBeenCalled();
      });

      it('should handle products with identical embeddings (100% similarity)', async () => {
        const currentProduct = createMockProduct({ id: 1, name: 'Pump A' });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Pump A Duplicate' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Pump A Duplicate': [1.0, 0.0],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].similarity).toBeCloseTo(1.0, 2);
      });
    });
  });
});
