import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  getUserOrganizations,
  getOrganizationMembers,
  getOrganizationBySlug,
  getUserRoleInOrganization
} from '@/lib/organization-helpers';
import { createServerClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn()
}));

describe('Organization Helpers - CRUD Operations', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis()
      }))
    };
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations successfully', async () => {
      const mockOrganizations = [
        { id: 'org-1', name: 'Org 1', role: 'owner' },
        { id: 'org-2', name: 'Org 2', role: 'member' }
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockOrganizations,
        error: null
      });

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual(mockOrganizations);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should handle empty organizations list', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getOrganizationMembers', () => {
    it('should return organization members successfully', async () => {
      const mockMembers = [
        { user_id: 'user-1', role: 'owner', email: 'owner@test.com' },
        { user_id: 'user-2', role: 'member', email: 'member@test.com' }
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockMembers,
        error: null
      });

      const result = await getOrganizationMembers('org-456');

      expect(result).toEqual(mockMembers);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should handle empty members list', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getOrganizationMembers('org-456');

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getOrganizationMembers('org-456');

      expect(result).toEqual([]);
    });

    it('should order members by role hierarchy', async () => {
      const mockMembers = [
        { user_id: 'user-1', role: 'owner' },
        { user_id: 'user-2', role: 'admin' },
        { user_id: 'user-3', role: 'member' }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockMembers,
        error: null
      });

      const result = await getOrganizationMembers('org-456');

      expect(mockSupabase.from().order).toHaveBeenCalled();
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getOrganizationBySlug', () => {
    it('should return organization by slug successfully', async () => {
      const mockOrganization = {
        id: 'org-456',
        name: 'Test Org',
        slug: 'test-org',
        plan_type: 'professional'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockOrganization,
        error: null
      });

      const result = await getOrganizationBySlug('test-org');

      expect(result).toEqual(mockOrganization);
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
    });

    it('should return null for non-existent slug', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await getOrganizationBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getOrganizationBySlug('test-org');

      expect(result).toBeNull();
    });
  });

  describe('getUserRoleInOrganization', () => {
    it('should return user role successfully', async () => {
      mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });

      const result = await getUserRoleInOrganization('user-123', 'org-456');

      expect(result).toBe('admin');
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should return null for non-member', async () => {
      mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getUserRoleInOrganization('user-123', 'org-456');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await getUserRoleInOrganization('user-123', 'org-456');

      expect(result).toBeNull();
    });

    it('should return correct role for each role type', async () => {
      const roles = ['owner', 'admin', 'member', 'viewer'];

      for (const role of roles) {
        mockSupabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
          data: { role },
          error: null
        });

        const result = await getUserRoleInOrganization('user-123', 'org-456');

        expect(result).toBe(role);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection timeouts', async () => {
      mockSupabase.from().select().eq.mockRejectedValue(
        new Error('Connection timeout')
      );

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual([]);
    });

    it('should handle null responses gracefully', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual([]);
    });

    it('should handle malformed responses', async () => {
      mockSupabase.from().select().eq.mockResolvedValue({
        data: undefined,
        error: null
      });

      const result = await getUserOrganizations('user-123');

      expect(result).toEqual([]);
    });
  });
});
