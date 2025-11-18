import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import {
  getOrganizationIdFromDomain,
  verifyDomainAccess,
  getOrganizationDomains,
  formatOrganizationSlug,
  generateInvitationToken,
  validateInvitationToken
} from '@/lib/organization-helpers';

describe('Organization Helpers - Utilities & Domains', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = { from: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatOrganizationSlug', () => {
    it('should format organization name to slug correctly', () => {
      expect(formatOrganizationSlug('My Organization')).toBe('my-organization');
    });

    it('should replace multiple spaces with single hyphen', () => {
      expect(formatOrganizationSlug('My   Organization')).toBe('my-organization');
    });

    it('should remove special characters', () => {
      expect(formatOrganizationSlug('My@Org#Name!')).toBe('myorgname');
    });

    it('should trim hyphens from start and end', () => {
      expect(formatOrganizationSlug('-My-Org-')).toBe('my-org');
    });

    it('should handle underscores', () => {
      expect(formatOrganizationSlug('My_Org_Name')).toBe('my-org-name');
    });
  });

  describe('generateInvitationToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateInvitationToken();

      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('should generate different tokens on multiple calls', () => {
      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('validateInvitationToken', () => {
    it('should accept valid tokens', () => {
      const validToken = 'a'.repeat(64);
      expect(validateInvitationToken(validToken)).toBe(true);
    });

    it('should reject tokens that are too short', () => {
      expect(validateInvitationToken('abc')).toBe(false);
    });

    it('should reject tokens with invalid characters', () => {
      const invalidToken = 'z'.repeat(64);
      expect(validateInvitationToken(invalidToken)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateInvitationToken(123)).toBe(false);
      expect(validateInvitationToken(null)).toBe(false);
      expect(validateInvitationToken(undefined)).toBe(false);
    });

    it('should be case-sensitive (only lowercase hex)', () => {
      const uppercaseToken = 'A'.repeat(64);
      expect(validateInvitationToken(uppercaseToken)).toBe(false);
    });
  });

  describe('getOrganizationIdFromDomain', () => {
    it('should return organization ID from domain', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      });

      const result = await getOrganizationIdFromDomain(mockSupabase, 'example.com');

      expect(result).toBe('org-456');
      expect(mockSupabase.from).toHaveBeenCalledWith('domains');
    });

    it('should return null when domain not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await getOrganizationIdFromDomain(mockSupabase, 'nonexistent.com');
      expect(result).toBeNull();
    });
  });

  describe('getOrganizationDomains', () => {
    it('should return organization domains successfully', async () => {
      const mockDomains = [
        { id: '1', domain: 'example.com', organization_id: 'org-456' },
        { id: '2', domain: 'example.org', organization_id: 'org-456' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockDomains,
          error: null
        })
      });

      const result = await getOrganizationDomains(mockSupabase, 'org-456');
      expect(result).toEqual(mockDomains);
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      });

      const result = await getOrganizationDomains(mockSupabase, 'org-456');
      expect(result).toEqual([]);
    });
  });
});
