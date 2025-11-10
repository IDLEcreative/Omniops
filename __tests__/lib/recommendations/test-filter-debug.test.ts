import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Debug Filter', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
  });

  it('should find matching products', async () => {
    // Reference products
    mockSupabase.in.mockResolvedValueOnce({
      data: [
        {
          product_id: 'ref-1',
          metadata: { categories: ['cat-1'], tags: [] },
        },
      ],
      error: null,
    });

    // All products
    mockSupabase.eq.mockResolvedValueOnce({
      data: [
        {
          product_id: 'prod-1',
          metadata: { categories: ['cat-1'], tags: [] },
        },
        {
          product_id: 'prod-2',
          metadata: { categories: ['cat-2'], tags: [] },
        },
      ],
      error: null,
    });

    const result = await contentBasedRecommendations({
      domainId: 'domain-123',
      productIds: ['ref-1'],
      limit: 5,
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Result length:', result.length);
    
    expect(result.length).toBeGreaterThan(0);
  });
});
