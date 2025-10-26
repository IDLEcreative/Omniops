import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/invitations/route';
import { mockSupabaseClient, createMockUser, createMockOrganization } from '@/test-utils/api-test-helpers';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Manual mock for @/lib/supabase/server
const mockCreateClient = jest.fn();
const mockCreateServiceRoleClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

describe('Organization Invitations API - Accept/List Tests', () => {
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

  it('should return invitations with seat usage information', async () => {
    const mockInvitations = [
      {
        id: 'inv-1',
        email: 'user1@test.com',
        role: 'member',
        expires_at: new Date(Date.now() + 1000000).toISOString(),
        accepted_at: null,
        invited_by: testUserId,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-2',
        email: 'user2@test.com',
        role: 'viewer',
        expires_at: new Date(Date.now() + 2000000).toISOString(),
        accepted_at: null,
        invited_by: testUserId,
        created_at: new Date().toISOString()
      }
    ];

    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: {
        organization_members: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null
          }),
          count: jest.fn().mockResolvedValue({
            count: 5,
            error: null
          })
        },
        organizations: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: testOrg,
            error: null
          })
        },
        organization_invitations: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockInvitations,
            error: null
          }),
          count: jest.fn().mockResolvedValue({
            count: 2,
            error: null
          })
        },
        customers: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { email: 'admin@test.com', name: 'Admin User' },
            error: null
          })
        }
      }
    });

    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'GET'
    });

    const response = await GET(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitations).toHaveLength(2);
    expect(data.invitations[0].invited_by_email).toBe('admin@test.com');
    expect(data.seat_usage).toMatchObject({
      used: 5,
      pending: 2,
      total: 7,
      limit: 10,
      available: 3,
      plan_type: 'professional'
    });
  });

  it('should not return expired invitations', async () => {
    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: {
        organization_members: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { role: 'admin' },
            error: null
          }),
          count: jest.fn().mockResolvedValue({
            count: 5,
            error: null
          })
        },
        organizations: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: testOrg,
            error: null
          })
        },
        organization_invitations: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          }),
          count: jest.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        }
      }
    });

    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'GET'
    });

    const response = await GET(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invitations).toHaveLength(0);
  });

  it('should deny access to non-members', async () => {
    const mockClient = mockSupabaseClient({
      user: testUser,
      tables: {
        organization_members: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }
      }
    });

    mockCreateClient.mockResolvedValue(mockClient);

    const request = new NextRequest('http://localhost:3000', {
      method: 'GET'
    });

    const response = await GET(request, { params: Promise.resolve({ id: testOrgId }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });
});
