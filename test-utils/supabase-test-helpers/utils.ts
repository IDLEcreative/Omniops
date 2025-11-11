import { MockSupabaseClient } from './types';

/**
 * Type guard to assert a mock is a Supabase client
 * Useful for TypeScript type narrowing in tests
 */
export function isMockSupabaseClient(client: any): client is MockSupabaseClient {
  return (
    client &&
    typeof client.from === 'function' &&
    client.auth &&
    typeof client.auth.getUser === 'function'
  );
}

/**
 * Resets all mocks on a Supabase client
 * Call this in beforeEach to ensure clean test state
 */
export function resetSupabaseMocks(client: MockSupabaseClient): void {
  if (client.from && jest.isMockFunction(client.from)) {
    client.from.mockClear();
  }
  if (client.rpc && jest.isMockFunction(client.rpc)) {
    client.rpc.mockClear();
  }

  Object.values(client.auth).forEach((fn) => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
}
