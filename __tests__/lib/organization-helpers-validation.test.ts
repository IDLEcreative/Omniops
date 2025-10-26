import { describe, it, expect } from '@jest/globals';
import {
  formatOrganizationSlug,
  generateInvitationToken,
  validateInvitationToken
} from '@/lib/organization-helpers';

describe('Organization Helpers - Validation & Utilities', () => {
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

    it('should handle Unicode characters', () => {
      expect(formatOrganizationSlug('Café München')).toBe('caf-mnchen');
      expect(formatOrganizationSlug('北京公司')).toBe('');
      expect(formatOrganizationSlug('Company™®')).toBe('company');
    });

    it('should handle mixed case and numbers', () => {
      expect(formatOrganizationSlug('ABC123def456')).toBe('abc123def456');
      expect(formatOrganizationSlug('Test-Company_2024')).toBe('test-company-2024');
      expect(formatOrganizationSlug('V2.0-BETA')).toBe('v20-beta');
    });

    it('should collapse multiple hyphens', () => {
      expect(formatOrganizationSlug('Test---Company')).toBe('test-company');
      expect(formatOrganizationSlug('A--B--C')).toBe('a-b-c');
      expect(formatOrganizationSlug('- - -')).toBe('');
    });

    it('should trim hyphens from edges', () => {
      expect(formatOrganizationSlug('-Company-')).toBe('company');
      expect(formatOrganizationSlug('---Test---')).toBe('test');
      expect(formatOrganizationSlug('-')).toBe('');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(100);
      const slug = formatOrganizationSlug(longName);
      expect(slug).toBe('a'.repeat(100));
      expect(slug.length).toBe(100);
    });

    it('should preserve valid existing slugs', () => {
      expect(formatOrganizationSlug('already-valid-slug')).toBe('already-valid-slug');
      expect(formatOrganizationSlug('test123')).toBe('test123');
      expect(formatOrganizationSlug('my-company-2024')).toBe('my-company-2024');
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

    it('should only contain lowercase hex characters', () => {
      const token = generateInvitationToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token).not.toMatch(/[A-F]/);
      expect(token).not.toMatch(/[g-z]/);
    });

    it('should generate cryptographically random tokens', () => {
      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();
      const token3 = generateInvitationToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });

    it('should generate consistent length tokens', () => {
      for (let i = 0; i < 50; i++) {
        const token = generateInvitationToken();
        expect(token.length).toBe(64);
      }
    });
  });

  describe('validateInvitationToken', () => {
    it('should validate correct token format', () => {
      const validToken = generateInvitationToken();
      expect(validateInvitationToken(validToken)).toBe(true);
    });

    it('should reject tokens with incorrect length', () => {
      expect(validateInvitationToken('abc123')).toBe(false);
      expect(validateInvitationToken('')).toBe(false);
      expect(validateInvitationToken('a'.repeat(63))).toBe(false);
      expect(validateInvitationToken('a'.repeat(65))).toBe(false);
    });

    it('should reject tokens with invalid characters', () => {
      expect(validateInvitationToken('z'.repeat(64))).toBe(false);
      expect(validateInvitationToken('G'.repeat(64))).toBe(false);
      expect(validateInvitationToken('!'.repeat(64))).toBe(false);
      expect(validateInvitationToken(' '.repeat(64))).toBe(false);
    });

    it('should reject uppercase hex tokens', () => {
      expect(validateInvitationToken('A'.repeat(64))).toBe(false);
      expect(validateInvitationToken('ABCDEF1234567890'.repeat(4))).toBe(false);
    });

    it('should accept valid lowercase hex tokens', () => {
      expect(validateInvitationToken('a'.repeat(64))).toBe(true);
      expect(validateInvitationToken('0'.repeat(64))).toBe(true);
      expect(validateInvitationToken('f'.repeat(64))).toBe(true);
      expect(validateInvitationToken('0123456789abcdef'.repeat(4))).toBe(true);
    });

    it('should reject tokens with special characters', () => {
      const invalidToken = 'a'.repeat(63) + '!';
      expect(validateInvitationToken(invalidToken)).toBe(false);

      const tokenWithSpace = 'a'.repeat(63) + ' ';
      expect(validateInvitationToken(tokenWithSpace)).toBe(false);

      const tokenWithDash = 'a'.repeat(63) + '-';
      expect(validateInvitationToken(tokenWithDash)).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateInvitationToken(null as any)).toBe(false);
      expect(validateInvitationToken(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validateInvitationToken(12345 as any)).toBe(false);
      expect(validateInvitationToken({} as any)).toBe(false);
      expect(validateInvitationToken([] as any)).toBe(false);
    });

    it('should validate multiple generated tokens', () => {
      for (let i = 0; i < 20; i++) {
        const token = generateInvitationToken();
        expect(validateInvitationToken(token)).toBe(true);
      }
    });
  });

  describe('Edge Cases & Security', () => {
    it('should handle slug injection attempts', () => {
      expect(formatOrganizationSlug('../../../etc/passwd')).toBe('etcpasswd');
      expect(formatOrganizationSlug('<script>alert("xss")</script>')).toBe('scriptalertxssscript');
      expect(formatOrganizationSlug('"; DROP TABLE organizations; --')).toBe('drop-table-organizations');
    });

    it('should handle token validation edge cases', () => {
      expect(validateInvitationToken('0000000000000000000000000000000000000000000000000000000000000000')).toBe(true);
      expect(validateInvitationToken('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')).toBe(true);
      expect(validateInvitationToken('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')).toBe(true);
    });

    it('should handle whitespace in slugs', () => {
      expect(formatOrganizationSlug('\t\n\r  Test  \t\n\r')).toBe('test');
      expect(formatOrganizationSlug('Tab\tSeparated\tCompany')).toBe('tab-separated-company');
      expect(formatOrganizationSlug('New\nLine\nCompany')).toBe('new-line-company');
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const token = generateInvitationToken();
        expect(validateInvitationToken(token)).toBe(true);
        tokens.add(token);
      }

      expect(tokens.size).toBe(iterations);
    });
  });
});
