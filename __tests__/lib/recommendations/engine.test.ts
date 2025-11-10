/**
 * Recommendation Engine Unit Tests
 *
 * Tests the main orchestration engine that routes to different algorithms,
 * applies business rules, and tracks recommendations.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
const mockVectorSimilarity = jest.fn();
const mockCollaborativeFilter = jest.fn();
const mockContentBased = jest.fn();
const mockHybridRanker = jest.fn();
const mockAnalyzeContext = jest.fn();

jest.mock('@/lib/recommendations/vector-similarity', () => ({
  vectorSimilarityRecommendations: mockVectorSimilarity,
}));

jest.mock('@/lib/recommendations/collaborative-filter', () => ({
  collaborativeFilterRecommendations: mockCollaborativeFilter,
}));

jest.mock('@/lib/recommendations/content-filter', () => ({
  contentBasedRecommendations: mockContentBased,
}));

jest.mock('@/lib/recommendations/hybrid-ranker', () => ({
  hybridRanker: mockHybridRanker,
}));

jest.mock('@/lib/recommendations/context-analyzer', () => ({
  analyzeContext: mockAnalyzeContext,
}));

import {
  getRecommendations,
  trackRecommendationEvent,
  getRecommendationMetrics,
} from '@/lib/recommendations/engine';
import { createClient } from '@/lib/supabase/server';

// Type the mocked function (manual mock is automatically loaded)
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Recommendation Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    };

    // Reset and configure the mock
    mockCreateClient.mockReset();
    // Use jest.requireMock to get the mocked module and configure it
    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
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
          algorithm: 'hybrid',
          reason: 'Highly recommended',
        },
      ];

      mockHybridRanker.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(mockHybridRanker).toHaveBeenCalled();
      expect(result.recommendations).toEqual(mockRecs);
      expect(result.algorithm).toBe('hybrid');
    });

    it('should analyze context when provided', async () => {
      const mockContext = {
        detectedIntent: 'Looking for hydraulic pumps',
        categories: ['hydraulics'],
        tags: ['pump', 'industrial'],
      };

      mockAnalyzeContext.mockResolvedValue(mockContext);
      mockHybridRanker.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        context: 'I need a hydraulic pump for my machine',
        limit: 5,
      });

      expect(mockAnalyzeContext).toHaveBeenCalledWith(
        'I need a hydraulic pump for my machine',
        'domain-123'
      );
      expect(mockHybridRanker).toHaveBeenCalledWith(
        expect.objectContaining({
          context: mockContext,
        })
      );
      expect(result.context).toEqual(mockContext);
    });

    it('should filter out excluded products', async () => {
      const mockRecs = [
        { productId: 'prod-1', score: 0.9, algorithm: 'hybrid' },
        { productId: 'prod-2', score: 0.85, algorithm: 'hybrid' },
        { productId: 'prod-3', score: 0.8, algorithm: 'hybrid' },
      ];

      mockHybridRanker.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        excludeProductIds: ['prod-2'],
        limit: 5,
      });

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.map((r) => r.productId)).toEqual([
        'prod-1',
        'prod-3',
      ]);
    });

    it('should respect limit parameter', async () => {
      const mockRecs = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod-${i}`,
        score: 0.9 - i * 0.05,
        algorithm: 'hybrid',
      }));

      mockHybridRanker.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        limit: 3,
      });

      expect(result.recommendations).toHaveLength(3);
    });

    it('should use default limit of 5', async () => {
      mockHybridRanker.mockResolvedValue([]);
      mockSupabase.insert.mockResolvedValue({ error: null });

      await getRecommendations({
        domainId: 'domain-123',
      });

      expect(mockHybridRanker).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
        })
      );
    });

    it('should track recommendations in database', async () => {
      const mockRecs = [
        { productId: 'prod-1', score: 0.9, algorithm: 'hybrid' },
        { productId: 'prod-2', score: 0.85, algorithm: 'hybrid' },
      ];

      mockHybridRanker.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: null });

      await getRecommendations({
        domainId: 'domain-123',
        sessionId: 'session-123',
        conversationId: 'conv-456',
        limit: 5,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            session_id: 'session-123',
            conversation_id: 'conv-456',
            product_id: 'prod-1',
            algorithm_used: 'hybrid',
            score: 0.9,
            shown: true,
            clicked: false,
            purchased: false,
          }),
        ])
      );
    });

    it('should handle tracking errors gracefully', async () => {
      const mockRecs = [{ productId: 'prod-1', score: 0.9, algorithm: 'hybrid' }];

      mockHybridRanker.mockResolvedValue(mockRecs);
      mockSupabase.insert.mockResolvedValue({ error: new Error('DB error') });

      // Should not throw
      const result = await getRecommendations({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result.recommendations).toEqual(mockRecs);
    });

    it('should measure execution time', async () => {
      mockHybridRanker.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [];
      });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const result = await getRecommendations({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result.executionTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle algorithm errors by throwing', async () => {
      mockHybridRanker.mockRejectedValue(new Error('Algorithm failed'));

      await expect(
        getRecommendations({
          domainId: 'domain-123',
          limit: 5,
        })
      ).rejects.toThrow('Algorithm failed');
    });
  });

  describe('trackRecommendationEvent', () => {
    it('should track click events', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-123' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });

      await trackRecommendationEvent('prod-1', 'click', 'session-123');

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

      await trackRecommendationEvent('prod-1', 'purchase', 'session-123');

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
      await trackRecommendationEvent('prod-1', 'click', 'session-123');

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-123' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: new Error('Update failed') });

      // Should not throw
      await trackRecommendationEvent('prod-1', 'click', 'session-123');
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

      const result = await getRecommendationMetrics('domain-123', 24);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_recommendation_metrics', {
        p_domain_id: 'domain-123',
        p_hours: 24,
      });
      expect(result).toEqual(mockMetrics);
    });

    it('should use default 24 hours', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: {}, error: null });

      await getRecommendationMetrics('domain-123');

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

      await expect(getRecommendationMetrics('domain-123')).rejects.toThrow(
        'RPC failed'
      );
    });
  });
});
