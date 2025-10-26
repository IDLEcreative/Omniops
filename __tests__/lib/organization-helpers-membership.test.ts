import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  checkUserPermission,
  validateSeatAvailability,
  canInviteMembers,
  canManageOrganization,
  canViewOrganization,
  getRoleHierarchy,
  isRoleGreaterOrEqual,
  calculateSeatUsage
} from '@/lib/organization-helpers';
import { createServerClient } from '@/lib/supabase/server';
import {
  createMockSupabaseClient,
  mockResponses,
  testScenarios
} from './__mocks__/organization-test-helpers';

describe('Organization Helpers - Membership & Permissions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserPermission', () => {
    it('should return true for owner with any action', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue(mockResponses.member('owner'));

      const hasPermission = await checkUserPermission('user-123', 'org-456', 'delete');

      expect(hasPermission).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should return false for viewer trying to invite', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue(mockResponses.member('viewer'));

      const hasPermission = await checkUserPermission('user-123', 'org-456', 'invite');

      expect(hasPermission).toBe(false);
    });

    it('should return true for admin trying to invite', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue(mockResponses.member('admin'));

      const hasPermission = await checkUserPermission('user-123', 'org-456', 'invite');

      expect(hasPermission).toBe(true);
    });

    it('should return false for non-member', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue(mockResponses.noMember());

      const hasPermission = await checkUserPermission('user-123', 'org-456', 'view');

      expect(hasPermission).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue(mockResponses.error('Database error'));

      const hasPermission = await checkUserPermission('user-123', 'org-456', 'view');

      expect(hasPermission).toBe(false);
    });
  });

  describe('validateSeatAvailability', () => {
    it('should return true when seats are available', async () => {
      testScenarios.setupSeats(mockSupabase, 10, 5, 2, 'professional');

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(true);
      expect(result.availableSeats).toBe(3);
      expect(result.currentUsage).toBe(7);
      expect(result.seatLimit).toBe(10);
    });

    it('should return false when at seat limit', async () => {
      testScenarios.setupSeats(mockSupabase, 5, 4, 1, 'starter');

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.availableSeats).toBe(0);
      expect(result.currentUsage).toBe(5);
    });

    it('should handle unlimited seats (enterprise plan)', async () => {
      testScenarios.setupUnlimitedSeats(mockSupabase, 100, 50);

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(true);
      expect(result.availableSeats).toBe(Infinity);
      expect(result.currentUsage).toBe(150);
      expect(result.isUnlimited).toBe(true);
    });

    it('should handle multiple additional seats request', async () => {
      testScenarios.setupSeats(mockSupabase, 10, 6, 1);

      const result = await validateSeatAvailability('org-456', 3);

      expect(result.hasAvailableSeats).toBe(true);
      expect(result.availableSeats).toBe(3);

      const result2 = await validateSeatAvailability('org-456', 4);
      expect(result2.hasAvailableSeats).toBe(false);
    });

    it('should handle database connection errors', async () => {
      mockSupabase.from().single.mockRejectedValue(new Error('Connection timeout'));

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.error).toBe('Failed to fetch organization data');
    });

    it('should handle null organization gracefully', async () => {
      mockSupabase.from().single.mockResolvedValue(mockResponses.noMember());

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.error).toBe('Organization not found');
    });
  });

  describe('calculateSeatUsage', () => {
    it('should calculate correct seat usage statistics', async () => {
      testScenarios.setupSeats(mockSupabase, 15, 8, 3, 'professional');

      const usage = await calculateSeatUsage('org-456');

      expect(usage).toEqual({
        used: 8,
        pending: 3,
        total: 11,
        limit: 15,
        available: 4,
        percentage: 73.33,
        isAtLimit: false,
        isNearLimit: false,
        planType: 'professional'
      });
    });

    it('should detect when near limit (>= 80%)', async () => {
      testScenarios.setupSeats(mockSupabase, 10, 7, 1, 'starter');

      const usage = await calculateSeatUsage('org-456');

      expect(usage.percentage).toBe(80);
      expect(usage.isNearLimit).toBe(true);
      expect(usage.isAtLimit).toBe(false);
    });

    it('should detect when at limit', async () => {
      testScenarios.setupSeats(mockSupabase, 5, 4, 1, 'free');

      const usage = await calculateSeatUsage('org-456');

      expect(usage.percentage).toBe(100);
      expect(usage.isAtLimit).toBe(true);
      expect(usage.available).toBe(0);
    });
  });

  describe('Role Hierarchy', () => {
    describe('getRoleHierarchy', () => {
      it('should return correct hierarchy levels', () => {
        expect(getRoleHierarchy('owner')).toBe(4);
        expect(getRoleHierarchy('admin')).toBe(3);
        expect(getRoleHierarchy('member')).toBe(2);
        expect(getRoleHierarchy('viewer')).toBe(1);
        expect(getRoleHierarchy('invalid' as any)).toBe(0);
      });
    });

    describe('isRoleGreaterOrEqual', () => {
      it('should correctly compare role hierarchies', () => {
        expect(isRoleGreaterOrEqual('owner', 'admin')).toBe(true);
        expect(isRoleGreaterOrEqual('owner', 'owner')).toBe(true);
        expect(isRoleGreaterOrEqual('admin', 'owner')).toBe(false);
        expect(isRoleGreaterOrEqual('member', 'viewer')).toBe(true);
        expect(isRoleGreaterOrEqual('viewer', 'member')).toBe(false);
      });
    });
  });

  describe('Permission Helpers', () => {
    describe('canInviteMembers', () => {
      it('should return true for owner and admin', () => {
        expect(canInviteMembers('owner')).toBe(true);
        expect(canInviteMembers('admin')).toBe(true);
        expect(canInviteMembers('member')).toBe(false);
        expect(canInviteMembers('viewer')).toBe(false);
      });
    });

    describe('canManageOrganization', () => {
      it('should return true only for owner and admin', () => {
        expect(canManageOrganization('owner')).toBe(true);
        expect(canManageOrganization('admin')).toBe(true);
        expect(canManageOrganization('member')).toBe(false);
        expect(canManageOrganization('viewer')).toBe(false);
      });
    });

    describe('canViewOrganization', () => {
      it('should return true for all valid roles', () => {
        expect(canViewOrganization('owner')).toBe(true);
        expect(canViewOrganization('admin')).toBe(true);
        expect(canViewOrganization('member')).toBe(true);
        expect(canViewOrganization('viewer')).toBe(true);
      });
    });
  });
});
