/**
 * Success cases for GET /api/organizations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/organizations/route';
import {
  createAuthenticatedMockClient,
} from '@/test-utils/supabase-test-helpers';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';

describe('GET /api/organizations - Success Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return organizations for authenticated user', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'user-123' });
    const mockOrg = createMockOrganization({ id: 'org-1', name: 'Test Org 1' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        const selectFn = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  role: 'owner',
                  joined_at: '2025-01-01T00:00:00Z',
                  organization: mockOrg,
                },
              ],
              error: null,
            }),
          }),
        });

        const inFn = jest.fn().mockResolvedValue({
          data: [{ organization_id: 'org-1' }],
          error: null,
        });

        return {
          select: jest.fn((arg: string) => {
            if (arg === 'organization_id') {
              return { in: inFn };
            }
            return selectFn(arg);
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organizations).toBeDefined();
    expect(data.organizations).toHaveLength(1);
    expect(data.organizations[0]).toMatchObject({
      id: 'org-1',
      name: 'Test Org 1',
      user_role: 'owner',
      member_count: 1,
    });
  });

  it('should return empty array when user has no organizations', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.organizations).toEqual([]);
  });
});
