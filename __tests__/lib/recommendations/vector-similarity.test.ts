/**
 * Vector Similarity Algorithm Unit Tests
 *
 * Tests semantic search using product embeddings and cosine similarity.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
const mockOpenAI = {
  embeddings: {
    create: jest.fn(),
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

// Import createClient from the mocked module (manual mock is automatically loaded)
import { vectorSimilarityRecommendations } from '@/lib/recommendations/vector-similarity';
import { createClient } from '@/lib/supabase/server';

// Type the mocked function
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Vector Similarity Recommendations', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      rpc: jest.fn(),
    };

    // Reset and configure the mock
    mockCreateClient.mockReset();
    // Use jest.requireMock to get the mocked module and configure it
    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
  });

  describe('findSimilarProducts', () => {
    it('should find similar products using vector embeddings', async () => {
      // Mock reference embeddings
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.15, 0.25, 0.35] },
        ],
        error: null,
      });

      // Mock similar products
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { product_id: 'prod-1', similarity: 0.92 },
          { product_id: 'prod-2', similarity: 0.88 },
          { product_id: 'prod-3', similarity: 0.85 },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1', 'ref-2'],
        limit: 3,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('product_embeddings');
      expect(mockSupabase.in).toHaveBeenCalledWith('product_id', ['ref-1', 'ref-2']);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('match_products', {
        query_embedding: expect.any(Array),
        match_threshold: 0.7,
        match_count: 3,
        p_domain_id: 'domain-123',
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        productId: 'prod-1',
        score: 0.92,
        algorithm: 'vector_similarity',
        reason: 'Similar to viewed products',
      });
    });

    it('should average multiple reference embeddings', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { embedding: [1.0, 0.0, 0.0] },
          { embedding: [0.0, 1.0, 0.0] },
        ],
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1', 'ref-2'],
        limit: 5,
      });

      // Check that averaged embedding is passed to match_products
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'match_products',
        expect.objectContaining({
          query_embedding: [0.5, 0.5, 0.0], // Average of the two
        })
      );
    });

    it('should exclude reference products from results', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { product_id: 'ref-1', similarity: 0.99 }, // Should be filtered out
          { product_id: 'prod-1', similarity: 0.92 },
          { product_id: 'prod-2', similarity: 0.88 },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('ref-1');
      expect(result).toHaveLength(2);
    });

    it('should exclude specified products', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [
          { product_id: 'prod-1', similarity: 0.92 },
          { product_id: 'prod-2', similarity: 0.88 },
          { product_id: 'prod-3', similarity: 0.85 },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        excludeProductIds: ['prod-2'],
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('prod-2');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no reference embeddings found', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result).toEqual([]);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('DB error'),
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('searchByIntent', () => {
    it('should search products by semantic intent', async () => {
      // Mock embedding generation
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3, 0.4] }],
      });

      // Mock search results
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { product_id: 'prod-1', similarity: 0.85 },
          { product_id: 'prod-2', similarity: 0.82 },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        context: {
          detectedIntent: 'Looking for hydraulic pumps',
        },
        limit: 5,
      });

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'Looking for hydraulic pumps',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('match_products', {
        query_embedding: [0.1, 0.2, 0.3, 0.4],
        match_threshold: 0.65,
        match_count: 5,
        p_domain_id: 'domain-123',
      });

      expect(result).toHaveLength(2);
      expect(result[0].reason).toContain('Matches your query');
    });

    it('should include intent in metadata', async () => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [{ product_id: 'prod-1', similarity: 0.9 }],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        context: {
          detectedIntent: 'Need a pump',
        },
        limit: 5,
      });

      expect(result[0].metadata).toMatchObject({
        similarity: 0.9,
        intent: 'Need a pump',
      });
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('OpenAI error'));

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        context: {
          detectedIntent: 'Looking for products',
        },
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('getPopularProducts', () => {
    it('should return popular products as fallback', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: true },
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
          { product_id: 'prod-3', clicked: false, purchased: false },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        limit: 3,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
      expect(result).toHaveLength(3);

      // prod-1 should be first (has purchase + click)
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].reason).toBe('Popular product');
    });

    it('should score purchases higher than clicks', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false }, // Score: 2
          { product_id: 'prod-2', clicked: false, purchased: true }, // Score: 3
          { product_id: 'prod-3', clicked: false, purchased: false }, // Score: 1
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        limit: 3,
      });

      // prod-2 should be first (has purchase)
      expect(result[0].productId).toBe('prod-2');
    });

    it('should exclude specified products from popular', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: true },
          { product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        excludeProductIds: ['prod-1'],
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('prod-1');
    });

    it('should handle empty recommendation_events table', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('embedding utilities', () => {
    it('should normalize popularity scores to 0-1 range', async () => {
      mockSupabase.select.mockResolvedValue({
        data: Array.from({ length: 20 }, () => ({
          product_id: 'prod-1',
          clicked: true,
          purchased: true,
        })),
        error: null,
      });

      const result = await vectorSimilarityRecommendations({
        domainId: 'domain-123',
        limit: 1,
      });

      // Score should be normalized (60 raw / 10 = 6, capped at 1.0)
      expect(result[0].score).toBeLessThanOrEqual(1.0);
    });
  });
});
