import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

describe('Debug Test', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    // Use jest.requireMock to get the mocked module and configure it
    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
    
    console.log('mockCreateClient:', typeof mockCreateClient);
    console.log('supabaseModule.createClient:', typeof supabaseModule.createClient);
  });

  it('should call Supabase', async () => {
    mockSupabase.in.mockResolvedValueOnce({
      data: [{ product_id: 'ref-1', metadata: { categories: ['cat-1'], tags: [] } }],
      error: null,
    });

    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ product_id: 'prod-1', metadata: { categories: ['cat-1'], tags: [] } }],
      error: null,
    });

    const result = await contentBasedRecommendations({
      domainId: 'domain-123',
      productIds: ['ref-1'],
      limit: 5,
    });

    console.log('mockCreateClient called:', mockCreateClient.mock.calls.length);
    console.log('mockSupabase.from called:', mockSupabase.from.mock.calls.length);
    console.log('result:', result);
  });
});
