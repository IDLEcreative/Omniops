/**
 * Product Recommender - Recommendation Reasons Tests
 *
 * Validates recommendation reason generation based on similarity scores,
 * shared categories, and price ranges.
 */

import { findSimilarProducts } from '@/lib/recommendations/product-recommender';
import {
  createMockProduct,
  createMockEmbeddingProvider,
} from './helpers/recommender-test-helpers';

describe('Product Recommender - Recommendation Reasons', () => {
  describe('findSimilarProducts', () => {
    describe('recommendation reasons', () => {
      it('should provide "Very similar product" for >0.85 similarity', async () => {
        const currentProduct = createMockProduct({ id: 1, name: 'Pump A' });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Pump B', categories: [] }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Pump B': [0.98, 0.05],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations[0].recommendationReason).toBe('Very similar product');
      });

      it('should include category name when products share category (>0.85)', async () => {
        const currentProduct = createMockProduct({
          id: 1,
          categories: [{ name: 'Hydraulic Pumps', slug: 'hydraulic-pumps' }]
        });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({
            id: 2,
            name: 'Pump B',
            categories: [{ name: 'Hydraulic Pumps', slug: 'hydraulic-pumps' }]
          }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Pump B': [0.95, 0.1],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations[0].recommendationReason).toContain('hydraulic pumps');
      });

      it('should generate appropriate reason for similar prices in 0.75-0.85 range', async () => {
        const currentProduct = createMockProduct({
          id: 1,
          price: '100.00',
          categories: []
        });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({
            id: 2,
            name: 'Similar Price Product',
            price: '110.00',
            categories: []
          }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Similar Price Product': [0.80, 0.35],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].recommendationReason).toBeDefined();
        expect(recommendations[0].similarity).toBeGreaterThanOrEqual(0.7);
      });

      it('should mention category in reason when products share category', async () => {
        const currentProduct = createMockProduct({
          id: 1,
          price: '100.00',
          categories: [{ name: 'Parts', slug: 'parts' }]
        });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({
            id: 2,
            name: 'Another Part',
            price: '500.00',
            categories: [{ name: 'Parts', slug: 'parts' }]
          }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Another Part': [0.70, 0.45],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].recommendationReason.toLowerCase()).toContain('parts');
        expect(recommendations[0].similarity).toBeGreaterThanOrEqual(0.7);
      });

      it('should handle products without categories', async () => {
        const currentProduct = createMockProduct({
          id: 1,
          categories: undefined
        });
        const currentEmbedding = [1.0, 0.0];

        const availableProducts = [
          createMockProduct({ id: 2, name: 'Uncategorized', categories: undefined }),
        ];

        const embeddingProvider = createMockEmbeddingProvider({
          'Uncategorized': [0.95, 0.1],
        });

        const recommendations = await findSimilarProducts(
          currentProduct,
          availableProducts,
          currentEmbedding,
          { embeddingProvider }
        );

        expect(recommendations[0].recommendationReason).toBeDefined();
      });
    });
  });
});
