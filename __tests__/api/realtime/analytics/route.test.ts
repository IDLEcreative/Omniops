import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, OPTIONS } from '@/app/api/realtime/analytics/route';
import { NextRequest } from 'next/server';

// Mock the realtime modules
jest.mock('@/lib/realtime/analytics-stream', () => ({
  createAnalyticsStream: jest.fn(() => {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"connected"}\n\n'));
      }
    });
  })
}));

jest.mock('@/lib/realtime/event-aggregator', () => ({
  getAggregatedMetrics: jest.fn().mockResolvedValue({
    activeSessions: 5,
    messagesPerMinute: 25,
    responseTimes: { p50: 150, p95: 500, p99: 1000 },
    engagement: {
      activeCount: 5,
      avgDuration: 180000,
      avgMessageCount: 8
    },
    activityFeed: [],
    timestamp: Date.now()
  })
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('Real-time Analytics API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET endpoint', () => {
    it('should return SSE response with correct headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/realtime/analytics');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return a readable stream body', async () => {
      const request = new NextRequest('http://localhost:3000/api/realtime/analytics');
      const response = await GET(request);

      expect(response.body).toBeInstanceOf(ReadableStream);
    });

    it('should include initial metrics in the stream', async () => {
      const { getAggregatedMetrics } = require('@/lib/realtime/event-aggregator');
      getAggregatedMetrics.mockResolvedValueOnce({
        activeSessions: 10,
        messagesPerMinute: 50,
        responseTimes: { p50: 200, p95: 600, p99: 1200 },
        engagement: {
          activeCount: 10,
          avgDuration: 240000,
          avgMessageCount: 12
        },
        activityFeed: [
          { id: '1', event_type: 'session_started', created_at: new Date().toISOString() }
        ],
        timestamp: Date.now()
      });

      const request = new NextRequest('http://localhost:3000/api/realtime/analytics');
      const response = await GET(request);

      // Verify that getAggregatedMetrics was called
      expect(getAggregatedMetrics).toHaveBeenCalled();
    });
  });

  describe('OPTIONS endpoint', () => {
    it('should return CORS headers for preflight request', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });

    it('should return null body for OPTIONS request', async () => {
      const response = await OPTIONS();
      const body = await response.text();
      expect(body).toBe('');
    });
  });
});