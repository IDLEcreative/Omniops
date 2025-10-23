/**
 * Supabase Mocking Utilities for Next.js 15 Tests
 *
 * PROBLEM: Standard jest.mock() doesn't work with Next.js 15's async cookies()
 * SOLUTION: Mock at the implementation level, not the import level
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock Supabase client with common query patterns
 *
 * Usage in tests:
 * ```
 * const mockClient = createMockSupabaseClient({
 *   user: { id: '123', email: 'test@example.com' },
 *   authError: null,
 *   queryResults: {
 *     organizations: { data: [...], error: null },
 *     organization_members: { data: [...], error: null }
 *   }
 * });
 * ```
 */
export interface MockSupabaseOptions {
  user?: { id: string; email: string; [key: string]: any } | null;
  authError?: Error | null;
  queryResults?: Record<string, { data: any; error: any }>;
}

export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const { user = { id: 'test-user', email: 'test@example.com' }, authError = null, queryResults = {} } = options;

  // Create chainable query builder
  const createQueryBuilder = (tableName: string): any => {
    const result = queryResults[tableName] || { data: null, error: null };

    const builder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
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
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve(result)),
      maybeSingle: jest.fn(() => Promise.resolve(result)),
      // Default resolution for chained queries
      then: (resolve: (value: any) => any) => resolve(result),
    };

    return builder;
  };

  const mockClient = {
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: authError ? null : user },
        error: authError,
      })) as any,
      getSession: jest.fn(() => Promise.resolve({
        data: { session: authError ? null : { user } },
        error: authError,
      })) as any,
      signIn: jest.fn() as any,
      signOut: jest.fn() as any,
      signUp: jest.fn() as any,
    },
    from: jest.fn((table: string) => createQueryBuilder(table)) as any,
    rpc: jest.fn() as any,
    storage: {
      from: jest.fn() as any,
    },
  } as any;

  return mockClient;
}

/**
 * Mocks Next.js cookies() function for testing
 *
 * Must be called in test setup BEFORE importing route handlers
 */
export function mockNextCookies() {
  jest.unstable_mockModule('next/headers', () => ({
    cookies: jest.fn(() => Promise.resolve({
      getAll: jest.fn().mockReturnValue([]),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    })),
  }));
}

/**
 * Complete setup for testing Next.js 15 API routes with Supabase
 *
 * Usage:
 * ```
 * beforeAll(async () => {
 *   await setupSupabaseRouteMocks();
 * });
 *
 * it('should handle request', async () => {
 *   const mockClient = createMockSupabaseClient({ user: testUser });
 *   mockCreateClient.mockResolvedValue(mockClient);
 *
 *   const response = await GET();
 *   expect(response.status).toBe(200);
 * });
 * ```
 */
export async function setupSupabaseRouteMocks() {
  // Mock Next.js cookies
  mockNextCookies();

  // Mock Supabase SSR
  jest.unstable_mockModule('@supabase/ssr', () => ({
    createServerClient: jest.fn((url, key, config) => {
      return createMockSupabaseClient();
    }),
  }));
}

/**
 * Factory for creating mock organizations
 */
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    settings: {},
    plan_type: 'free',
    seat_limit: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Factory for creating mock users
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Factory for creating mock organization members
 */
export function createMockMember(overrides: Partial<any> = {}) {
  return {
    organization_id: 'org-123',
    user_id: 'user-123',
    role: 'member',
    joined_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
