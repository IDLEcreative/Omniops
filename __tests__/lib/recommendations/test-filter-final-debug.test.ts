import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Final Debug', () => {
  it('should work with categories only', async () => {
    jest.clearAllMocks();

    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);

    // Mock the query result
    mockSupabase.eq.mockResolvedValueOnce({
      data: [
        {
          product_id: 'prod-1',
          metadata: { categories: ['hydraulics'], tags: [] },
        },
        {
          product_id: 'prod-2',
          metadata: { categories: ['other'], tags: [] },
        },
      ],
      error: null,
    });

    const result = await contentBasedRecommendations({
      domainId: 'domain-123',
      categories: ['hydraulics'],
      limit: 5,
    });

    console.log('=== FINAL DEBUG ===');
    console.log('createClient called:', supabaseModule.createClient.mock.calls.length, 'times');
    console.log('from called:', mockSupabase.from.mock.calls.length, 'times');
    console.log('select called:', mockSupabase.select.mock.calls.length, 'times');
    console.log('eq called:', mockSupabase.eq.mock.calls.length, 'times');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Result length:', result.length);

    expect(result.length).toBeGreaterThan(0);
  });
});
