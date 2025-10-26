import { NextRequest } from 'next/server';
import { POST } from '@/app/api/organizations/[id]/invitations/route';
import { mockSupabaseClient, createMockUser, createMockOrganization } from '@/test-utils/api-test-helpers';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockCreateClient = jest.fn();
const mockCreateServiceRoleClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

// Helper to create mock tables for invitation creation
function createInvitationMockTables(config: {
  role: string;
  memberCount: number;
  org: any;
  pendingCount: number;
  existingInvitation?: any;
  invitationError?: any;
  invitation?: any;
}) {
  const { role, memberCount, org, pendingCount, existingInvitation, invitationError, invitation } = config;
  const defaultInvitation = {
    id: 'inv-123',
    organization_id: org.id,
    email: 'test@test.com',
    role: 'member',
    token: 'test-token-123',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  return {
    organization_members: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { role }, error: null }),
      count: jest.fn().mockResolvedValue({ count: memberCount, error: null })
    },
    organizations: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: org, error: null })
    },
    organization_invitations: {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: invitationError ? null : (invitation || defaultInvitation),
        error: invitationError
      }),
      maybeSingle: jest.fn().mockResolvedValue({ data: existingInvitation || null, error: null }),
      count: jest.fn().mockResolvedValue({ count: pendingCount, error: null })
    }
  };
}

describe('Organization Invitations API - Create Tests', () => {
  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-456';
  const testUser = createMockUser({ id: testUserId, email: 'admin@test.com' });
  const testOrg = createMockOrganization({
    id: testOrgId,
    name: 'Test Org',
    seat_limit: 10,
    plan_type: 'professional'
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully create an invitation when seats are available', async () => {
    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: createInvitationMockTables({
        role: 'admin',
        memberCount: 5,
        org: testOrg,
        pendingCount: 2,
        invitation: {
          id: 'inv-123',
          organization_id: testOrgId,
          email: 'newuser@test.com',
          role: 'member',
          token: 'test-token-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@test.com',
        role: 'member'
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.invitation).toBeDefined();
    expect(data.invitation.email).toBe('newuser@test.com');
    expect(data.invitation_link).toContain('/invitations/accept?token=');
    expect(data.seat_usage).toMatchObject({
      used: 6,
      pending: 3,
      total: 8,
      limit: 10,
      available: 2
    });
  });

  it('should reject invitation when at seat limit', async () => {
    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: createInvitationMockTables({
        role: 'admin',
        memberCount: 8,
        org: testOrg,
        pendingCount: 2
      })
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'another@test.com',
        role: 'member'
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Seat limit reached');
    expect(data.details.upgrade_required).toBe(true);
    expect(data.details.message).toContain('Your professional plan allows 10 team members');
  });

  it('should allow unlimited invitations for enterprise plan', async () => {
    const enterpriseOrg = createMockOrganization({
      id: testOrgId,
      name: 'Enterprise Org',
      seat_limit: -1,
      plan_type: 'enterprise'
    });

    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: createInvitationMockTables({
        role: 'admin',
        memberCount: 100,
        org: enterpriseOrg,
        pendingCount: 50,
        invitation: {
          id: 'inv-123',
          organization_id: testOrgId,
          email: 'enterprise@test.com',
          role: 'member',
          token: 'test-token-123',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'enterprise@test.com',
        role: 'member'
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.invitation).toBeDefined();
    expect(data.seat_usage.limit).toBe(-1);
  });

  it('should prevent duplicate active invitations', async () => {
    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: createInvitationMockTables({
        role: 'admin',
        memberCount: 5,
        org: testOrg,
        pendingCount: 2,
        existingInvitation: {
          id: 'existing-inv',
          expires_at: new Date(Date.now() + 1000000).toISOString()
        }
      })
    });
    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'duplicate@test.com',
        role: 'member'
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('An active invitation already exists for this email');
  });
});
