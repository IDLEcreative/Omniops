import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a mock Supabase client with standard query builder methods
 */
export function createMockSupabase(): jest.Mocked<SupabaseClient> {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
  } as any;
}

/**
 * Creates a standard query builder mock
 */
export function createQueryBuilder() {
  return {
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
}

/**
 * Standard time range for tests
 */
export const TEST_TIME_RANGE = {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
};

/**
 * Mock Supabase from() with query builder and resolve data
 */
export function mockSupabaseQuery(
  mockSupabase: jest.Mocked<SupabaseClient>,
  data: any,
  error: any = null
) {
  const queryBuilder = createQueryBuilder();

  mockSupabase.from = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      ...queryBuilder,
      then: (resolve: any) => resolve({ data, error })
    })
  }) as any;
}
