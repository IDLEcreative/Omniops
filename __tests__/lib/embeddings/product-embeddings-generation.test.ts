/**
 * Product Embeddings - Generation Tests
 * Validates embedding generation for product text
 */

import { generateProductEmbedding } from '@/lib/embeddings/product-embeddings';
import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';
import { embeddingCache } from '@/lib/embedding-cache';
import { createMockEmbedding } from './helpers/embeddings-test-helpers';

// Mock the query-embedding module
jest.mock('@/lib/embeddings/query-embedding');

const mockGenerateQueryEmbedding = generateQueryEmbedding as jest.Mock;

describe('Product Embeddings - Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    embeddingCache.clear();
  });

  describe('generateProductEmbedding', () => {
    describe('Integration Tests', () => {
      it('generates valid embedding for product text', async () => {
        const productText = 'Hydraulic pump for industrial use';
        const mockEmbedding = createMockEmbedding(1536, 0.1);

        mockGenerateQueryEmbedding.mockResolvedValue(mockEmbedding);

        const result = await generateProductEmbedding(productText);

        expect(result).toEqual(mockEmbedding);
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(productText, false);
      });

      it('handles empty string', async () => {
        const productText = '';
        const mockEmbedding = createMockEmbedding(1536, 0.05);

        mockGenerateQueryEmbedding.mockResolvedValue(mockEmbedding);

        const result = await generateProductEmbedding(productText);

        expect(result).toEqual(mockEmbedding);
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith('', false);
      });

      it('passes through query embedding errors', async () => {
        const productText = 'Test product';
        const error = new Error('OpenAI API error');

        mockGenerateQueryEmbedding.mockRejectedValue(error);

        await expect(generateProductEmbedding(productText)).rejects.toThrow('OpenAI API error');
      });

      it('uses query embedding cache (disables enrichment)', async () => {
        const productText = 'Industrial pump';
        const mockEmbedding = createMockEmbedding(1536, 0.2);

        mockGenerateQueryEmbedding.mockResolvedValue(mockEmbedding);

        await generateProductEmbedding(productText);

        // Verify enrichWithIntent is false (uses cache)
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith(productText, false);
      });

      it('generates embeddings for multiple products efficiently', async () => {
        const products = [
          'Hydraulic pump A',
          'Hydraulic pump B',
          'Hydraulic pump C',
        ];

        mockGenerateQueryEmbedding.mockImplementation(async (text) => {
          return createMockEmbedding(1536, text.length / 100);
        });

        const embeddings = await Promise.all(
          products.map(p => generateProductEmbedding(p))
        );

        expect(embeddings).toHaveLength(3);
        expect(mockGenerateQueryEmbedding).toHaveBeenCalledTimes(3);
      });
    });
  });
});
