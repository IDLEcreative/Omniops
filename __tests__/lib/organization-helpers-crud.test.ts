import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  getUserOrganizationMembership,
  hasOrganizationRole,
  isOrganizationMember,
  getOrganizationWithRole,
  hasReachedSeatLimit
} from '@/lib/organization-helpers';

describe('Organization Helpers - Membership & CRUD', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = { from: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserOrganizationMembership', () => {
    it('should return user organization membership successfully', async () => {
      const mockMembership = { role: 'owner' };
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockMembership,
          error: null
        })
      });

      const result = await getUserOrganizationMembership(mockSupabase, 'org-456', 'user-123');

      expect(result).toEqual(mockMembership);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should return null for non-member', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await getUserOrganizationMembership(mockSupabase, 'org-456', 'user-123');
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      const result = await getUserOrganizationMembership(mockSupabase, 'org-456', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('hasOrganizationRole', () => {
    it('should return true when user has required role', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null
        })
      });

      const result = await hasOrganizationRole(mockSupabase, 'org-456', 'user-123', 'member');
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { role: 'viewer' },
          error: null
        })
      });

      const result = await hasOrganizationRole(mockSupabase, 'org-456', 'user-123', 'admin');
      expect(result).toBe(false);
    });

    it('should return false for non-member', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await hasOrganizationRole(mockSupabase, 'org-456', 'user-123', 'member');
      expect(result).toBe(false);
    });
  });

  describe('isOrganizationMember', () => {
    it('should return true when user is a member', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { role: 'member' },
          error: null
        })
      });

      const result = await isOrganizationMember(mockSupabase, 'org-456', 'user-123');
      expect(result).toBe(true);
    });

    it('should return false when user is not a member', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await isOrganizationMember(mockSupabase, 'org-456', 'user-123');
      expect(result).toBe(false);
    });
  });

  describe('getOrganizationWithRole', () => {
    it('should return organization with user role successfully', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'org-456', name: 'Test Org', slug: 'test-org' },
              error: null
            })
          };
        }
      });

      const result = await getOrganizationWithRole(mockSupabase, 'org-456', 'user-123');
      expect(result).toBeDefined();
      expect(result?.user_role).toBe('admin');
    });

    it('should return null for non-member', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await getOrganizationWithRole(mockSupabase, 'org-456', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('hasReachedSeatLimit', () => {
    it('should return false when members < seat limit', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { seat_limit: 10 },
              error: null
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              count: 5,
              error: null
            })
          };
        }
      });

      const result = await hasReachedSeatLimit(mockSupabase, 'org-456');
      expect(result).toBe(false);
    });

    it('should return true when members >= seat limit', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { seat_limit: 10 },
              error: null
            })
          };
        } else {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              count: 10,
              error: null
            })
          };
        }
      });

      const result = await hasReachedSeatLimit(mockSupabase, 'org-456');
      expect(result).toBe(true);
    });
  });
});
