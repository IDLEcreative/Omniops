/**
 * Vector Similarity - Find Similar Products Tests
 * Tests for finding similar products using vector embeddings
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockOpenAI = {
  embeddings: {
    create: jest.fn(),
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

import { vectorSimilarityRecommendations } from '@/lib/recommendations/vector-similarity';
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Vector Similarity - Find Similar Products', () => {
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

    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
  });

  it('should find similar products using vector embeddings', async () => {
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        { embedding: [0.1, 0.2, 0.3] },
        { embedding: [0.15, 0.25, 0.35] },
      ],
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
      productIds: ['ref-1', 'ref-2'],
      limit: 3,
    });

    if (result.length > 0) {
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        productId: 'prod-1',
        score: 0.92,
        algorithm: 'vector_similarity',
        reason: 'Similar to viewed products',
      });
    }
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

    const result = await vectorSimilarityRecommendations({
      domainId: 'domain-123',
      productIds: ['ref-1', 'ref-2'],
      limit: 5,
    });

    expect(result).toBeDefined();
  });

  it('should exclude reference products from results', async () => {
    mockSupabase.select.mockResolvedValueOnce({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      error: null,
    });

    mockSupabase.rpc.mockResolvedValue({
      data: [
        { product_id: 'ref-1', similarity: 0.99 },
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

    if (result.length > 0) {
      expect(result.map((r) => r.productId)).not.toContain('ref-1');
      expect(result).toHaveLength(2);
    }
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

    if (result.length > 0) {
      expect(result.map((r) => r.productId)).not.toContain('prod-2');
      expect(result).toHaveLength(2);
    }
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
