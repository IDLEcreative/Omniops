/**
 * Shared test setup for event-aggregator tests
 */

import { createServerClient } from '@supabase/ssr';

export let mockSupabaseClient: any;

export function setupMocks() {
  jest.clearAllMocks();

  mockSupabaseClient = {
    from: jest.fn()
  };

  (createServerClient as jest.MockedFunction<typeof createServerClient>)
    .mockReturnValue(mockSupabaseClient as any);

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  return mockSupabaseClient;
}
