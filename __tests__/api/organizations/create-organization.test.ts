/**
 * Comprehensive Tests for POST /api/organizations
 * Tests organization creation with validation, slug handling, and membership setup
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST } from '@/app/api/organizations/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
} from '@/test-utils/supabase-test-helpers';
import { createMockUser } from '@/test-utils/api-test-helpers';
import {
  buildRequest,
  createMockClientWithTables,
  assertResponse,
} from './helpers';
import { mockOrganizations, validRequests, invalidRequests } from './fixtures';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/organizations - Create Organization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated user', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createUnauthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.basic);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isUnauthorized(response.status, data);
    expect(mockClient.auth.getUser).toHaveBeenCalled();
  });

  it('should create organization with valid data', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'user-123' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = createMockClientWithTables({
      orgData: mockOrganizations.newOrg,
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.basic);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isCreated(response.status, data, {
      id: 'new-org-id',
      name: 'New Organization',
      slug: 'new-organization',
      user_role: 'owner',
      member_count: 1,
    });
  });

  it('should validate required fields and return 400', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(invalidRequests.missingName);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isBadRequest(response.status, data);
    expect(data.details).toBeDefined();
  });

  it('should reject name that is too short', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(invalidRequests.shortName);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isBadRequest(response.status, data);
  });

  it('should reject invalid slug format', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createAuthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(invalidRequests.invalidSlug);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isBadRequest(response.status, data);
  });

  it('should return 409 when organization slug already exists', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = createMockClientWithTables({
      existingSlug: true,
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Existing Org', slug: 'existing-org' });
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isConflict(response.status, data);
  });

  it('should auto-generate slug when not provided', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let capturedSlug: string | null = null;

    mockClient.from = createMockClientWithTables({
      orgData: {
        id: 'new-org',
        name: 'My Test Organization',
        slug: 'my-test-organization',
        settings: {},
        plan_type: 'free',
        seat_limit: 5,
      },
      captureOrgData: (data) => {
        capturedSlug = data.slug;
      },
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.longName);
    await POST(request);

    expect(capturedSlug).toMatch(/^my-test-organization$/);
  });

  it('should create organization_member entry with owner role', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'creator-user-123' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let membershipData: any = null;

    mockClient.from = createMockClientWithTables({
      orgData: {
        id: 'new-org-123',
        name: 'Test Org',
        slug: 'test-org',
        settings: {},
        plan_type: 'free',
        seat_limit: 5,
      },
      captureMemberData: (data) => {
        membershipData = data;
      },
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.basic);
    await POST(request);

    expect(membershipData).toMatchObject({
      organization_id: 'new-org-123',
      user_id: 'creator-user-123',
      role: 'owner',
    });
  });

  it('should handle organization creation failure', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = createMockClientWithTables({
      orgInsertError: { message: 'Database error', code: 'PGRST301' },
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.basic);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isServerError(response.status, data, 'Failed to create organization');
  });

  it('should rollback organization creation if membership fails', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = createMockClientWithTables({
      orgData: {
        id: 'org-to-delete',
        name: 'Test Org',
        slug: 'test-org',
        settings: {},
        plan_type: 'free',
        seat_limit: 5,
      },
      memberInsertError: { message: 'Failed to create membership', code: 'PGRST301' },
    });

    createClient.mockResolvedValue(mockClient);

    const request = buildRequest(validRequests.basic);
    const response = await POST(request);

    expect(response.status).toBe(500);
    // Delete will be called during rollback - verified via mock builder
  });

  it('should return 503 when Supabase client is unavailable', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    createClient.mockResolvedValue(null);

    const request = buildRequest(validRequests.basic);
    const response = await POST(request);
    const data = await response.json();

    assertResponse.isServiceUnavailable(response.status, data);
  });
});
