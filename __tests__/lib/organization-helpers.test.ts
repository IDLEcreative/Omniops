import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/core';
import {
  checkUserPermission,
  getUserOrganizations,
  getOrganizationMembers,
  validateSeatAvailability,
  canInviteMembers,
  canManageOrganization,
  canViewOrganization,
  getRoleHierarchy,
  isRoleGreaterOrEqual,
  formatOrganizationSlug,
  generateInvitationToken,
  validateInvitationToken,
  calculateSeatUsage,
  getOrganizationBySlug,
  getUserRoleInOrganization
} from '@/lib/organization-helpers';
import { createServerClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn()
}));

describe('Organization Helpers', () => {
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

  describe('checkUserPermission', () => {
    it('should return true for owner with any action', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({
        data: { role: 'owner' },
        error: null
      });

      const hasPermission = await checkUserPermission(
        'user-123',
        'org-456',
        'delete'
      );

      expect(hasPermission).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('should return false for viewer trying to invite', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({
        data: { role: 'viewer' },
        error: null
      });

      const hasPermission = await checkUserPermission(
        'user-123',
        'org-456',
        'invite'
      );

      expect(hasPermission).toBe(false);
    });

    it('should return true for admin trying to invite', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({
        data: { role: 'admin' },
        error: null
      });

      const hasPermission = await checkUserPermission(
        'user-123',
        'org-456',
        'invite'
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false for non-member', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const hasPermission = await checkUserPermission(
        'user-123',
        'org-456',
        'view'
      );

      expect(hasPermission).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const hasPermission = await checkUserPermission(
        'user-123',
        'org-456',
        'view'
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('validateSeatAvailability', () => {
    it('should return true when seats are available', async () => {
      // Mock organization data
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 10, plan_type: 'professional' },
        error: null
      });

      // Mock member count
      mockSupabase.from().count.mockResolvedValueOnce({
        count: 5,
        error: null
      });

      // Mock pending invitation count
      mockSupabase.from().count.mockResolvedValueOnce({
        count: 2,
        error: null
      });

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(true);
      expect(result.availableSeats).toBe(3); // 10 - 5 - 2
      expect(result.currentUsage).toBe(7);
      expect(result.seatLimit).toBe(10);
    });

    it('should return false when at seat limit', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 5, plan_type: 'starter' },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 4,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 1,
        error: null
      });

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.availableSeats).toBe(0);
      expect(result.currentUsage).toBe(5);
    });

    it('should handle unlimited seats (enterprise plan)', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: -1, plan_type: 'enterprise' },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 100,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 50,
        error: null
      });

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(true);
      expect(result.availableSeats).toBe(Infinity);
      expect(result.currentUsage).toBe(150);
      expect(result.isUnlimited).toBe(true);
    });

    it('should handle multiple additional seats request', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 10 },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 6,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 1,
        error: null
      });

      const result = await validateSeatAvailability('org-456', 3);

      expect(result.hasAvailableSeats).toBe(true); // Can add 3 more (7 + 3 = 10)
      expect(result.availableSeats).toBe(3);

      const result2 = await validateSeatAvailability('org-456', 4);
      expect(result2.hasAvailableSeats).toBe(false); // Cannot add 4 (7 + 4 = 11 > 10)
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

  describe('Utility Functions', () => {
    describe('formatOrganizationSlug', () => {
      it('should format organization name to valid slug', () => {
        expect(formatOrganizationSlug('Acme Corporation')).toBe('acme-corporation');
        expect(formatOrganizationSlug('My Company 123')).toBe('my-company-123');
        expect(formatOrganizationSlug('Special!@#$%^&*()_+=')).toBe('special');
        expect(formatOrganizationSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
        expect(formatOrganizationSlug('CamelCaseCompany')).toBe('camelcasecompany');
      });

      it('should handle edge cases', () => {
        expect(formatOrganizationSlug('')).toBe('');
        expect(formatOrganizationSlug('123')).toBe('123');
        expect(formatOrganizationSlug('---')).toBe('');
        expect(formatOrganizationSlug('a-b-c')).toBe('a-b-c');
      });
    });

    describe('generateInvitationToken', () => {
      it('should generate a 64-character hex token', () => {
        const token = generateInvitationToken();
        expect(token).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
      });

      it('should generate unique tokens', () => {
        const tokens = new Set();
        for (let i = 0; i < 100; i++) {
          tokens.add(generateInvitationToken());
        }
        expect(tokens.size).toBe(100);
      });
    });

    describe('validateInvitationToken', () => {
      it('should validate correct token format', () => {
        const validToken = generateInvitationToken();
        expect(validateInvitationToken(validToken)).toBe(true);

        expect(validateInvitationToken('abc123')).toBe(false);
        expect(validateInvitationToken('')).toBe(false);
        expect(validateInvitationToken('z'.repeat(64))).toBe(false);
        expect(validateInvitationToken('a'.repeat(63))).toBe(false);
      });
    });
  });

  describe('calculateSeatUsage', () => {
    it('should calculate correct seat usage statistics', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 15, plan_type: 'professional' },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 8,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 3,
        error: null
      });

      const usage = await calculateSeatUsage('org-456');

      expect(usage).toEqual({
        used: 8,
        pending: 3,
        total: 11,
        limit: 15,
        available: 4,
        percentage: 73.33,
        isAtLimit: false,
        isNearLimit: false, // 73% < 80%
        planType: 'professional'
      });
    });

    it('should detect when near limit (>= 80%)', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 10, plan_type: 'starter' },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 7,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 1,
        error: null
      });

      const usage = await calculateSeatUsage('org-456');

      expect(usage.percentage).toBe(80);
      expect(usage.isNearLimit).toBe(true);
      expect(usage.isAtLimit).toBe(false);
    });

    it('should detect when at limit', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: { seat_limit: 5, plan_type: 'free' },
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 4,
        error: null
      });

      mockSupabase.from().count.mockResolvedValueOnce({
        count: 1,
        error: null
      });

      const usage = await calculateSeatUsage('org-456');

      expect(usage.percentage).toBe(100);
      expect(usage.isAtLimit).toBe(true);
      expect(usage.available).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.from().single.mockRejectedValue(
        new Error('Connection timeout')
      );

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.error).toBe('Failed to fetch organization data');
    });

    it('should handle null organization gracefully', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await validateSeatAvailability('org-456');

      expect(result.hasAvailableSeats).toBe(false);
      expect(result.error).toBe('Organization not found');
    });
  });
});