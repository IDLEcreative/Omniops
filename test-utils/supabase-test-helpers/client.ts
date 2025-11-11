import { MockSupabaseClient } from './types';
import { createMockQueryBuilder } from './query-builder';
import { createMockStorageBucket } from './storage';

/**
 * Creates a complete mock Supabase client
 * Use this for most test scenarios
 *
 * @param overrides - Partial overrides for specific mock behavior
 */
export function createMockSupabaseClient(overrides?: Partial<MockSupabaseClient>): MockSupabaseClient {
  const mockClient: MockSupabaseClient = {
    from: jest.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Not authenticated' },
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    storage: {
      from: jest.fn(() => createMockStorageBucket()),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockResolvedValue({ error: null }),
    }),
  };

  if (!overrides) {
    return mockClient;
  }

  if (overrides.from) {
    mockClient.from = overrides.from;
  }
  if (overrides.auth) {
    Object.assign(mockClient.auth, overrides.auth);
  }
  if (overrides.storage) {
    Object.assign(mockClient.storage, overrides.storage);
  }
  if (overrides.rpc) {
    mockClient.rpc = overrides.rpc;
  }
  if (overrides.channel) {
    mockClient.channel = overrides.channel;
  }

  return mockClient;
}
