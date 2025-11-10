/**
 * Success Case Tests for GET /api/organizations/[id]
 * Tests successful organization retrieval with proper data
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';
import { createSuccessfulOrgMockClient } from '@/__tests__/utils/organizations/organization-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Success Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    const mockClient = createSuccessfulOrgMockClient(mockUser.id, mockUser.email, mockOrg);
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

  it('should return correct user role for different membership types', async () => {
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({ id: 'org-role-test' });

    const mockClient = createSuccessfulOrgMockClient(
      mockUser.id,
      mockUser.email,
      mockOrg,
      'member' // Regular member role
    );
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-role-test' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization.user_role).toBe('member');
  });
});
