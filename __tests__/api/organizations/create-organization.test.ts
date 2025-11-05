/**
 * Comprehensive Tests for POST /api/organizations
 * Tests organization creation with validation, slug handling, and membership setup
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/organizations/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
  MockSupabaseClient,
} from '@/test-utils/supabase-test-helpers';
import { createMockUser } from '@/test-utils/api-test-helpers';

// Mock the Supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/organizations - Create Organization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST 1: Authentication - Returns 401 for unauthenticated users
   */
  it('should return 401 for unauthenticated user', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createUnauthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Organization' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockClient.auth.getUser).toHaveBeenCalled();
  });

  /**
   * TEST 2: Success - Creates organization with valid data
   */
  it('should create organization with valid data', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'user-123' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    const createdOrg = {
      id: 'new-org-id',
      name: 'New Organization',
      slug: 'new-organization',
      settings: {},
      plan_type: 'free',
      seat_limit: 5,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        // First call: Check for existing slug
        // Second call: Insert new organization
        let callCount = 0;
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // No existing org with this slug
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: createdOrg,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'organization_members') {
        return {
          insert: jest.fn().mockResolvedValue({
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'New Organization' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.organization).toMatchObject({
      id: 'new-org-id',
      name: 'New Organization',
      slug: 'new-organization',
      user_role: 'owner',
      member_count: 1,
    });
  });

  /**
   * TEST 3: Validation - Returns 400 for missing required fields
   */
  it('should validate required fields and return 400', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    // Missing name field
    const request = buildRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
    expect(data.details).toBeDefined();
  });

  /**
   * TEST 4: Validation - Returns 400 for invalid name (too short)
   */
  it('should reject name that is too short', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'A' }); // Only 1 character
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  /**
   * TEST 5: Validation - Returns 400 for invalid slug format
   */
  it('should reject invalid slug format', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({
      name: 'Test Org',
      slug: 'Invalid_Slug!', // Contains invalid characters
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  /**
   * TEST 6: Duplicate Handling - Returns 409 for duplicate organization slug
   */
  it('should return 409 when organization slug already exists', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { slug: 'existing-org' }, // Slug already exists
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

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({
      name: 'Existing Org',
      slug: 'existing-org',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Organization slug already exists');
  });

  /**
   * TEST 7: Slug Generation - Auto-generates slug when not provided
   */
  it('should auto-generate slug when not provided', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let capturedSlug: string | null = null;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: jest.fn((data: any) => {
            capturedSlug = data.slug;
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'new-org',
                    name: data.name,
                    slug: data.slug,
                    settings: {},
                    plan_type: 'free',
                    seat_limit: 5,
                  },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'organization_members') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'My Test Organization' });
    await POST(request);

    expect(capturedSlug).toMatch(/^my-test-organization$/);
  });

  /**
   * TEST 8: Membership Creation - Creates organization_member entry for creator
   */
  it('should create organization_member entry with owner role', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'creator-user-123' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let membershipData: any = null;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'new-org-123',
                  name: 'Test Org',
                  slug: 'test-org',
                  settings: {},
                  plan_type: 'free',
                  seat_limit: 5,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'organization_members') {
        return {
          insert: jest.fn((data: any) => {
            membershipData = data;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Org' });
    await POST(request);

    expect(membershipData).toMatchObject({
      organization_id: 'new-org-123',
      user_id: 'creator-user-123',
      role: 'owner',
    });
  });

  /**
   * TEST 9: Error Handling - Handles organization creation failure
   */
  it('should handle organization creation failure', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error', code: 'PGRST301' },
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

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create organization');
  });

  /**
   * TEST 10: Rollback - Deletes organization if membership creation fails
   */
  it('should rollback organization creation if membership fails', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let deleteCalled = false;
    const orgId = 'org-to-delete';

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: orgId,
                  name: 'Test Org',
                  slug: 'test-org',
                  settings: {},
                  plan_type: 'free',
                  seat_limit: 5,
                },
                error: null,
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn((field: string, value: string) => {
              if (field === 'id' && value === orgId) {
                deleteCalled = true;
              }
              return Promise.resolve({ error: null });
            }),
          }),
        };
      }
      if (table === 'organization_members') {
        return {
          insert: jest.fn().mockResolvedValue({
            error: { message: 'Failed to create membership', code: 'PGRST301' },
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Org' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(deleteCalled).toBe(true);
  });

  /**
   * TEST 11: Service Unavailable - Returns 503 when Supabase client is unavailable
   */
  it('should return 503 when Supabase client is unavailable', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    createClient.mockResolvedValue(null);

    const request = buildRequest({ name: 'Test Org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service unavailable');
  });
});
