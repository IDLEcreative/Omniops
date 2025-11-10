/**
 * Error Handling Tests for GET /api/organizations/[id]
 * Tests 404s, database errors, and access denied scenarios
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import { createMockUser } from '@/test-utils/api-test-helpers';
import {
  createNonMemberMockClient,
  createOrgNotFoundMockClient,
  createDatabaseErrorMockClient,
} from '@/__tests__/utils/organizations/organization-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when user is not a member of organization', async () => {
    const mockUser = createMockUser({ id: 'non-member-user' });
    const mockClient = createNonMemberMockClient(mockUser.id, mockUser.email);
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });

  it('should return 500 when organization does not exist', async () => {
    const mockUser = createMockUser();
    const mockClient = createOrgNotFoundMockClient(mockUser.id, mockUser.email);
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'nonexistent-org' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch organization');
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = createMockUser();
    const mockClient = createDatabaseErrorMockClient(mockUser.id, mockUser.email);
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Organization not found or access denied');
  });
});
