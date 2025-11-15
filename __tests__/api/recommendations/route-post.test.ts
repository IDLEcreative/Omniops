/**
 * Recommendations API - POST Endpoint Tests
 *
 * Tests POST /api/recommendations endpoint for tracking events
 * including click and purchase events with validation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockTrackEvent = jest.fn();
const mockGetRecommendations = jest.fn();
const mockGetMetrics = jest.fn();

jest.mock('@/lib/recommendations/engine', () => ({
  getRecommendations: mockGetRecommendations,
  trackRecommendationEvent: mockTrackEvent,
  getRecommendationMetrics: mockGetMetrics,
}));

import { POST } from '@/app/api/recommendations/route';

describe('POST /api/recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track click events', async () => {
      mockTrackEvent.mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: 'prod-123',
            eventType: 'click',
            sessionId: 'sess-456',
            conversationId: 'conv-789',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'prod-123',
        'click',
        'sess-456',
        'conv-789'
      );
    });

    it('should track purchase events', async () => {
      mockTrackEvent.mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: 'prod-123',
            eventType: 'purchase',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'prod-123',
        'purchase',
        undefined,
        undefined
      );
    });

    it('should allow optional sessionId and conversationId', async () => {
      mockTrackEvent.mockResolvedValue(undefined);

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: 'prod-123',
            eventType: 'click',
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'prod-123',
        'click',
        undefined,
        undefined
      );
    });
  });

  describe('Validation', () => {
    it('should validate required productId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            eventType: 'click',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    it('should validate eventType enum', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: 'prod-123',
            eventType: 'invalid',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: 'not json',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle tracking errors with 500 status', async () => {
      mockTrackEvent.mockRejectedValue(new Error('Tracking failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/recommendations',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: 'prod-123',
            eventType: 'click',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tracking failed');
    });
  });
});
