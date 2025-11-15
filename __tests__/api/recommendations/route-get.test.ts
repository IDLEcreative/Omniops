/**
 * Recommendations API - GET Endpoint Tests
 *
 * Tests GET /api/recommendations endpoint including validation,
 * parameter handling, and error cases.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockGetRecommendations = jest.fn();
const mockTrackEvent = jest.fn();
const mockGetMetrics = jest.fn();

jest.mock('@/lib/recommendations/engine', () => ({
  getRecommendations: mockGetRecommendations,
  trackRecommendationEvent: mockTrackEvent,
  getRecommendationMetrics: mockGetMetrics,
}));

import { GET } from '@/app/api/recommendations/route';

describe('GET /api/recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return recommendations with valid parameters', async () => {
      const mockResult = {
        recommendations: [
          {
            productId: 'prod-1',
            score: 0.9,
            algorithm: 'hybrid',
            reason: 'Recommended for you',
          },
        ],
        algorithm: 'hybrid',
        executionTime: 150,
      };

      mockGetRecommendations.mockResolvedValue(mockResult);

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&limit=5'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResult);
    });

    it('should default limit to 5', async () => {
      mockGetRecommendations.mockResolvedValue({
        recommendations: [],
        algorithm: 'hybrid',
        executionTime: 100,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000'
      );

      await GET(request);

      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 })
      );
    });

    it('should accept all valid algorithm types', async () => {
      const algorithms = [
        'collaborative',
        'content_based',
        'hybrid',
        'vector_similarity',
      ];

      mockGetRecommendations.mockResolvedValue({
        recommendations: [],
        algorithm: 'hybrid',
        executionTime: 100,
      });

      for (const algorithm of algorithms) {
        const request = new NextRequest(
          `http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&algorithm=${algorithm}`
        );

        const response = await GET(request);
        expect(response.status).toBe(200);
      }
    });

    it('should pass all query parameters to engine', async () => {
      mockGetRecommendations.mockResolvedValue({
        recommendations: [],
        algorithm: 'hybrid',
        executionTime: 100,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&sessionId=sess-123&conversationId=conv-456&userId=user-789&limit=10&algorithm=collaborative&context=test%20context&excludeProductIds=prod-1,prod-2'
      );

      await GET(request);

      expect(mockGetRecommendations).toHaveBeenCalledWith({
        domainId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: 'sess-123',
        conversationId: 'conv-456',
        userId: 'user-789',
        limit: 10,
        algorithm: 'collaborative',
        context: 'test context',
        excludeProductIds: ['prod-1', 'prod-2'],
      });
    });

    it('should parse excludeProductIds as array', async () => {
      mockGetRecommendations.mockResolvedValue({
        recommendations: [],
        algorithm: 'hybrid',
        executionTime: 100,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&excludeProductIds=prod-1,prod-2,prod-3'
      );

      await GET(request);

      expect(mockGetRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeProductIds: ['prod-1', 'prod-2', 'prod-3'],
        })
      );
    });
  });

  describe('Validation', () => {
    it('should validate domainId is UUID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=invalid-uuid&limit=5'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('should validate limit is between 1 and 20', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&limit=25'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate algorithm enum', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000&algorithm=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle missing domainId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle engine errors with 500 status', async () => {
      mockGetRecommendations.mockRejectedValue(new Error('Engine failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations?domainId=550e8400-e29b-41d4-a716-446655440000'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Engine failed');
    });
  });
});
