/**
 * Test helpers for organization API tests
 * Provides mock client builders and request creators
 */

import { jest } from '@jest/globals';
import { MockSupabaseClient } from '@/test-utils/supabase-test-helpers';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';

/**
 * Creates a mock Supabase client that simulates successful organization retrieval
 */
export function createSuccessfulOrgMockClient(
  userId: string,
  userEmail: string,
  mockOrg: any,
  memberRole: string = 'admin',
  memberCount: number = 5,
  domainCount: number = 3
): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { role: memberRole },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === 'organizations') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockOrg,
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'domains') {
      return {
        select: jest.fn().mockResolvedValue({
          count: domainCount,
          error: null,
        }),
      };
    }
    return {
      select: jest.fn().mockResolvedValue({
        count: memberCount,
        error: null,
      }),
    };
  });

  return mockClient;
}

/**
 * Creates a mock client that simulates user not being a member
 */
export function createNonMemberMockClient(userId: string, userEmail: string): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // No membership
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return mockClient;
}

/**
 * Creates a mock client that simulates database errors
 */
export function createDatabaseErrorMockClient(userId: string, userEmail: string): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error', code: 'PGRST301' },
              }),
            }),
          }),
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return mockClient;
}

/**
 * Creates a mock client for organization not found scenario
 */
export function createOrgNotFoundMockClient(userId: string, userEmail: string): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { role: 'member' },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === 'organizations') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null, // Not found
              error: null,
            }),
          }),
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return mockClient;
}

/**
 * Creates a mock client with support for count operations
 */
export function createMockClientWithCounts(
  userId: string,
  userEmail: string,
  mockOrg: any,
  memberRole: string = 'owner',
  memberCount: number = 12,
  domainCount: number = 5
): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn((arg: string) => {
          if (arg === '*') {
            return {
              count: memberCount,
              error: null,
            };
          }
          return {
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { role: memberRole },
                  error: null,
                }),
              }),
            }),
          };
        }),
      };
    }
    if (table === 'organizations') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockOrg,
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'domains') {
      return {
        select: jest.fn((arg: string, options?: any) => {
          if (options?.count === 'exact') {
            return {
              count: domainCount,
              error: null,
            };
          }
          return {
            count: domainCount,
            error: null,
          };
        }),
      };
    }
    return {
      select: jest.fn().mockResolvedValue({
        count: 0,
        error: null,
      }),
    };
  });

  return mockClient;
}

/**
 * Creates a mock client with tracking capabilities for tenant isolation tests
 */
export function createMultiTenantMockClient(userId: string, userEmail: string): MockSupabaseClient {
  const mockClient = createAuthenticatedMockClient(userId, userEmail);

  mockClient.from = jest.fn((table: string) => {
    if (table === 'organization_members') {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // RLS blocks access
                error: null,
              }),
            })),
          })),
        }),
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  return mockClient;
}
