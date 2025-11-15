/**
 * Data validation tests for GET /api/organizations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/organizations/route';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';

describe('GET /api/organizations - Data Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter organizations by user ID correctly', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser({ id: 'user-specific-123' });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    let capturedUserId: string | null = null;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn((field: string, value: string) => {
              if (field === 'user_id') {
                capturedUserId = value;
              }
              return {
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              };
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    createClient.mockResolvedValue(mockClient);

    await GET();

    expect(capturedUserId).toBe('user-specific-123');
  });

  it('should return proper organization shape with all required fields', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockOrg = createMockOrganization({
      id: 'org-full-test',
      name: 'Full Test Org',
      slug: 'full-test-org',
      settings: { theme: 'dark' },
      plan_type: 'pro',
      seat_limit: 10,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        const selectFn = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  role: 'admin',
                  joined_at: '2025-01-02T00:00:00Z',
                  organization: mockOrg,
                },
              ],
              error: null,
            }),
          }),
        });

        const inFn = jest.fn().mockResolvedValue({
          data: [
            { organization_id: 'org-full-test' },
            { organization_id: 'org-full-test' },
            { organization_id: 'org-full-test' },
          ],
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
    expect(data.organizations[0]).toMatchObject({
      id: 'org-full-test',
      name: 'Full Test Org',
      slug: 'full-test-org',
      settings: { theme: 'dark' },
      plan_type: 'pro',
      seat_limit: 10,
      user_role: 'admin',
      member_count: 3,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
  });

  it('should return multiple organizations for user with multiple memberships', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockUser = createMockUser();
    const mockOrg1 = createMockOrganization({ id: 'org-1', name: 'Org One' });
    const mockOrg2 = createMockOrganization({ id: 'org-2', name: 'Org Two' });
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
                  organization: mockOrg1,
                },
                {
                  role: 'member',
                  joined_at: '2025-01-02T00:00:00Z',
                  organization: mockOrg2,
                },
              ],
              error: null,
            }),
          }),
        });

        const inFn = jest.fn().mockResolvedValue({
          data: [
            { organization_id: 'org-1' },
            { organization_id: 'org-1' },
            { organization_id: 'org-2' },
          ],
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
    expect(data.organizations).toHaveLength(2);
    expect(data.organizations[0]).toMatchObject({
      id: 'org-1',
      name: 'Org One',
      user_role: 'owner',
      member_count: 2,
    });
    expect(data.organizations[1]).toMatchObject({
      id: 'org-2',
      name: 'Org Two',
      user_role: 'member',
      member_count: 1,
    });
  });
});
