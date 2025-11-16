import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import {
  createAnalyticsRequest,
  mockRateLimitImplementation,
  resetRateLimit,
  setupAnalyticsTestContext,
} from './test-helpers';

// Import GET dynamically in each test to ensure mocks are applied
let GET: any;

describe('Analytics Export - Concurrent Requests', () => {
  beforeEach(async () => {
    setupAnalyticsTestContext();
    // Dynamically import the route after mocks are set up
    const routeModule = await import('@/app/api/analytics/export/route');
    GET = routeModule.GET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('supports parallel CSV, Excel, and PDF exports', async () => {
    const responses = await Promise.all([
      GET(createAnalyticsRequest({ format: 'csv' })),
      GET(createAnalyticsRequest({ format: 'excel' })),
      GET(createAnalyticsRequest({ format: 'pdf' })),
    ]);

    responses.forEach((response) => expect(response.status).toBe(200));

    expect(responses[0].headers.get('Content-Type')).toBe('text/csv');
    expect(responses[1].headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(responses[2].headers.get('Content-Type')).toBe('application/pdf');
  });

  it('enforces shared rate limits across concurrent exports', async () => {
    // Simulate atomic counter behavior like Redis INCR
    let requestCount = 0;
    const incrementAndCheck = () => {
      requestCount += 1;
      return requestCount;
    };

    // Mock rate limiter to allow first 3 requests, then rate limit subsequent ones
    mockRateLimitImplementation(async () => {
      const currentCount = incrementAndCheck();
      if (currentCount > 3) {
        return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
      }
      return null;
    });

    const requests = Array.from({ length: 5 }, () => GET(createAnalyticsRequest({ format: 'csv' })));
    const responses = await Promise.all(requests);

    // Count how many succeeded vs rate limited
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    // Exactly 3 should succeed, 2 should be rate limited
    expect(successCount).toBe(3);
    expect(rateLimitedCount).toBe(2);

    resetRateLimit();
  });
});
