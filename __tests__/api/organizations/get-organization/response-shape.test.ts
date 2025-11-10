/**
 * Response Shape & Data Tests for GET /api/organizations/[id]
 * Tests response structure, field inclusion, and data accuracy
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';
import { createMockClientWithCounts } from '@/__tests__/utils/organizations/organization-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Response Shape & Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    const mockClient = createMockClientWithCounts(
      mockUser.id,
      mockUser.email,
      mockOrg,
      'owner',
      12,
      5
    );
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

  it('should return accurate member and domain counts', async () => {
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({ id: 'org-counts' });

    const mockClient = createMockClientWithCounts(
      mockUser.id,
      mockUser.email,
      mockOrg,
      'admin',
      8,
      4
    );
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-counts' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organization.member_count).toBe(8);
    expect(data.organization.domain_count).toBe(4);
  });
});
