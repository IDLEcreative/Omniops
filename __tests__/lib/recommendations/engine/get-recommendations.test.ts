/**
 * getRecommendations Function Tests
 *
 * Tests routing to different algorithms, parameter handling, and database tracking.
 */

// Setup mocks BEFORE importing code under test
import './setup-mocks';

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getRecommendations } from '@/lib/recommendations/engine';
import {
  createMockRecommendations,
  createGetRecommendationsParams,
} from '__tests__/utils/recommendations/test-fixtures';
import {
  createMockSupabaseClient,
  getAlgorithmMocks,
  resetAlgorithmMocks,
} from '__tests__/utils/recommendations/mock-setup';

describe('getRecommendations', () => {
  let mockSupabase: any;
  let mocks: any;
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mocks = getAlgorithmMocks();
    resetAlgorithmMocks();
    mockSupabase.insert.mockResolvedValue({ error: null });
  });

  it('should route to vector similarity algorithm', async () => {
    const mockRecs = [{
      productId: 'prod-1',
      score: 0.9,
      algorithm: 'vector_similarity',
      reason: 'Similar to viewed products',
    }];
    mocks.vectorSimilarity.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'vector_similarity',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.vectorSimilarity).toHaveBeenCalledWith(
      expect.objectContaining({ domainId: 'domain-123', limit: 5 })
    );
    expect(result.recommendations).toEqual(mockRecs);
    expect(result.algorithm).toBe('vector_similarity');
  });

  it('should route to collaborative filtering algorithm', async () => {
    const mockRecs = [{
      productId: 'prod-2',
      score: 0.85,
      algorithm: 'collaborative',
      reason: 'Popular among similar users',
    }];
    mocks.collaborativeFilter.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'collaborative',
        sessionId: 'session-456',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.collaborativeFilter).toHaveBeenCalledWith(
      expect.objectContaining({ domainId: 'domain-123', sessionId: 'session-456', limit: 5 })
    );
    expect(result.recommendations).toEqual(mockRecs);
    expect(result.algorithm).toBe('collaborative');
  });

  it('should route to content-based filtering algorithm', async () => {
    const mockRecs = [{
      productId: 'prod-3',
      score: 0.8,
      algorithm: 'content_based',
      reason: 'Similar category',
    }];
    mocks.contentBased.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'content_based',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.contentBased).toHaveBeenCalledWith(
      expect.objectContaining({ domainId: 'domain-123', limit: 5 })
    );
    expect(result.recommendations).toEqual(mockRecs);
    expect(result.algorithm).toBe('content_based');
  });

  it('should route to hybrid algorithm by default', async () => {
    const mockRecs = createMockRecommendations(1);
    mocks.hybridRanker.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.hybridRanker).toHaveBeenCalled();
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    expect(result.algorithm).toBe('hybrid');
  });

  it('should analyze context when provided', async () => {
    mocks.hybridRanker.mockResolvedValue([]);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        context: 'I need a hydraulic pump for my machine',
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.hybridRanker).toHaveBeenCalled();
    expect(result).toHaveProperty('context');
  });

  it('should filter out excluded products', async () => {
    const mockRecs = createMockRecommendations(3);
    mocks.hybridRanker.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        excludeProductIds: ['prod-2'],
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(result.recommendations.some((r) => r.productId === 'prod-2')).toBe(false);
    expect(result.recommendations.some((r) => r.productId === 'prod-1')).toBe(true);
    expect(result.recommendations.some((r) => r.productId === 'prod-3')).toBe(true);
  });

  it('should respect limit parameter', async () => {
    const mockRecs = createMockRecommendations(10);
    mocks.hybridRanker.mockResolvedValue(mockRecs);
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'hybrid',
        limit: 3,
        supabaseClient: mockSupabase,
      }),
    });
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('should use default limit of 5', async () => {
    mocks.hybridRanker.mockResolvedValue([]);
    await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mocks.hybridRanker).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 })
    );
  });

  it('should track recommendations in database', async () => {
    const mockRecs = [
      { productId: 'prod-1', score: 0.9, algorithm: 'vector' },
      { productId: 'prod-2', score: 0.85, algorithm: 'collaborative' },
    ];
    mocks.hybridRanker.mockResolvedValue(mockRecs);
    await getRecommendations({
      ...createGetRecommendationsParams({
        sessionId: 'session-123',
        conversationId: 'conv-456',
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          session_id: 'session-123',
          conversation_id: 'conv-456',
          product_id: 'prod-1',
          algorithm_used: 'vector',
          shown: true,
        }),
      ])
    );
  });

  it('should handle tracking errors gracefully', async () => {
    const mockRecs = createMockRecommendations(1);
    mocks.hybridRanker.mockResolvedValue(mockRecs);
    mockSupabase.insert.mockResolvedValue({ error: new Error('DB error') });
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0].productId).toBe('prod-1');
  });

  it('should measure execution time', async () => {
    mocks.hybridRanker.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [];
    });
    const result = await getRecommendations({
      ...createGetRecommendationsParams({
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      }),
    });
    expect(result.executionTime).toBeGreaterThanOrEqual(100);
  });

  it('should handle algorithm errors gracefully for hybrid', async () => {
    mocks.hybridRanker.mockRejectedValue(new Error('Algorithm failed'));
    await expect(
      getRecommendations({
        ...createGetRecommendationsParams({
          algorithm: 'hybrid',
          supabaseClient: mockSupabase,
        }),
      })
    ).rejects.toThrow('Algorithm failed');
  });
});
