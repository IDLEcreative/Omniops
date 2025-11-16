/**
 * Product Embeddings - Similarity Scoring Tests
 * Validates scoreProductsBySimilarity() for product ranking and scoring
 */

import { scoreProductsBySimilarity } from '@/lib/embeddings/product-embeddings';
import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';
import { embeddingCache } from '@/lib/embedding-cache';
import { createMockEmbedding } from './helpers/embeddings-test-helpers';

// Mock the query-embedding module
jest.mock('@/lib/embeddings/query-embedding');

const mockGenerateQueryEmbedding = generateQueryEmbedding as jest.Mock;

describe('Product Embeddings - Similarity Scoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    embeddingCache.clear();
  });

  describe('scoreProductsBySimilarity', () => {
    describe('Integration Tests', () => {
      it('scores multiple products against a query', async () => {
        const products = [
          { id: 1, name: 'Hydraulic Pump A', short_description: 'Industrial pump' },
          { id: 2, name: 'Electric Motor', description: 'High efficiency motor' },
          { id: 3, name: 'Hydraulic Pump B', short_description: 'Heavy duty pump' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);

        mockGenerateQueryEmbedding
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.3))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5));

        const result = await scoreProductsBySimilarity(products, queryEmbedding);

        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('similarity');
        expect(result[0]).toHaveProperty('relevanceReason');
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
      });

      it('sorts products by similarity (highest first)', async () => {
        const products = [
          { id: 1, name: 'Low relevance', short_description: 'description' },
          { id: 2, name: 'High relevance', short_description: 'description' },
          { id: 3, name: 'Medium relevance', short_description: 'description' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);

        mockGenerateQueryEmbedding
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.1))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.3));

        const result = await scoreProductsBySimilarity(products, queryEmbedding);

        expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity);
        expect(result[1].similarity).toBeGreaterThanOrEqual(result[2].similarity);
      });

      it('verifies similarity scores are in valid range [0, 1]', async () => {
        const products = [
          { id: 1, name: 'Product A', description: 'Description A' },
          { id: 2, name: 'Product B', description: 'Description B' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);

        mockGenerateQueryEmbedding
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.3));

        const result = await scoreProductsBySimilarity(products, queryEmbedding);

        result.forEach(product => {
          expect(product.similarity).toBeGreaterThanOrEqual(0);
          expect(product.similarity).toBeLessThanOrEqual(1);
        });
      });

      it('sets correct relevance reasons based on similarity thresholds', async () => {
        const products = [
          { id: 1, name: 'Highly relevant', description: 'desc' },
          { id: 2, name: 'Moderately relevant', description: 'desc' },
          { id: 3, name: 'Loosely related', description: 'desc' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);

        mockGenerateQueryEmbedding.mockResolvedValueOnce(
          queryEmbedding.slice()
        );

        const mediumVector = new Array(1536).fill(0);
        for (let i = 0; i < 1536; i++) {
          mediumVector[i] = i < 920 ? 0.5 : 0.0;
        }
        mockGenerateQueryEmbedding.mockResolvedValueOnce(mediumVector);

        const lowVector = new Array(1536).fill(0);
        for (let i = 0; i < 1536; i++) {
          lowVector[i] = i < 460 ? 0.5 : 0.0;
        }
        mockGenerateQueryEmbedding.mockResolvedValueOnce(lowVector);

        const result = await scoreProductsBySimilarity(products, queryEmbedding);

        const highRelevance = result.find(p => p.id === 1);
        const mediumRelevance = result.find(p => p.id === 2);
        const lowRelevance = result.find(p => p.id === 3);

        expect(highRelevance?.relevanceReason).toBe('Highly relevant');
        expect(highRelevance?.similarity).toBeGreaterThan(0.8);

        expect(mediumRelevance?.relevanceReason).toBe('Moderately relevant');
        expect(mediumRelevance?.similarity).toBeGreaterThan(0.6);
        expect(mediumRelevance?.similarity).toBeLessThanOrEqual(0.8);

        expect(lowRelevance?.relevanceReason).toBe('Loosely related');
        expect(lowRelevance?.similarity).toBeLessThanOrEqual(0.6);
      });

      it('combines product name and description for embedding', async () => {
        const product = {
          id: 1,
          name: 'Hydraulic Pump',
          short_description: 'Industrial grade',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        await scoreProductsBySimilarity([product], queryEmbedding);

        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(
          'Hydraulic Pump Industrial grade',
          false
        );
      });

      it('uses description field when short_description is missing', async () => {
        const product = {
          id: 1,
          name: 'Electric Motor',
          description: 'Full description here',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        await scoreProductsBySimilarity([product], queryEmbedding);

        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(
          'Electric Motor Full description here',
          false
        );
      });

      it('handles products with only name (no description)', async () => {
        const product = {
          id: 1,
          name: 'Product Name Only',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        await scoreProductsBySimilarity([product], queryEmbedding);

        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith('Product Name Only', false);
      });

      it('handles empty product array', async () => {
        const products: Array<{ name: string; description?: string }> = [];
        const queryEmbedding = createMockEmbedding(1536, 0.5);

        const result = await scoreProductsBySimilarity(products, queryEmbedding);

        expect(result).toEqual([]);
        expect(mockGenerateQueryEmbedding).not.toHaveBeenCalled();
      });

      it('preserves all original product properties', async () => {
        const product = {
          id: 123,
          name: 'Test Product',
          short_description: 'Short desc',
          price: 99.99,
          sku: 'SKU-001',
          customField: 'custom value',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        const result = await scoreProductsBySimilarity([product], queryEmbedding);

        expect(result[0]).toMatchObject({
          id: 123,
          name: 'Test Product',
          short_description: 'Short desc',
          price: 99.99,
          sku: 'SKU-001',
          customField: 'custom value',
          similarity: expect.any(Number),
          relevanceReason: expect.any(String),
        });
      });
    });

    describe('Edge Cases', () => {
      it('handles products with very long descriptions', async () => {
        const longDescription = 'A'.repeat(10000);
        const product = {
          id: 1,
          name: 'Product',
          description: longDescription,
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        const result = await scoreProductsBySimilarity([product], queryEmbedding);

        expect(result).toHaveLength(1);
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(
          expect.stringContaining(longDescription),
          false
        );
      });

      it('handles products with special characters in text', async () => {
        const product = {
          id: 1,
          name: 'Product™ with © symbols',
          description: 'Description with émojis 🚀 and spëcial çharacters',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        const result = await scoreProductsBySimilarity([product], queryEmbedding);

        expect(result).toHaveLength(1);
        expect(result[0].name).toContain('™');
        expect(result[0].description).toContain('🚀');
      });

      it('handles products with HTML in descriptions', async () => {
        const product = {
          id: 1,
          name: 'Product',
          description: '<p>HTML <strong>content</strong> here</p>',
        };

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        mockGenerateQueryEmbedding.mockResolvedValue(createMockEmbedding(1536, 0.5));

        const result = await scoreProductsBySimilarity([product], queryEmbedding);

        expect(result).toHaveLength(1);
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(
          expect.stringContaining('<p>'),
          false
        );
      });
    });

    describe('Error Handling', () => {
      it('propagates embedding generation errors', async () => {
        const products = [
          { id: 1, name: 'Product', description: 'Description' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);
        const error = new Error('Embedding generation failed');
        mockGenerateQueryEmbedding.mockRejectedValue(error);

        await expect(
          scoreProductsBySimilarity(products, queryEmbedding)
        ).rejects.toThrow('Embedding generation failed');
      });

      it('fails fast if one product embedding fails', async () => {
        const products = [
          { id: 1, name: 'Product 1', description: 'Desc 1' },
          { id: 2, name: 'Product 2', description: 'Desc 2' },
          { id: 3, name: 'Product 3', description: 'Desc 3' },
        ];

        const queryEmbedding = createMockEmbedding(1536, 0.5);

        mockGenerateQueryEmbedding
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5))
          .mockRejectedValueOnce(new Error('API error'))
          .mockResolvedValueOnce(createMockEmbedding(1536, 0.5));

        await expect(
          scoreProductsBySimilarity(products, queryEmbedding)
        ).rejects.toThrow('API error');
      });
    });
  });
});
