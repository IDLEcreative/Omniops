import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/export/route';
import {
  createAnalyticsRequest,
  mockRateLimitImplementation,
  resetRateLimit,
  setupAnalyticsTestContext,
} from './test-helpers';

describe('Analytics Export - Concurrent Requests', () => {
  beforeEach(() => {
    setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    let requestCount = 0;
    mockRateLimitImplementation(() => {
      requestCount += 1;
      if (requestCount > 3) {
        return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
      }
      return null;
    });

    const requests = Array.from({ length: 5 }, () => GET(createAnalyticsRequest({ format: 'csv' })));
    const responses = await Promise.all(requests);

    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    expect(responses[2].status).toBe(200);
    expect(responses[3].status).toBe(429);
    expect(responses[4].status).toBe(429);

    resetRateLimit();
  });
});
