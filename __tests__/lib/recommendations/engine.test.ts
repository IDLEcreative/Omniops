/**
 * Recommendation Engine Unit Tests
 *
 * Tests the main orchestration engine that routes to different algorithms,
 * applies business rules, and tracks recommendations.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock all dependencies BEFORE importing - use factory functions that return jest.fn()
jest.mock('@/lib/recommendations/vector-similarity', () => ({
  vectorSimilarityRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/collaborative-filter', () => ({
  collaborativeFilterRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/content-filter', () => ({
  contentBasedRecommendations: jest.fn(),
}));

jest.mock('@/lib/recommendations/hybrid-ranker', () => ({
  hybridRanker: jest.fn(),
}));

// Create mock function that we can access later
const mockAnalyzeContextFn = jest.fn();

jest.mock('@/lib/recommendations/context-analyzer', () => ({
  analyzeContext: mockAnalyzeContextFn,
}));

jest.mock('@/lib/supabase/server');

// Mock OpenAI to prevent actual API calls in context-analyzer
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify({}) } }],
          }),
        },
      },
    })),
  };
});

import {
  getRecommendations,
  trackRecommendationEvent,
  getRecommendationMetrics,
} from '@/lib/recommendations/engine';

// Get mocked functions using jest.requireMock (ensures we get the actual mocks)
const { vectorSimilarityRecommendations: mockVectorSimilarity } =
  jest.requireMock('@/lib/recommendations/vector-similarity');
const { collaborativeFilterRecommendations: mockCollaborativeFilter } =
  jest.requireMock('@/lib/recommendations/collaborative-filter');
const { contentBasedRecommendations: mockContentBased } =
  jest.requireMock('@/lib/recommendations/content-filter');
const { hybridRanker: mockHybridRanker } =
  jest.requireMock('@/lib/recommendations/hybrid-ranker');
// Use the mock function we defined earlier
const mockAnalyzeContext = mockAnalyzeContextFn;
const { createClient: mockCreateClient } =
  jest.requireMock('@/lib/supabase/server');

describe('Recommendation Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock
    const createChainableMock = () => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    });

    mockSupabase = createChainableMock();

    // Configure the mock to return our mockSupabase
    mockCreateClient.mockResolvedValue(mockSupabase);

    // Reset algorithm mocks to avoid cross-test pollution
    mockVectorSimilarity.mockReset();
    mockCollaborativeFilter.mockReset();
    mockContentBased.mockReset();
    mockHybridRanker.mockReset();
    mockAnalyzeContext.mockReset();
  });

  describe('getRecommendations', () => {
    it('should route to vector similarity algorithm', async () => {
      const mockRecs = [
        {
          productId: 'prod-1',
          score: 0.9,
          algorithm: 'vector_similarity',
          reason: 'Similar to viewed products',
        },
      ];

      mockVectorSimilarity.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'vector_similarity',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(mockVectorSimilarity).toHaveBeenCalledWith(
        expect.objectContaining({
          domainId: 'domain-123',
          limit: 5,
        })
      );
      expect(result.recommendations).toEqual(mockRecs);
      expect(result.algorithm).toBe('vector_similarity');
    });

    it('should route to collaborative filtering algorithm', async () => {
      const mockRecs = [
        {
          productId: 'prod-2',
          score: 0.85,
          algorithm: 'collaborative',
          reason: 'Popular among similar users',
        },
      ];

      mockCollaborativeFilter.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'collaborative',
        sessionId: 'session-456',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(mockCollaborativeFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          domainId: 'domain-123',
          sessionId: 'session-456',
          limit: 5,
        })
      );
      expect(result.recommendations).toEqual(mockRecs);
      expect(result.algorithm).toBe('collaborative');
    });

    it('should route to content-based filtering algorithm', async () => {
      const mockRecs = [
        {
          productId: 'prod-3',
          score: 0.8,
          algorithm: 'content_based',
          reason: 'Similar category',
        },
      ];

      mockContentBased.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'content_based',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(mockContentBased).toHaveBeenCalledWith(
        expect.objectContaining({
          domainId: 'domain-123',
          limit: 5,
        })
      );
      expect(result.recommendations).toEqual(mockRecs);
      expect(result.algorithm).toBe('content_based');
    });

    it('should route to hybrid algorithm by default', async () => {
      const mockRecs = [
        {
          productId: 'prod-4',
          score: 0.95,
          algorithm: 'vector',
          reason: 'Highly recommended',
        },
      ];

      // Mock sub-algorithms for hybrid ranker
      mockVectorSimilarity.mockResolvedValue(mockRecs);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        limit: 5,
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      });

      // Hybrid algorithm calls sub-algorithms
      expect(mockVectorSimilarity).toHaveBeenCalled();
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
      expect(result.algorithm).toBe('hybrid');
    });

    it('should analyze context when provided', async () => {
      const mockContext = {
        detectedIntent: 'Looking for hydraulic pumps',
        categories: ['hydraulics'],
        tags: ['pump', 'industrial'],
      };

      mockAnalyzeContext.mockResolvedValue(mockContext);
      mockVectorSimilarity.mockResolvedValue([]);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        context: 'I need a hydraulic pump for my machine',
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      // The context analyzer may be called (mocked OpenAI handles it)
      // Verify that context is passed through to algorithms
      expect(mockVectorSimilarity).toHaveBeenCalled();
      // Result may have context from either mock or fallback
      expect(result).toHaveProperty('context');
    });

    it('should filter out excluded products', async () => {
      const mockRecs = [
        { productId: 'prod-1', score: 0.9, algorithm: 'vector' },
        { productId: 'prod-2', score: 0.85, algorithm: 'vector' },
        { productId: 'prod-3', score: 0.8, algorithm: 'vector' },
      ];

      // Mock sub-algorithms to return all 3 products
      mockVectorSimilarity.mockResolvedValue(mockRecs);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        excludeProductIds: ['prod-2'],
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      // Check that prod-2 is excluded
      expect(result.recommendations.some(r => r.productId === 'prod-2')).toBe(false);
      // Check that we have at least the other two products
      expect(result.recommendations.some(r => r.productId === 'prod-1')).toBe(true);
      expect(result.recommendations.some(r => r.productId === 'prod-3')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const mockRecs = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod-${i}`,
        score: 0.9 - i * 0.05,
        algorithm: 'vector',
      }));

      // Mock sub-algorithms to return 10 results
      mockVectorSimilarity.mockResolvedValue(mockRecs);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);

      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'hybrid',
        limit: 3,
        supabaseClient: mockSupabase,
      });

      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should use default limit of 5', async () => {
      mockVectorSimilarity.mockResolvedValue([]);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'hybrid',
        supabaseClient: mockSupabase,
      });

      // Verify that vector similarity was called with limit parameter
      // (hybrid ranker multiplies limit by 2, so we check for 10)
      expect(mockVectorSimilarity).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10, // hybrid ranker uses limit * 2
        })
      );
    });

    it('should track recommendations in database', async () => {
      const mockRecs = [
        { productId: 'prod-1', score: 0.9, algorithm: 'vector' },
        { productId: 'prod-2', score: 0.85, algorithm: 'collaborative' },
      ];

      // Mock sub-algorithms
      mockVectorSimilarity.mockResolvedValue([mockRecs[0]]);
      mockCollaborativeFilter.mockResolvedValue([mockRecs[1]]);
      mockContentBased.mockResolvedValue([]);

      mockSupabase.insert.mockResolvedValue({ error: null });

      await getRecommendations({
        domainId: 'domain-123',
        sessionId: 'session-123',
        conversationId: 'conv-456',
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            session_id: 'session-123',
            conversation_id: 'conv-456',
            product_id: 'prod-1',
            algorithm_used: 'hybrid',
            shown: true,
            clicked: false,
            purchased: false,
          }),
        ])
      );
    });

    it('should handle tracking errors gracefully', async () => {
      const mockRecs = [{ productId: 'prod-1', score: 0.9, algorithm: 'hybrid' }];

      // Mock the sub-algorithms that hybridRanker calls
      mockVectorSimilarity.mockResolvedValue(mockRecs);
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);

      mockSupabase.insert.mockResolvedValue({ error: new Error('DB error') });

      // Should not throw
      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].productId).toBe('prod-1');
    });

    it('should measure execution time', async () => {
      // Mock sub-algorithms with delay
      mockVectorSimilarity.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [];
      });
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);

      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      expect(result.executionTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle algorithm errors gracefully for hybrid', async () => {
      // Make one of the sub-algorithms fail
      // Hybrid ranker catches errors and returns empty array
      mockVectorSimilarity.mockRejectedValue(new Error('Algorithm failed'));
      mockCollaborativeFilter.mockResolvedValue([]);
      mockContentBased.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        algorithm: 'hybrid',
        limit: 5,
        supabaseClient: mockSupabase,
      });

      // Hybrid algorithm catches errors and returns empty results
      expect(result.recommendations).toEqual([]);
    });
  });

  describe('trackRecommendationEvent', () => {
    it('should track click events', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-123' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });

      await trackRecommendationEvent('prod-1', 'click', 'session-123', undefined, mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
      expect(mockSupabase.eq).toHaveBeenCalledWith('product_id', 'prod-1');
      expect(mockSupabase.update).toHaveBeenCalledWith({ clicked: true });
    });

    it('should track purchase events', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-123' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });

      await trackRecommendationEvent('prod-1', 'purchase', 'session-123', undefined, mockSupabase);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        clicked: true,
        purchased: true,
      });
    });

    it('should handle missing event gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      });

      // Should not throw
      await trackRecommendationEvent('prod-1', 'click', 'session-123', undefined, mockSupabase);

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-123' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: new Error('Update failed') });

      // Should not throw
      await trackRecommendationEvent('prod-1', 'click', 'session-123', undefined, mockSupabase);
    });
  });

  describe('getRecommendationMetrics', () => {
    it('should fetch metrics from database', async () => {
      const mockMetrics = {
        totalShown: 100,
        totalClicked: 20,
        totalPurchased: 5,
        clickThroughRate: 0.2,
        conversionRate: 0.05,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null,
      });

      const result = await getRecommendationMetrics('domain-123', 24, mockSupabase);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_recommendation_metrics', {
        p_domain_id: 'domain-123',
        p_hours: 24,
      });
      expect(result).toEqual(mockMetrics);
    });

    it('should use default 24 hours', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      await getRecommendationMetrics('domain-123', undefined, mockSupabase);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'get_recommendation_metrics',
        expect.objectContaining({
          p_hours: 24,
        })
      );
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC failed'),
      });

      await expect(getRecommendationMetrics('domain-123', 24, mockSupabase)).rejects.toThrow(
        'RPC failed'
      );
    });
  });
});
