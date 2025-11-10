/**
 * getRecommendationMetrics Function Tests
 *
 * Tests metrics retrieval with default parameters and error handling.
 */

// Setup mocks BEFORE importing code under test
import './setup-mocks';

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getRecommendationMetrics } from '@/lib/recommendations/engine';
import {
  createMockMetrics,
} from '__tests__/utils/recommendations/test-fixtures';
import { createMockSupabaseClient } from '__tests__/utils/recommendations/mock-setup';

describe('getRecommendationMetrics', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  it('should fetch metrics from database', async () => {
    const mockMetrics = createMockMetrics();
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

    await expect(
      getRecommendationMetrics('domain-123', 24, mockSupabase)
    ).rejects.toThrow('RPC failed');
  });
});
