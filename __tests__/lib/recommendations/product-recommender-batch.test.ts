/**
 * Product Recommender - Batch Processing Tests
 *
 * Validates findRecommendationsForProducts() for batch recommendation
 * generation with caching and error handling.
 */

import { findRecommendationsForProducts } from '@/lib/recommendations/product-recommender';
import {
  createMockProduct,
  createMockEmbeddingProvider,
} from './helpers/recommender-test-helpers';

describe('Product Recommender - Batch Processing', () => {
  describe('findRecommendationsForProducts', () => {
    describe('batch processing', () => {
      it('should generate recommendations for multiple products', async () => {
        const products = [
          createMockProduct({ id: 1, name: 'Product 1' }),
          createMockProduct({ id: 2, name: 'Product 2' }),
        ];

        const allProducts = [
          ...products,
          createMockProduct({ id: 3, name: 'Product 3' }),
          createMockProduct({ id: 4, name: 'Product 4' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Product 1': [1.0, 0.0],
          'Product 2': [0.9, 0.1],
          'Product 3': [0.85, 0.15],
          'Product 4': [0.8, 0.2],
        });

        const recommendations = await findRecommendationsForProducts(
          products,
          allProducts,
          { embeddingProvider }
        );

        expect(recommendations.size).toBe(2);
        expect(recommendations.has(1)).toBe(true);
        expect(recommendations.has(2)).toBe(true);
      });

      it('should return Map with product ID → recommendations', async () => {
        const products = [
          createMockProduct({ id: 1, name: 'Product 1' }),
        ];

        const allProducts = [
          createMockProduct({ id: 1, name: 'Product 1' }),
          createMockProduct({ id: 2, name: 'Product 2' }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Product 1': [1.0, 0.0],
          'Product 2': [0.9, 0.1],
        });

        const recommendations = await findRecommendationsForProducts(
          products,
          allProducts,
          { embeddingProvider }
        );

        expect(recommendations instanceof Map).toBe(true);
        const product1Recs = recommendations.get(1);
        expect(Array.isArray(product1Recs)).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle empty products array', async () => {
        const embeddingProvider = jest.fn();

        const recommendations = await findRecommendationsForProducts(
          [],
          [createMockProduct({ id: 1 })],
          { embeddingProvider }
        );

        expect(recommendations.size).toBe(0);
      });

      it('should handle embedding generation failures for some products', async () => {
        const products = [
          createMockProduct({ id: 1, name: 'Product 1' }),
          createMockProduct({ id: 2, name: 'Product 2' }),
        ];

        const allProducts = [
          createMockProduct({ id: 1, name: 'Product 1' }),
          createMockProduct({ id: 2, name: 'Product 2' }),
          createMockProduct({ id: 3, name: 'Product 3' }),
        ];

        const embeddingProvider = jest.fn()
          .mockResolvedValueOnce([1.0, 0.0])
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce([0.9, 0.1]);

        const recommendations = await findRecommendationsForProducts(
          products,
          allProducts,
          { embeddingProvider }
        );

        expect(recommendations.get(2)).toEqual([]);
      });

      it('should skip recommendations when product has no embedding', async () => {
        const products = [
          createMockProduct({ id: 1, name: 'Product 1' }),
        ];

        const allProducts = [
          createMockProduct({ id: 1, name: 'Product 1' }),
          createMockProduct({ id: 2, name: 'Product 2' }),
        ];

        const embeddingProvider = jest.fn()
          .mockRejectedValue(new Error('Embedding service down'));

        const recommendations = await findRecommendationsForProducts(
          products,
          allProducts,
          { embeddingProvider }
        );

        expect(recommendations.get(1)).toEqual([]);
      });
    });
  });
});
