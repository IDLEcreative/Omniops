/**
 * Tests for response time percentile calculations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getResponseTimes } from '@/lib/realtime/event-aggregator';
import { createServerClient } from '@supabase/ssr';
import { mockSupabaseClient, setupMocks } from './setup';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}));

describe('Event Aggregator - Response Times', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should calculate percentiles from response data', async () => {
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      data: { response_time_ms: (i + 1) * 10 }
    }));

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      })
    });

    const metrics = await getResponseTimes();

    expect(metrics).toEqual({
      p50: 500,
      p95: 950,
      p99: 990
    });
  });

  it('should return zeros when no data', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      })
    });

    const metrics = await getResponseTimes();

    expect(metrics).toEqual({
      p50: 0,
      p95: 0,
      p99: 0
    });
  });
});
