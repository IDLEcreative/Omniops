import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/organizations/[id]/invitations/route';
import { mockSupabaseClient, createMockUser, createMockOrganization } from '@/test-utils/api-test-helpers';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Manual mock for @/lib/supabase/server
const mockCreateClient = jest.fn();
const mockCreateServiceRoleClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

describe('Organization Invitations API Unit Tests', () => {
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

  describe('POST /api/organizations/[id]/invitations', () => {
    it('should successfully create an invitation when seats are available', async () => {
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
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'inv-123',
                organization_id: testOrgId,
                email: 'newuser@test.com',
                role: 'member',
                token: 'test-token-123',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              error: null
            }),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null
            }),
            count: jest.fn().mockResolvedValue({
              count: 2,
              error: null
            })
          }
        }
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
        tables: {
          organization_members: {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            }),
            count: jest.fn().mockResolvedValue({
              count: 8,
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
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null
            }),
            count: jest.fn().mockResolvedValue({
              count: 2,
              error: null
            })
          }
        }
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

    it('should reject invitation from non-admin users', async () => {
      const mockClient = mockSupabaseClient({
        user: testUser,
        tables: {
          organization_members: {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: 'member' },
              error: null
            })
          }
        }
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

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only admins and owners can invite members');
    });

    it('should handle invalid email format', async () => {
      const mockClient = mockSupabaseClient({
        user: testUser
      });

      mockCreateClient.mockResolvedValue(mockClient);

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          role: 'member'
        })
      });

      const response = await POST(request, { params: Promise.resolve({ id: testOrgId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should prevent duplicate active invitations', async () => {
      const mockClient = mockSupabaseClient({
        user: testUser,
        tables: {
          organization_members: {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
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
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'existing-inv',
                expires_at: new Date(Date.now() + 1000000).toISOString()
              },
              error: null
            })
          }
        }
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

    it('should allow unlimited invitations for enterprise plan', async () => {
      const enterpriseOrg = createMockOrganization({
        id: testOrgId,
        name: 'Enterprise Org',
        seat_limit: -1,
        plan_type: 'enterprise'
      });

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
              count: 100,
              error: null
            })
          },
          organizations: {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: enterpriseOrg,
              error: null
            })
          },
          organization_invitations: {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'inv-123',
                organization_id: testOrgId,
                email: 'enterprise@test.com',
                role: 'member',
                token: 'test-token-123',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              error: null
            }),
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null
            }),
            count: jest.fn().mockResolvedValue({
              count: 50,
              error: null
            })
          }
        }
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
  });

  describe('GET /api/organizations/[id]/invitations', () => {
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

    it('should handle unauthenticated requests', async () => {
      const mockClient = mockSupabaseClient({
        authError: new Error('Not authenticated')
      });

      mockCreateClient.mockResolvedValue(mockClient);

      const request = new NextRequest('http://localhost:3000', {
        method: 'GET'
      });

      const response = await GET(request, { params: Promise.resolve({ id: testOrgId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid invitation attempts gracefully', async () => {
      let requestCount = 0;

      // Mock different responses based on request count
      mockCreateClient.mockImplementation(() => {
        requestCount++;
        const isRateLimited = requestCount > 3;

        return Promise.resolve(mockSupabaseClient({
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
              insert: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
              gt: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: isRateLimited ? null : {
                  id: `inv-${requestCount}`,
                  organization_id: testOrgId,
                  email: `user${requestCount}@test.com`,
                  role: 'member',
                  token: `test-token-${requestCount}`,
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                error: isRateLimited ? { message: 'Rate limit exceeded' } : null
              }),
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null
              }),
              count: jest.fn().mockResolvedValue({
                count: 2,
                error: null
              })
            }
          }
        }));
      });

      const requests = Array(5).fill(null).map((_, i) =>
        new NextRequest('http://localhost:3000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `user${i}@test.com`,
            role: 'member'
          })
        })
      );

      const responses = await Promise.all(
        requests.map(req => POST(req, { params: Promise.resolve({ id: testOrgId }) }))
      );

      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 500).length;

      expect(successCount).toBe(3);
      expect(rateLimitedCount).toBe(2);
    });
  });
});
