/**
 * Security & Isolation Tests for GET /api/organizations/[id]
 * Tests multi-tenant isolation and RLS enforcement
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import { createMockUser } from '@/test-utils/api-test-helpers';
import { createMultiTenantMockClient } from '@/__tests__/utils/organizations/organization-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Security & Multi-Tenant Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enforce multi-tenant isolation and block cross-tenant access', async () => {
    const mockUser = createMockUser({ id: 'user-tenant-a' });
    const mockClient = createMultiTenantMockClient(mockUser.id, mockUser.email);
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-tenant-b' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });
});
