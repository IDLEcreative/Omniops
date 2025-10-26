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

describe('Organization Invitations API - Error Handling Tests', () => {
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

  describe('Authorization Errors', () => {
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

  describe('Validation Errors', () => {
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
