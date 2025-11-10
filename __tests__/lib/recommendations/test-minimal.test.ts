import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

describe('Minimal Test', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it('test 1', async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          product_id: 'ref-1',
          metadata: { categories: ['cat-1', 'cat-2', 'cat-3'], tags: [] },
        },
      ],
      error: null,
    });

    mockSupabase.eq.mockResolvedValueOnce({
      data: [
        {
          product_id: 'prod-1',
          metadata: { categories: ['cat-1'], tags: [] },
        },
      ],
      error: null,
    });

    const result = await contentBasedRecommendations({
      domainId: 'domain-123',
      productIds: ['ref-1'],
      limit: 5,
    });

    result.forEach((rec) => {
      expect(rec.score).toBeGreaterThanOrEqual(0.2);
    });
  });
});
