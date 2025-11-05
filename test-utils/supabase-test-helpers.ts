/**
 * Supabase Test Helpers
 * Standardized utilities for mocking Supabase clients in tests
 *
 * Purpose: Provides consistent, easy-to-use mocks for Supabase client functionality
 * to eliminate complex module mocking and enable simple dependency injection.
 *
 * Usage:
 * ```typescript
 * import { createMockSupabaseClient, createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers'
 *
 * const mockClient = createAuthenticatedMockClient('user-123')
 * const response = await POST(mockRequest, { supabase: mockClient })
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface MockQueryBuilder {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  upsert: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  gt: jest.Mock
  gte: jest.Mock
  lt: jest.Mock
  lte: jest.Mock
  like: jest.Mock
  ilike: jest.Mock
  is: jest.Mock
  in: jest.Mock
  contains: jest.Mock
  containedBy: jest.Mock
  rangeGt: jest.Mock
  rangeGte: jest.Mock
  rangeLt: jest.Mock
  rangeLte: jest.Mock
  rangeAdjacent: jest.Mock
  overlaps: jest.Mock
  textSearch: jest.Mock
  match: jest.Mock
  not: jest.Mock
  or: jest.Mock
  filter: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  range: jest.Mock
  abortSignal: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
  then: jest.Mock
}

export interface MockSupabaseAuth {
  getUser: jest.Mock
  getSession: jest.Mock
  signOut: jest.Mock
  signInWithPassword: jest.Mock
  signUp: jest.Mock
  resetPasswordForEmail: jest.Mock
  updateUser: jest.Mock
  setSession: jest.Mock
  refreshSession: jest.Mock
}

export interface MockSupabaseStorage {
  from: jest.Mock
}

export interface MockSupabaseClient {
  from: jest.Mock
  auth: MockSupabaseAuth
  storage: MockSupabaseStorage
  rpc: jest.Mock
  channel: jest.Mock
}

/**
 * Creates a chainable query builder mock
 * All methods return `this` to enable chaining
 */
function createMockQueryBuilder(overrides?: Partial<MockQueryBuilder>): MockQueryBuilder {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  }

  // Apply overrides
  if (overrides) {
    Object.assign(builder, overrides)
  }

  return builder
}

/**
 * Creates a mock Supabase storage bucket
 */
function createMockStorageBucket() {
  return {
    upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
    download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
    remove: jest.fn().mockResolvedValue({ data: null, error: null }),
    createSignedUrl: jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/public-url' }
    }),
    list: jest.fn().mockResolvedValue({ data: [], error: null }),
    move: jest.fn().mockResolvedValue({ data: null, error: null }),
    copy: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}

/**
 * Creates a complete mock Supabase client
 * Use this for most test scenarios
 *
 * @param overrides - Partial overrides for specific mock behavior
 */
export function createMockSupabaseClient(overrides?: Partial<MockSupabaseClient>): MockSupabaseClient {
  const mockClient: MockSupabaseClient = {
    from: jest.fn((tableName: string) => createMockQueryBuilder()),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Not authenticated' }
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
    },
    storage: {
      from: jest.fn((bucketName: string) => createMockStorageBucket()),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn().mockResolvedValue({ error: null }),
    }),
  }

  // Apply overrides
  if (overrides) {
    if (overrides.from) mockClient.from = overrides.from
    if (overrides.auth) Object.assign(mockClient.auth, overrides.auth)
    if (overrides.storage) Object.assign(mockClient.storage, overrides.storage)
    if (overrides.rpc) mockClient.rpc = overrides.rpc
    if (overrides.channel) mockClient.channel = overrides.channel
  }

  return mockClient
}

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
  }

  const session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  }

  return createMockSupabaseClient({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user, session },
        error: null
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user },
        error: null
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session },
        error: null
      }),
    },
  })
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
        error: { message: 'Not authenticated' }
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' }
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Sign up failed' }
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      }),
      setSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' }
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No session to refresh' }
      }),
    },
  })
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
  const mockClient = createMockSupabaseClient()

  mockClient.from = jest.fn((table: string) => {
    if (table === tableName) {
      return createMockQueryBuilder({
        single: jest.fn().mockResolvedValue({ data, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data, error }),
        then: jest.fn().mockResolvedValue({ data: Array.isArray(data) ? data : [data], error }),
      })
    }
    return createMockQueryBuilder()
  })

  return mockClient
}

/**
 * Creates a mock Supabase client that throws database errors
 * Common scenario: testing error handling
 *
 * @param errorMessage - The error message to throw
 */
export function createErrorMockClient(errorMessage: string = 'Database error'): MockSupabaseClient {
  const error = { message: errorMessage, code: 'PGRST116' }

  return createMockSupabaseClient({
    from: jest.fn(() => createMockQueryBuilder({
      single: jest.fn().mockResolvedValue({ data: null, error }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error }),
      then: jest.fn().mockResolvedValue({ data: null, error }),
    })),
  })
}

/**
 * Creates a mock Supabase client for service role operations
 * Common scenario: testing admin operations that bypass RLS
 *
 * Service role clients have full access and don't respect RLS policies
 */
export function createServiceRoleMockClient(): MockSupabaseClient {
  // Service role client is similar to authenticated but with elevated permissions
  // In tests, this is primarily about auth state, not actual permission checks
  return createAuthenticatedMockClient('service-role-admin', 'admin@system.local')
}

/**
 * Helper to mock a successful query response
 * Use this for quick inline query mocking
 *
 * @example
 * mockClient.from = jest.fn(() => mockSuccessQuery([{ id: 1, name: 'Test' }]))
 */
export function mockSuccessQuery(data: any): MockQueryBuilder {
  return createMockQueryBuilder({
    single: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] : data,
      error: null
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] : data,
      error: null
    }),
    then: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data : [data],
      error: null
    }),
  })
}

/**
 * Helper to mock a failed query response
 * Use this for quick inline error mocking
 *
 * @example
 * mockClient.from = jest.fn(() => mockErrorQuery('Record not found'))
 */
export function mockErrorQuery(errorMessage: string, code: string = 'PGRST116'): MockQueryBuilder {
  const error = { message: errorMessage, code }

  return createMockQueryBuilder({
    single: jest.fn().mockResolvedValue({ data: null, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error }),
    then: jest.fn().mockResolvedValue({ data: null, error }),
  })
}

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
  )
}

/**
 * Resets all mocks on a Supabase client
 * Call this in beforeEach to ensure clean test state
 */
export function resetSupabaseMocks(client: MockSupabaseClient): void {
  if (client.from && jest.isMockFunction(client.from)) {
    client.from.mockClear()
  }
  if (client.rpc && jest.isMockFunction(client.rpc)) {
    client.rpc.mockClear()
  }

  Object.values(client.auth).forEach(fn => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear()
    }
  })
}
