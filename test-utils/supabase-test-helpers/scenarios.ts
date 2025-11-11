import { MockSupabaseClient } from './types';
import { createMockSupabaseClient } from './client';
import { createMockQueryBuilder } from './query-builder';

/**
 * Creates a mock Supabase client for an authenticated user
 * Common scenario: testing authenticated API routes
 *
 * @param userId - Optional user ID (defaults to 'test-user-id')
 * @param userEmail - Optional user email (defaults to 'test@example.com')
 */
export function createAuthenticatedMockClient(
  userId: string = 'test-user-id',
  userEmail: string = 'test@example.com'
): MockSupabaseClient {
  const user = {
    id: userId,
    email: userEmail,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };

  return createMockSupabaseClient({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null,
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null,
      }),
    },
  });
}

/**
 * Creates a mock Supabase client for an unauthenticated user
 * Common scenario: testing auth-protected routes with no user
 */
export function createUnauthenticatedMockClient(): MockSupabaseClient {
  return createMockSupabaseClient({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' },
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Sign up failed' },
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session to refresh' },
      }),
    },
  });
}

/**
 * Creates a mock Supabase client with specific table data
 * Common scenario: testing queries with known data responses
 *
 * @param tableName - The table to mock
 * @param data - The data to return for queries
 * @param error - Optional error to return
 */
export function createMockClientWithTableData(
  tableName: string,
  data: any,
  error: any = null
): MockSupabaseClient {
  const mockClient = createMockSupabaseClient();

  mockClient.from = jest.fn((table: string) => {
    if (table === tableName) {
      return createMockQueryBuilder({
        single: jest.fn().mockResolvedValue({ data, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data, error }),
        then: jest.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], error }),
      });
    }
    return createMockQueryBuilder();
  });

  return mockClient;
}

/**
 * Creates a mock Supabase client that throws database errors
 * Common scenario: testing error handling
 *
 * @param errorMessage - The error message to throw
 */
export function createErrorMockClient(errorMessage: string = 'Database error'): MockSupabaseClient {
  const error = { message: errorMessage, code: 'PGRST116' };

  return createMockSupabaseClient({
    from: jest.fn(() =>
      createMockQueryBuilder({
        single: jest.fn().mockResolvedValue({ data: null, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error }),
        then: jest.fn().mockResolvedValue({ data: null, error }),
      })
    ),
  });
}

/**
 * Creates a mock Supabase client for service role operations
 * Common scenario: testing admin operations that bypass RLS
 *
 * Service role clients have full access and don't respect RLS policies
 */
export function createServiceRoleMockClient(): MockSupabaseClient {
  return createAuthenticatedMockClient('service-role-admin', 'admin@system.local');
}
