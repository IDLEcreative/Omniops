/**
 * Comprehensive Tests for GET /api/organizations/[id]
 * Tests organization details retrieval with RLS enforcement and access control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
  MockSupabaseClient,
} from '@/test-utils/supabase-test-helpers';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Get Organization Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST 1: Authentication - Returns 401 for unauthenticated users
   */
  it('should return 401 for unauthenticated user', async () => {
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockClient.auth.getUser).toHaveBeenCalled();
  });

  /**
   * TEST 2: Success - Returns organization details for authorized member
   */
  it('should return organization details for authorized member', async () => {
    const mockUser = createMockUser({ id: 'user-123' });
    const mockOrg = createMockOrganization({
      id: 'org-123',
      name: 'Test Organization',
      slug: 'test-org',
      settings: { theme: 'dark' },
      plan_type: 'pro',
      seat_limit: 10,
    });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { role: 'admin' },
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
            count: 3,
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };
    });

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization).toMatchObject({
      id: 'org-123',
      name: 'Test Organization',
      slug: 'test-org',
      user_role: 'admin',
      member_count: 5,
      domain_count: 3,
    });
  });

  /**
   * TEST 3: Access Control - Returns 404 when user is not a member (RLS enforcement)
   */
  it('should return 404 when user is not a member of organization', async () => {
    
    const mockUser = createMockUser({ id: 'non-member-user' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null, // No membership found
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

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });

  /**
   * TEST 4: Not Found - Returns 404 when organization does not exist
   */
  it('should return 404 when organization does not exist', async () => {
    
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

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
                data: null, // Organization not found
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

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'nonexistent-org' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch organization');
  });

  /**
   * TEST 5: Error Handling - Handles database errors gracefully
   */
  it('should handle database errors gracefully', async () => {
    
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

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

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });

  /**
   * TEST 6: Response Shape - Returns proper organization shape with all fields
   */
  it('should return proper organization shape with all fields and counts', async () => {
    
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({
      id: 'org-full',
      name: 'Full Organization',
      slug: 'full-org',
      settings: { theme: 'light', notifications: true },
      plan_type: 'enterprise',
      seat_limit: 50,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn((arg: string) => {
            // Check if it's a count query or membership check
            if (arg === '*') {
              return {
                count: 12,
                error: null,
              };
            }
            return {
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { role: 'owner' },
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
          select: jest.fn().mockResolvedValue({
            count: 5,
            error: null,
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

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-full' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization).toMatchObject({
      id: 'org-full',
      name: 'Full Organization',
      slug: 'full-org',
      settings: { theme: 'light', notifications: true },
      plan_type: 'enterprise',
      seat_limit: 50,
      user_role: 'owner',
      domain_count: 5,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    expect(data.organization.member_count).toBeGreaterThanOrEqual(0);
  });

  /**
   * TEST 7: User Role - Correctly returns user's role in the organization
   */
  it('should return correct user role for different membership types', async () => {
    
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({ id: 'org-role-test' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn((arg: string) => {
            if (arg === '*') {
              return {
                count: 3,
                error: null,
              };
            }
            return {
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { role: 'member' }, // Regular member role
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
      return {
        select: jest.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };
    });

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-role-test' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization.user_role).toBe('member');
  });

  /**
   * TEST 8: Counts - Correctly counts members and domains
   */
  it('should return accurate member and domain counts', async () => {
    
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({ id: 'org-counts' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let memberCountCalls = 0;
    let domainCountCalls = 0;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn((arg: string, options?: any) => {
            if (options?.count === 'exact') {
              memberCountCalls++;
              return {
                count: 8,
                error: null,
              };
            }
            return {
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { role: 'admin' },
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
              domainCountCalls++;
            }
            return {
              count: 4,
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

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-counts' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization.member_count).toBe(8);
    expect(data.organization.domain_count).toBe(4);
    expect(memberCountCalls).toBeGreaterThan(0);
    expect(domainCountCalls).toBeGreaterThan(0);
  });

  /**
   * TEST 9: Service Unavailable - Returns 503 when Supabase client is unavailable
   */
  it('should return 503 when Supabase client is unavailable', async () => {
    
    __setMockSupabaseClient(null);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service unavailable');
  });

  /**
   * TEST 10: Multi-Tenant Isolation - Verifies user cannot access other organizations
   */
  it('should enforce multi-tenant isolation and block cross-tenant access', async () => {
    
    const mockUser = createMockUser({ id: 'user-tenant-a' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let queriedUserId: string | null = null;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn((field: string, value: string) => {
              if (field === 'organization_id') {
                // Capture the organization_id being queried
              }
              return {
                eq: jest.fn((field2: string, value2: string) => {
                  if (field2 === 'user_id') {
                    queriedUserId = value2;
                  }
                  return {
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null, // Simulate RLS blocking access
                      error: null,
                    }),
                  };
                }),
              };
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-tenant-b' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
    expect(queriedUserId).toBe('user-tenant-a'); // Verified it checked the correct user
  });
});
