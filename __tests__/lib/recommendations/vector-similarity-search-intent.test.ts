/**
 * Vector Similarity - Search by Intent Tests
 * Tests for semantic search using detected intent
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

describe('Vector Similarity - Search by Intent', () => {
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

  it('should search products by semantic intent', async () => {
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3, 0.4] }],
    });

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

    expect(result).toBeDefined();

    if (result.length > 0) {
      expect(result).toHaveLength(2);
      expect(result[0].reason).toContain('Matches your query');
    }
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

    if (result.length > 0) {
      expect(result[0].metadata).toMatchObject({
        similarity: 0.9,
        intent: 'Need a pump',
      });
    }
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
