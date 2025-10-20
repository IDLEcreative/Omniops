import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/organizations/[id]/invitations/route';
import { createServerClient } from '@/lib/supabase/server';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock Next.js request/response
jest.mock('@/lib/supabase/server');

describe('Organization Invitations API Integration Tests', () => {
  let mockSupabase: any;
  const testOrgId = 'test-org-123';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: testUserId, email: 'admin@test.com' } },
          error: null
        })
      },
      from: jest.fn((table: string) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          single: jest.fn(),
          maybeSingle: jest.fn(),
          count: jest.fn()
        };

        // Configure different responses based on table
        switch (table) {
          case 'organization_members':
            mockQuery.maybeSingle.mockResolvedValue({
              data: { role: 'admin' },
              error: null
            });
            break;
          case 'organizations':
            mockQuery.single.mockResolvedValue({
              data: {
                id: testOrgId,
                name: 'Test Org',
                seat_limit: 10,
                plan_type: 'professional'
              },
              error: null
            });
            break;
          case 'organization_invitations':
            mockQuery.maybeSingle.mockResolvedValue({
              data: null,
              error: null
            });
            mockQuery.single.mockResolvedValue({
              data: {
                id: 'inv-123',
                organization_id: testOrgId,
                email: 'newuser@test.com',
                role: 'member',
                token: 'test-token-123',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              },
              error: null
            });
            break;
        }

        return mockQuery;
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('POST /api/organizations/[id]/invitations', () => {
    it('should successfully create an invitation when seats are available', async () => {
      // Setup seat availability
      mockSupabase.from('organization_members').count.mockResolvedValue({
        count: 5,
        error: null
      });
      mockSupabase.from('organization_invitations').count.mockResolvedValue({
        count: 2,
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.com',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
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
      // Setup at seat limit
      mockSupabase.from('organization_members').count.mockResolvedValue({
        count: 8,
        error: null
      });
      mockSupabase.from('organization_invitations').count.mockResolvedValue({
        count: 2,
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'another@test.com',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Seat limit reached');
      expect(data.details.upgrade_required).toBe(true);
      expect(data.details.message).toContain('Your professional plan allows 10 team members');
    });

    it('should reject invitation from non-admin users', async () => {
      // Set user as regular member
      mockSupabase.from('organization_members').maybeSingle.mockResolvedValue({
        data: { role: 'member' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.com',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only admins and owners can invite members');
    });

    it('should handle invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should prevent duplicate active invitations', async () => {
      // Mock existing invitation
      mockSupabase.from('organization_invitations').maybeSingle.mockResolvedValue({
        data: {
          id: 'existing-inv',
          expires_at: new Date(Date.now() + 1000000).toISOString()
        },
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@test.com',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('An active invitation already exists for this email');
    });

    it('should allow unlimited invitations for enterprise plan', async () => {
      // Set org to enterprise with unlimited seats
      mockSupabase.from('organizations').single.mockResolvedValue({
        data: {
          id: testOrgId,
          name: 'Enterprise Org',
          seat_limit: -1,
          plan_type: 'enterprise'
        },
        error: null
      });

      // Set high member count
      mockSupabase.from('organization_members').count.mockResolvedValue({
        count: 100,
        error: null
      });
      mockSupabase.from('organization_invitations').count.mockResolvedValue({
        count: 50,
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'enterprise@test.com',
          role: 'member'
        })
      });

      const response = await POST(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invitation).toBeDefined();
      // Enterprise should not have seat limit restrictions
      expect(data.seat_usage.limit).toBe(-1);
    });
  });

  describe('GET /api/organizations/[id]/invitations', () => {
    it('should return invitations with seat usage information', async () => {
      // Mock invitations data
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

      mockSupabase.from('organization_invitations').order.mockResolvedValue({
        data: mockInvitations,
        error: null
      });

      mockSupabase.from('organization_members').count.mockResolvedValue({
        count: 5,
        error: null
      });

      mockSupabase.from('organization_invitations').count.mockResolvedValue({
        count: 2,
        error: null
      });

      mockSupabase.from('customers').maybeSingle.mockResolvedValue({
        data: { email: 'admin@test.com', name: 'Admin User' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: testOrgId } });
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
      const expiredDate = new Date(Date.now() - 1000000).toISOString();

      // Ensure the query filters out expired invitations
      mockSupabase.from('organization_invitations').gt.mockImplementation((field, value) => {
        if (field === 'expires_at') {
          // Filter out expired
          return {
            order: jest.fn().mockResolvedValue({
              data: [], // No valid invitations
              error: null
            })
          };
        }
        return mockSupabase.from('organization_invitations');
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invitations).toHaveLength(0);
    });

    it('should deny access to non-members', async () => {
      mockSupabase.from('organization_members').maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found or access denied');
    });

    it('should handle unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const request = new NextRequest('http://localhost:3000', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid invitation attempts gracefully', async () => {
      const requests = Array(5).fill(null).map(() =>
        new NextRequest('http://localhost:3000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `user${Math.random()}@test.com`,
            role: 'member'
          })
        })
      );

      // Simulate rate limiting after 3 requests
      let requestCount = 0;
      mockSupabase.from('organization_invitations').single.mockImplementation(() => {
        requestCount++;
        if (requestCount > 3) {
          return Promise.resolve({
            data: null,
            error: { message: 'Rate limit exceeded' }
          });
        }
        return Promise.resolve({
          data: { id: `inv-${requestCount}` },
          error: null
        });
      });

      const responses = await Promise.all(
        requests.map(req => POST(req, { params: { id: testOrgId } }))
      );

      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 500).length;

      expect(successCount).toBe(3);
      expect(rateLimitedCount).toBe(2);
    });
  });
});