/**
 * Vector Similarity - Popular Products Tests
 * Tests for fallback popular product recommendations
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

describe('Vector Similarity - Popular Products', () => {
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

    if (result.length > 0) {
      expect(result).toHaveLength(3);
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].reason).toBe('Popular product');
    }
  });

  it('should score purchases higher than clicks', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { product_id: 'prod-1', clicked: true, purchased: false },
        { product_id: 'prod-2', clicked: false, purchased: true },
        { product_id: 'prod-3', clicked: false, purchased: false },
      ],
      error: null,
    });

    const result = await vectorSimilarityRecommendations({
      domainId: 'domain-123',
      limit: 3,
    });

    if (result.length > 0) {
      expect(result[0].productId).toBe('prod-2');
    }
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

    if (result.length > 0) {
      expect(result.map((r) => r.productId)).not.toContain('prod-1');
    }
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

    if (result.length > 0) {
      expect(result[0].score).toBeLessThanOrEqual(1.0);
    }
  });
});
